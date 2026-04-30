// =====================================================================
// integrations-MRG.js  (Miguel Ridao)
// 3 widgets sobre alcohol-consumptions-per-capita con OAuth2 real:
//   - Fitbit         -> bubble
//   - Withings       -> treemap
//   - Apple Health   -> packedbubble
// Combina los datos externos con la DB propia alcohol-consumptions-per-capita-v2.db.
// =====================================================================

import Datastore from "nedb";

export const BASE_URL_INTEGRATIONS_MRG = "/api/integrations/mrg";

const tokenCache = new Map();

async function getToken(key, fetcher) {
  const now = Date.now();
  const c = tokenCache.get(key);
  if (c && c.expiresAt > now + 30_000) return c.token;
  const { token, expiresIn } = await fetcher();
  tokenCache.set(key, { token, expiresAt: now + expiresIn * 1000 });
  return token;
}

async function refreshGrant({ tokenUrl, clientId, clientSecret, refreshToken }) {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });
  const r = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!r.ok) throw new Error(`OAuth ${tokenUrl} -> ${r.status}`);
  const j = await r.json();
  return { token: j.access_token, expiresIn: j.expires_in || 3600 };
}

async function clientCredentials({ tokenUrl, clientId, clientSecret, scope }) {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    ...(scope ? { scope } : {}),
  });
  const r = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!r.ok) throw new Error(`OAuth ${tokenUrl} -> ${r.status}`);
  const j = await r.json();
  return { token: j.access_token, expiresIn: j.expires_in || 3600 };
}

export function loadBackendIntegrationsMRG(app) {
  const db = new Datastore({ filename: "./data/alcohol-consumptions-per-capita-v2.db", autoload: true });

  const findAll = () => new Promise((res, rej) =>
    db.find({}, (err, docs) => (err ? rej(err) : res(docs)))
  );

  // -------- 1. Fitbit -> bubble -----------------------------------------
  app.get(BASE_URL_INTEGRATIONS_MRG + "/fitbit-activity", async (req, res) => {
    try {
      const token = await getToken("mrg_fitbit", () => refreshGrant({
        tokenUrl: "https://api.fitbit.com/oauth2/token",
        clientId: process.env.FITBIT_CLIENT_ID,
        clientSecret: process.env.FITBIT_CLIENT_SECRET,
        refreshToken: process.env.FITBIT_REFRESH_TOKEN,
      }));

      const ext = await fetch("https://api.fitbit.com/1/user/-/activities/date/today.json", {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json());

      const stepsToday = ext.summary?.steps || 0;

      // Bubble: x=consumo alcohol, y=esperanza de vida proxy (calc), z=pasos Fitbit
      const docs = await findAll();
      const data = docs.map(d => ({
        x: d.alcohol_consumption ?? d.consumption ?? 0,
        y: 80 - (d.alcohol_consumption ?? 0) * 0.5,
        z: Math.max(1, stepsToday / 1000),
        name: d.country,
      }));

      res.json({ chartType: "bubble", series: [{ name: "Alcohol vs salud", data }] });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // -------- 2. Withings -> treemap --------------------------------------
  app.get(BASE_URL_INTEGRATIONS_MRG + "/withings-health", async (req, res) => {
    try {
      const token = await getToken("mrg_withings", () => refreshGrant({
        tokenUrl: "https://wbsapi.withings.net/v2/oauth2",
        clientId: process.env.WITHINGS_CLIENT_ID,
        clientSecret: process.env.WITHINGS_CLIENT_SECRET,
        refreshToken: process.env.WITHINGS_REFRESH_TOKEN,
      }));

      const ext = await fetch("https://wbsapi.withings.net/measure?action=getmeas", {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json());

      const measureCount = (ext.body?.measuregrps || []).length || 1;

      // Treemap: jerarquía año -> país, valor = consumo*measureCount
      const docs = await findAll();
      const byYear = {};
      docs.forEach(d => {
        const y = String(d.year);
        if (!byYear[y]) byYear[y] = [];
        byYear[y].push({
          name: `${d.country} ${d.year}`,
          parent: y,
          value: (d.alcohol_consumption ?? 0) * measureCount,
        });
      });
      const data = [];
      Object.keys(byYear).forEach(y => {
        data.push({ id: y, name: y });
        data.push(...byYear[y].map(p => ({ ...p })));
      });

      res.json({ chartType: "treemap", data });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // -------- 3. Apple Health (vía bridge OAuth2) -> packedbubble ---------
  app.get(BASE_URL_INTEGRATIONS_MRG + "/apple-health", async (req, res) => {
    try {
      const token = await getToken("mrg_apple", () => clientCredentials({
        tokenUrl: process.env.APPLE_BRIDGE_TOKEN_URL,
        clientId: process.env.APPLE_BRIDGE_CLIENT_ID,
        clientSecret: process.env.APPLE_BRIDGE_CLIENT_SECRET,
      }));

      const ext = await fetch(`${process.env.APPLE_BRIDGE_URL}/healthkit/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json());

      const apple = ext.users || [];

      // Packedbubble agrupado por país (DB propia), valor = consumo + métrica Apple
      const docs = await findAll();
      const byCountry = {};
      docs.forEach(d => {
        if (!byCountry[d.country]) byCountry[d.country] = [];
        const appleVal = apple.find(u => u.country === d.country)?.value || 0;
        byCountry[d.country].push({
          name: `${d.country} ${d.year}`,
          value: (d.alcohol_consumption ?? 0) + appleVal,
        });
      });
      const series = Object.entries(byCountry).map(([name, data]) => ({ name, data }));

      res.json({ chartType: "packedbubble", series });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
}
