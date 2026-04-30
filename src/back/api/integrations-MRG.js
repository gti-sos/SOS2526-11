// =====================================================================
// integrations-MRG.js  (Miguel Ridao)
// 3 widgets sobre alcohol-consumptions-per-capita con OAuth2 real (client_credentials):
//   - Vimeo        -> bubble
//   - Dailymotion  -> treemap
//   - Discord      -> packedbubble
// Combina los datos externos con la DB propia alcohol-consumptions-per-capita-v2.db.
// =====================================================================

import { dbAlcohol as db } from "./db.js";

export const BASE_URL_INTEGRATIONS_MRG = "/api/integrations/mrg";

const tokenCache = new Map();

function fetchT(url, opts = {}, ms = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(t));
}

async function getToken(key, fetcher) {
  const now = Date.now();
  const c = tokenCache.get(key);
  if (c && c.expiresAt > now + 30_000) return c.token;
  const { token, expiresIn } = await fetcher();
  tokenCache.set(key, { token, expiresAt: now + expiresIn * 1000 });
  return token;
}

async function vimeoToken() {
  const creds = Buffer.from(`${process.env.VIMEO_CLIENT_ID}:${process.env.VIMEO_CLIENT_SECRET}`).toString("base64");
  const r = await fetchT("https://api.vimeo.com/oauth/authorize/client", {
    method: "POST",
    headers: {
      Authorization: `Basic ${creds}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.vimeo.*+json;version=3.4",
    },
    body: JSON.stringify({ grant_type: "client_credentials", scope: "public" }),
  });
  if (!r.ok) throw new Error(`Vimeo OAuth -> ${r.status}`);
  const j = await r.json();
  return { token: j.access_token, expiresIn: j.expires_in || 3600 };
}

async function dailymotionToken() {
  const r = await fetchT("https://api.dailymotion.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.DAILYMOTION_CLIENT_ID,
      client_secret: process.env.DAILYMOTION_CLIENT_SECRET,
      grant_type: "client_credentials",
    }),
  });
  if (!r.ok) throw new Error(`Dailymotion OAuth -> ${r.status}`);
  const j = await r.json();
  return { token: j.access_token, expiresIn: j.expires_in || 3600 };
}

async function discordToken() {
  const r = await fetchT("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type: "client_credentials",
      scope: "identify",
    }),
  });
  if (!r.ok) throw new Error(`Discord OAuth -> ${r.status}`);
  const j = await r.json();
  return { token: j.access_token, expiresIn: j.expires_in || 604800 };
}

export function loadBackendIntegrationsMRG(app) {
  const findAll = () => new Promise((res, rej) =>
    db.find({}, (err, docs) => (err ? rej(err) : res(docs)))
  );

  // -------- 1. Vimeo -> bubble ------------------------------------------
  app.get(BASE_URL_INTEGRATIONS_MRG + "/vimeo-alcohol", async (req, res) => {
    try {
      let factor = 8;
      try {
        const token = await getToken("mrg_vimeo", vimeoToken);
        const ext = await fetchT(
          "https://api.vimeo.com/videos?query=alcohol+consumption&per_page=10",
          { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.vimeo.*+json;version=3.4" } }
        ).then(r => r.json());
        factor = Math.min(ext.total || 8, 50);
      } catch (e) { console.warn("Vimeo fallback:", e.message); }

      const docs = await findAll();
      const data = docs.map(d => ({
        x: d.alcohol_consumption ?? d.consumption ?? 0,
        y: 80 - (d.alcohol_consumption ?? d.consumption ?? 0) * 0.5,
        z: Math.max(1, factor / 5),
        name: d.country ?? d.nation,
      }));

      res.json({ chartType: "bubble", series: [{ name: "Alcohol vs salud", data }] });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // -------- 2. Dailymotion -> treemap -----------------------------------
  app.get(BASE_URL_INTEGRATIONS_MRG + "/dailymotion-alcohol", async (req, res) => {
    try {
      let videoCount = 12;
      try {
        const token = await getToken("mrg_dailymotion", dailymotionToken);
        const ext = await fetchT(
          "https://api.dailymotion.com/videos?search=alcohol&limit=20&fields=id,title",
          { headers: { Authorization: `Bearer ${token}` } }
        ).then(r => r.json());
        videoCount = ext.list?.length || 12;
      } catch (e) { console.warn("Dailymotion fallback:", e.message); }

      const docs = await findAll();
      const byYear = {};
      docs.forEach(d => {
        const y = String(d.year ?? d.date_year);
        if (!byYear[y]) byYear[y] = [];
        byYear[y].push({
          name: `${d.country ?? d.nation} ${y}`,
          parent: y,
          value: (d.alcohol_consumption ?? d.consumption ?? 0) * Math.log10(videoCount + 1),
        });
      });
      const data = [];
      Object.keys(byYear).forEach(y => {
        data.push({ id: y, name: y });
        data.push(...byYear[y]);
      });

      res.json({ chartType: "treemap", data });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // -------- 3. Discord -> packedbubble ----------------------------------
  app.get(BASE_URL_INTEGRATIONS_MRG + "/discord-alcohol", async (req, res) => {
    try {
      let discordFactor = 10;
      try {
        const token = await getToken("mrg_discord", discordToken);
        const ext = await fetchT("https://discord.com/api/oauth2/@me", {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json());
        // Usamos el scope del token como factor simbólico
        discordFactor = (ext.scopes?.length ?? 1) * 10;
      } catch (e) { console.warn("Discord fallback:", e.message); }

      const docs = await findAll();
      const byCountry = {};
      docs.forEach(d => {
        const c = d.country ?? d.nation;
        if (!byCountry[c]) byCountry[c] = [];
        byCountry[c].push({
          name: `${c} ${d.year ?? d.date_year}`,
          value: (d.alcohol_consumption ?? d.consumption ?? 0) + discordFactor / 10,
        });
      });
      const series = Object.entries(byCountry).map(([name, data]) => ({ name, data }));

      res.json({ chartType: "packedbubble", series });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
}
