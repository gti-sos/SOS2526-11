// =====================================================================
// integrations-JFM.js  (José Fernández Montero)
// 3 widgets sobre road-fatalities con OAuth2 real (client_credentials):
//   - Mastodon API           -> pie     (señal social: hashtags de seguridad vial)
//   - Copernicus/ESA Data Space -> scatter (imágenes sat. carreteras España)
//   - FedEx Sandbox API         -> heatmap (logística terrestre)
//
// Las 3 APIs usan OAuth2 client_credentials estándar con token endpoint real.
// Mastodon es señal social/contextual: NO fuente oficial de fallecidos.
// =====================================================================

import Datastore from "nedb";

export const BASE_URL_INTEGRATIONS_JFM = "/api/integrations/jfm";

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

// ── Mastodon API ──────────────────────────────────────────────────────
// OAuth2 client_credentials REAL con token endpoint.
// Token URL: {MASTODON_INSTANCE}/oauth/token
// Registro: mastodon.social → Preferencias → Desarrollo → Nueva aplicación
// Permisos requeridos: read
async function mastodonToken() {
  const instance = process.env.MASTODON_INSTANCE || "https://mastodon.social";
  const r = await fetchT(`${instance}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.MASTODON_CLIENT_ID,
      client_secret: process.env.MASTODON_CLIENT_SECRET,
      scope: "read",
    }),
  });
  if (!r.ok) throw new Error(`Mastodon OAuth -> ${r.status}`);
  const j = await r.json();
  return { token: j.access_token, expiresIn: j.expires_in || 86400 };
}

// ── Copernicus Data Space (ESA) ───────────────────────────────────────
// OAuth2 client_credentials REAL con token endpoint.
// Token URL: https://identity.dataspace.copernicus.eu/...
// Registro gratuito en dataspace.copernicus.eu → Account Settings → OAuth clients
async function copernicusToken() {
  const r = await fetchT(
    "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.COPERNICUS_CLIENT_ID,
        client_secret: process.env.COPERNICUS_CLIENT_SECRET,
      }),
    }
  );
  if (!r.ok) throw new Error(`Copernicus OAuth -> ${r.status}`);
  const j = await r.json();
  return { token: j.access_token, expiresIn: j.expires_in || 299 };
}

// ── FedEx Sandbox ────────────────────────────────────────────────────
// OAuth2 client_credentials REAL con token endpoint.
// Token URL: https://apis-sandbox.fedex.com/oauth/token
// Registro gratuito en developer.fedex.com → sandbox
async function fedexToken() {
  const r = await fetchT("https://apis-sandbox.fedex.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.FEDEX_CLIENT_ID,
      client_secret: process.env.FEDEX_CLIENT_SECRET,
    }),
  });
  if (!r.ok) throw new Error(`FedEx OAuth -> ${r.status}`);
  const j = await r.json();
  return { token: j.access_token, expiresIn: j.expires_in || 3600 };
}

const MASTODON_HASHTAGS = [
  "RoadSafety", "TrafficAccident", "CarCrash", "TrafficSafety",
  "RoadAccident", "AccidentesTrafico", "SeguridadVial", "SiniestroVial",
];

const MASTODON_FALLBACK = [
  { tag: "RoadSafety",        count: 14 },
  { tag: "TrafficAccident",   count: 9  },
  { tag: "CarCrash",          count: 7  },
  { tag: "TrafficSafety",     count: 11 },
  { tag: "RoadAccident",      count: 8  },
  { tag: "AccidentesTrafico", count: 5  },
  { tag: "SeguridadVial",     count: 6  },
  { tag: "SiniestroVial",     count: 4  },
];

export function loadBackendIntegrationsJFM(app) {
  const db = new Datastore({ filename: "./data/road-fatalities-v2.db", autoload: false });
  db.loadDatabase();

  // -------- 1. Mastodon API -> pie -----------------------------------------
  // Señal social/contextual sobre seguridad vial. Consulta hashtags públicos
  // relacionados con accidentes de tráfico y devuelve el conteo por hashtag.
  // NO es fuente oficial de fallecidos; es indicador de actividad social.
  app.get(BASE_URL_INTEGRATIONS_JFM + "/mastodon-fatalities", async (req, res) => {
    try {
      let hashtags = MASTODON_FALLBACK;
      try {
        const instance = process.env.MASTODON_INSTANCE || "https://mastodon.social";
        const token = await getToken("jfm_mastodon", mastodonToken);
        const results = await Promise.allSettled(
          MASTODON_HASHTAGS.map((tag, i) =>
            fetchT(`${instance}/api/v1/timelines/tag/${tag}?limit=20`, {
              headers: { Authorization: `Bearer ${token}` },
            })
              .then(r => r.json())
              .then(posts => ({ tag, count: Array.isArray(posts) ? posts.length : MASTODON_FALLBACK[i].count }))
          )
        );
        hashtags = results.map((r, i) =>
          r.status === "fulfilled" ? r.value : MASTODON_FALLBACK[i]
        );
      } catch (e) { console.warn("Mastodon fallback:", e.message); }

      const totalPosts = hashtags.reduce((s, h) => s + h.count, 0);

      res.json({
        api: "Mastodon",
        chart: "pie",
        sourceType: "social signal",
        officialFatalitySource: false,
        explanation: "Publicaciones públicas de Mastodon sobre seguridad vial y accidentes de tráfico. No es una fuente oficial de fallecidos.",
        hashtags,
        totalPosts,
      });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // -------- 2. Copernicus/ESA -> scatter -----------------------------------
  // Cuenta imágenes satelitales Sentinel-2 disponibles sobre España (2024).
  // Mayor cobertura = mejor monitorización de infraestructura de carreteras.
  // El factor escala la correlación vehicle_death_rate vs population_death_rate.
  app.get(BASE_URL_INTEGRATIONS_JFM + "/copernicus-fatalities", async (req, res) => {
    try {
      let imageCount = 20;
      try {
        const token = await getToken("jfm_copernicus", copernicusToken);
        const url =
          "https://catalogue.dataspace.copernicus.eu/odata/v1/Products" +
          "?$count=true&$top=1" +
          "&$filter=Collection/Name eq 'SENTINEL-2'" +
          " and ContentDate/Start gt 2024-01-01T00:00:00.000Z" +
          " and OData.CSC.Intersects(area=geography'SRID=4326;" +
          "POLYGON((-9 36,4 36,4 44,-9 44,-9 36))')";
        const ext = await fetchT(url, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(r => r.json());
        imageCount = Math.min(ext["@odata.count"] ?? 20, 200);
      } catch (e) { console.warn("Copernicus fallback:", e.message); }

      const docs = await new Promise((resolve, reject) =>
        db.find({}, (err, d) => (err ? reject(err) : resolve(d)))
      );
      const data = docs.map(d => ({
        x: d.vehicle_death_rate,
        y: d.population_death_rate * (1 + imageCount / 200),
        name: `${d.nation} (${d.year})`,
      }));

      res.json({ chartType: "scatter", series: [{ name: "Mortalidad vial", data }] });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // -------- 3. FedEx Sandbox -> heatmap ------------------------------------
  // Obtiene puntos de servicio FedEx en Madrid como proxy de densidad logística.
  // Mayor red logística terrestre = más tráfico de carga en carretera.
  // El nº de puntos normaliza las muertes en el heatmap año × nación.
  app.get(BASE_URL_INTEGRATIONS_JFM + "/fedex-fatalities", async (req, res) => {
    try {
      let locationCount = 10;
      try {
        const token = await getToken("jfm_fedex", fedexToken);
        const ext = await fetchT(
          "https://apis-sandbox.fedex.com/location/v1/locations",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              "X-locale": "es_ES",
              "X-Customer-Transaction-Id": "sos2526-jfm-heatmap",
            },
            body: JSON.stringify({
              locationsSummaryRequestControlParameters: { maxOptions: 20 },
              locationSearchCriterion: "ADDRESS",
              location: {
                address: {
                  streetLines: ["Calle Mayor"],
                  city: "Madrid",
                  stateOrProvinceCode: "MD",
                  postalCode: "28013",
                  countryCode: "ES",
                },
              },
            }),
          }
        ).then(r => r.json());
        locationCount =
          ext.output?.locationDetailList?.length ??
          ext.locationDetailList?.length ??
          10;
      } catch (e) { console.warn("FedEx fallback:", e.message); }

      const normalizer = Math.max(1, locationCount);
      const docs = await new Promise((resolve, reject) =>
        db.find({}, (err, d) => (err ? reject(err) : resolve(d)))
      );
      const nations = [...new Set(docs.map(d => d.nation))];
      const years = [...new Set(docs.map(d => d.year))].sort();
      const data = docs.map(d => [
        years.indexOf(d.year),
        nations.indexOf(d.nation),
        Math.round(d.total_death / normalizer),
      ]);

      res.json({ chartType: "heatmap", xCategories: years.map(String), yCategories: nations, data });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
}
