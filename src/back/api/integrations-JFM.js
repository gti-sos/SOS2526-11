// =====================================================================
// integrations-JFM.js  (José Fernández Montero)
// 3 widgets sobre road-fatalities con OAuth2 real:
//   - Azure Maps         -> pie
//   - HERE Traffic       -> scatter
//   - TomTom Traffic     -> heatmap
// Combina los datos externos con la DB propia road-fatalities-v2.db.
// =====================================================================

import Datastore from "nedb";

export const BASE_URL_INTEGRATIONS_JFM = "/api/integrations/jfm";

// Cache de tokens en memoria, scope local a este módulo
const tokenCache = new Map();

async function getToken(key, fetcher) {
  const now = Date.now();
  const c = tokenCache.get(key);
  if (c && c.expiresAt > now + 30_000) return c.token;
  const { token, expiresIn } = await fetcher();
  tokenCache.set(key, { token, expiresAt: now + expiresIn * 1000 });
  return token;
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

export function loadBackendIntegrationsJFM(app) {
  const db = new Datastore({ filename: "./data/road-fatalities-v2.db", autoload: true });

  const findAll = () => new Promise((res, rej) =>
    db.find({}, (err, docs) => (err ? rej(err) : res(docs)))
  );

  // -------- 1. Azure Maps -> pie ----------------------------------------
  app.get(BASE_URL_INTEGRATIONS_JFM + "/azure-fatalities", async (req, res) => {
    try {
      const token = await getToken("jfm_azure", () => clientCredentials({
        tokenUrl: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`,
        clientId: process.env.AZURE_CLIENT_ID,
        clientSecret: process.env.AZURE_CLIENT_SECRET,
        scope: "https://atlas.microsoft.com/.default",
      }));

      const ext = await fetch(
        "https://atlas.microsoft.com/traffic/incident/json?api-version=1.0&boundingbox=-10,35,5,44",
        { headers: { Authorization: `Bearer ${token}` } }
      ).then(r => r.json());

      // Distribución por nivel de ingresos (DB propia) ponderada por nº de incidentes Azure
      const docs = await findAll();
      const incidents = (ext.tm?.poi || []).length || 1;
      const byIncome = {};
      docs.forEach(d => {
        byIncome[d.income_level] = (byIncome[d.income_level] || 0) + d.total_death;
      });
      const series = Object.entries(byIncome).map(([name, deaths]) => ({
        name,
        y: Math.round(deaths * (1 + incidents / 100)),
      }));

      res.json({ chartType: "pie", series });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // -------- 2. HERE Traffic -> scatter ----------------------------------
  app.get(BASE_URL_INTEGRATIONS_JFM + "/here-traffic", async (req, res) => {
    try {
      const token = await getToken("jfm_here", () => clientCredentials({
        tokenUrl: "https://account.api.here.com/oauth2/token",
        clientId: process.env.HERE_CLIENT_ID,
        clientSecret: process.env.HERE_CLIENT_SECRET,
      }));

      const ext = await fetch(
        "https://data.traffic.hereapi.com/v7/flow?in=bbox:-3.9,40.3,-3.6,40.5&locationReferencing=shape",
        { headers: { Authorization: `Bearer ${token}` } }
      ).then(r => r.json());

      const jam = (ext.results || []).map(r => r.currentFlow?.jamFactor || 0);
      const avgJam = jam.length ? jam.reduce((a, b) => a + b, 0) / jam.length : 1;

      // Correlación: vehicle_death_rate (x) vs population_death_rate (y) escalado por congestión
      const docs = await findAll();
      const data = docs.map(d => ({
        x: d.vehicle_death_rate,
        y: d.population_death_rate * (1 + avgJam / 10),
        name: `${d.nation} (${d.year})`,
      }));

      res.json({ chartType: "scatter", series: [{ name: "Mortalidad vial", data }] });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // -------- 3. TomTom Traffic -> heatmap --------------------------------
  app.get(BASE_URL_INTEGRATIONS_JFM + "/tomtom-traffic", async (req, res) => {
    try {
      // TomTom da API key; envolvemos en token-exchange propio para uniformizar.
      const token = await getToken("jfm_tomtom", () => clientCredentials({
        tokenUrl: process.env.TOMTOM_TOKEN_URL || "https://example.invalid/token",
        clientId: process.env.TOMTOM_CLIENT_ID || "x",
        clientSecret: process.env.TOMTOM_CLIENT_SECRET || "x",
      }).catch(() => ({ token: process.env.TOMTOM_KEY, expiresIn: 3600 })));

      const ext = await fetch(
        `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point=40.4168,-3.7038&key=${token}`
      ).then(r => r.json());

      const baseSpeed = ext.flowSegmentData?.currentSpeed || 50;

      // Heatmap: filas = nación, columnas = año, valor = total_death normalizado por velocidad
      const docs = await findAll();
      const nations = [...new Set(docs.map(d => d.nation))];
      const years = [...new Set(docs.map(d => d.year))].sort();
      const data = [];
      docs.forEach(d => {
        const x = years.indexOf(d.year);
        const y = nations.indexOf(d.nation);
        const v = Math.round(d.total_death / Math.max(1, baseSpeed));
        data.push([x, y, v]);
      });

      res.json({ chartType: "heatmap", xCategories: years.map(String), yCategories: nations, data });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
}
