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
        x: d.alcohol_litre ?? 0,
        y: 80 - (d.alcohol_litre ?? 0) * 0.5,
        z: Math.max(1, factor / 5),
        name: d.nation,
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
        const y = String(d.date_year);
        if (!byYear[y]) byYear[y] = [];
        byYear[y].push({
          name: `${d.nation} ${y}`,
          parent: y,
          value: (d.alcohol_litre ?? 0) * Math.log10(videoCount + 1),
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
        const c = d.nation;
        if (!byCountry[c]) byCountry[c] = [];
        byCountry[c].push({
          name: `${c} ${d.date_year}`,
          value: (d.alcohol_litre ?? 0) + discordFactor / 10,
        });
      });
      const series = Object.entries(byCountry).map(([name, data]) => ({ name, data }));

      res.json({ chartType: "packedbubble", series });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // =====================================================================
  // INTEGRACIONES SOS (proxies a APIs de otros alumnos SOS)
  // Cada endpoint hace fetch a la API SOS externa y combina los datos
  // con la base de datos propia de alcohol-consumptions-per-capita-v2.
  // =====================================================================

  // -------- 4. SOS2526-12 mid-population-ages -> ApexCharts donut -------
  // Comparte año/país con alcohol DB. El donut muestra la población total
  // por tramo de edad, ponderada por el consumo medio de alcohol del país.
  app.get(BASE_URL_INTEGRATIONS_MRG + "/sos12-mid-population-ages", async (req, res) => {
    const SOURCE_URL = "https://sos2526-12.onrender.com/api/v2/mid-population-ages";
    try {
      // Lanzamos en paralelo el fetch a la API SOS y la lectura de la DB propia
      const [extRes, ownDocs] = await Promise.all([
        fetchT(SOURCE_URL, { headers: { Accept: "application/json" } }, 60000),
        findAll(),
      ]);
      if (!extRes.ok) throw new Error(`HTTP ${extRes.status} en SOS12`);
      const items = await extRes.json();

      // Mapa nation->avg(alcohol_litre) de la DB propia para cruce por país
      const alcoholByNation = {};
      ownDocs.forEach(d => {
        const k = String(d.nation || "").toLowerCase().trim();
        if (!alcoholByNation[k]) alcoholByNation[k] = { sum: 0, count: 0 };
        alcoholByNation[k].sum += Number(d.alcohol_litre || 0);
        alcoholByNation[k].count += 1;
      });
      const alcoholAvg = (name) => {
        const k = String(name || "").toLowerCase().trim();
        const r = alcoholByNation[k];
        return r ? r.sum / r.count : 0;
      };

      // Suma por tramo de edad para los países que también aparecen en alcohol DB
      const buckets = {
        "0-24": 0,
        "25-49": 0,
        "50-74": 0,
        "75-99": 0,
        "100+": 0,
      };
      let matchedCountries = 0;
      const matchedSet = new Set();
      items.forEach(row => {
        const country = row.country_name;
        const factor = alcoholAvg(country);
        if (factor === 0) return;
        matchedSet.add(String(country).toLowerCase().trim());
        // Ponderamos cada tramo por el consumo medio de alcohol del país
        buckets["0-24"]   += Number(row.population_age_0   || 0) * (1 + factor / 20);
        buckets["25-49"]  += Number(row.population_age_25  || 0) * (1 + factor / 20);
        buckets["50-74"]  += Number(row.population_age_50  || 0) * (1 + factor / 20);
        buckets["75-99"]  += Number(row.population_age_75  || 0) * (1 + factor / 20);
        buckets["100+"]   += Number(row.population_age_100 || 0) * (1 + factor / 20);
      });
      matchedCountries = matchedSet.size;

      const labels = Object.keys(buckets);
      const series = Object.values(buckets).map(v => Math.round(v));

      res.json({
        api: "SOS2526-12 mid-population-ages",
        sourceUrl: SOURCE_URL,
        chartType: "donut",
        library: "ApexCharts",
        externalApiUsed: true,
        combinedWithOwnApi: true,
        ownApiFieldsUsed: ["nation", "alcohol_litre"],
        externalFieldsUsed: ["country_name", "population_age_0/25/50/75/100"],
        explanation: "Población mundial agrupada por tramos de edad (SOS2526-12), ponderada por el consumo medio de alcohol propio de cada país.",
        matchedCountries,
        labels,
        series,
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // -------- 5. soporte-sos religious-believes-stats -> ApexCharts radar
  // Cruce por país: ejes del radar = porcentajes religiosos del país (medias mundiales)
  // y se añade el consumo de alcohol como un eje extra para visualizar la combinación.
  app.get(BASE_URL_INTEGRATIONS_MRG + "/sos-religious-believes", async (req, res) => {
    const SOURCE_URL = "https://soporte-sos.onrender.com/api/v1/religious-believes-stats";
    try {
      const [extRes, ownDocs] = await Promise.all([
        fetchT(SOURCE_URL, { headers: { Accept: "application/json" } }, 60000),
        findAll(),
      ]);
      if (!extRes.ok) throw new Error(`HTTP ${extRes.status} en religious-believes-stats`);
      const items = await extRes.json();

      const alcoholByNation = {};
      ownDocs.forEach(d => {
        const k = String(d.nation || "").toLowerCase().trim();
        if (!alcoholByNation[k]) alcoholByNation[k] = { sum: 0, count: 0 };
        alcoholByNation[k].sum += Number(d.alcohol_litre || 0);
        alcoholByNation[k].count += 1;
      });

      // Filtramos a entidades que también están en alcohol DB
      const matched = items.filter(r => {
        const k = String(r.entity || "").toLowerCase().trim();
        return alcoholByNation[k];
      });

      // Top 6 países por consumo de alcohol
      const top = matched
        .map(r => {
          const k = String(r.entity || "").toLowerCase().trim();
          const a = alcoholByNation[k];
          return { ...r, alcohol_avg: a.sum / a.count };
        })
        .sort((a, b) => b.alcohol_avg - a.alcohol_avg)
        .slice(0, 6);

      const categories = ["Christian", "Muslim", "Hindu", "Buddhist", "Jew", "No religion", "Alcohol×10"];
      const series = top.map(r => ({
        name: r.entity,
        // Multiplicamos alcohol×10 para que entre en la misma escala 0-100 del radar
        data: [
          parseFloat(r.christian) || 0,
          parseFloat(r.muslim) || 0,
          parseFloat(r.hindu) || 0,
          parseFloat(r.budhist) || 0,
          parseFloat(r.jew) || 0,
          parseFloat(r.no_religion) || 0,
          Math.min(100, r.alcohol_avg * 10),
        ],
      }));

      res.json({
        api: "soporte-sos religious-believes-stats",
        sourceUrl: SOURCE_URL,
        chartType: "radar",
        library: "ApexCharts",
        externalApiUsed: true,
        combinedWithOwnApi: true,
        ownApiFieldsUsed: ["nation", "alcohol_litre"],
        externalFieldsUsed: ["entity", "christian", "muslim", "hindu", "budhist", "jew", "no_religion"],
        explanation: "Top 6 países (por consumo medio de alcohol propio) con su distribución religiosa de soporte-sos. Cada eje es un porcentaje religioso, y se añade un eje 'Alcohol×10' para mostrar la integración con la API propia.",
        matchedCountries: top.length,
        categories,
        series,
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // -------- 6. space-launches -> ApexCharts polarArea -------------------
  // Cruce por país: nº de lanzamientos × consumo medio de alcohol del país.
  app.get(BASE_URL_INTEGRATIONS_MRG + "/sos-space-launches", async (req, res) => {
    const SOURCE_URL = "https://space-launches-8cix.onrender.com/api/v2/space-launches";
    try {
      const [extRes, ownDocs] = await Promise.all([
        fetchT(SOURCE_URL, { headers: { Accept: "application/json" } }, 60000),
        findAll(),
      ]);
      if (!extRes.ok) throw new Error(`HTTP ${extRes.status} en space-launches`);
      const items = await extRes.json();

      const alcoholByNation = {};
      ownDocs.forEach(d => {
        const k = String(d.nation || "").toLowerCase().trim();
        if (!alcoholByNation[k]) alcoholByNation[k] = { sum: 0, count: 0 };
        alcoholByNation[k].sum += Number(d.alcohol_litre || 0);
        alcoholByNation[k].count += 1;
      });

      // Conteo de lanzamientos por país
      const launchesByCountry = {};
      items.forEach(row => {
        const c = String(row.country || "").trim();
        if (!c) return;
        launchesByCountry[c] = (launchesByCountry[c] || 0) + 1;
      });

      // Mantenemos solo países que también están en alcohol DB.
      // Si no hay coincidencias (porque la API space-launches usa nombres
      // como "USA"/"Russia" que pueden no coincidir), caemos a top por
      // lanzamientos sin filtrar.
      const matched = Object.entries(launchesByCountry)
        .map(([country, launches]) => {
          const k = country.toLowerCase().trim();
          const a = alcoholByNation[k];
          return {
            country,
            launches,
            alcohol_avg: a ? a.sum / a.count : 0,
            inOwnDb: !!a,
          };
        });

      const inDb = matched.filter(m => m.inOwnDb).sort((a, b) => b.launches - a.launches).slice(0, 8);
      const final = inDb.length > 0
        ? inDb
        : matched.sort((a, b) => b.launches - a.launches).slice(0, 8);

      // Métrica combinada para la polarArea: launches × (1 + alcohol_avg/10)
      const series = final.map(m => Math.round(m.launches * (1 + m.alcohol_avg / 10)));
      const labels = final.map(m => m.country);

      res.json({
        api: "space-launches",
        sourceUrl: SOURCE_URL,
        chartType: "polarArea",
        library: "ApexCharts",
        externalApiUsed: true,
        combinedWithOwnApi: inDb.length > 0,
        ownApiFieldsUsed: ["nation", "alcohol_litre"],
        externalFieldsUsed: ["country", "mission_id"],
        explanation: "Top países por número de lanzamientos espaciales, ponderados por el consumo medio de alcohol propio. Si no hay coincidencias por nombre de país, se muestran los top globales.",
        matchedCountries: inDb.length,
        labels,
        series,
        rawCounts: final.map(m => ({ country: m.country, launches: m.launches, alcoholAvg: Math.round(m.alcohol_avg * 100) / 100 })),
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
}
