// =====================================================================
// integrations-JFM.js  (José Fernández Montero)
//
// 3 widgets sobre road-fatalities con OAuth real:
//   - Mastodon API              -> pie     (señal social × tasa de fallecidos DB)
//   - Copernicus/ESA Data Space -> scatter (imágenes sat. × mortalidad DB)
//   - FedEx Sandbox API         -> heatmap (puntos logísticos × muertes DB)
//
// Token endpoints:
//   Mastodon   : {MASTODON_INSTANCE}/oauth/token
//   Copernicus : https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token
//   FedEx      : https://apis-sandbox.fedex.com/oauth/token
//
// IMPORTANTE:
// - Mastodon usa OAuth2 client_credentials.
// - FedEx usa OAuth2 client_credentials.
// - Copernicus Data Space usa OAuth con grant_type=password y client_id=cdse-public.
// - Si falla una API externa, se devuelve fallback derivado de datos propios,
//   pero también se devuelve apiError para poder depurar.
// =====================================================================

import { dbRoadFatalities as db } from "./db.js";

export const BASE_URL_INTEGRATIONS_JFM = "/api/integrations/jfm";

const tokenCache = new Map();

function fetchT(url, opts = {}, ms = 10000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);

  return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(t));
}

async function fetchJsonT(url, opts = {}, ms = 10000) {
  const r = await fetchT(url, opts, ms);
  const text = await r.text();

  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Respuesta no JSON desde ${url}. HTTP ${r.status}: ${text.slice(0, 500)}`);
  }

  if (!r.ok) {
    throw new Error(`HTTP ${r.status} en ${url}: ${JSON.stringify(json).slice(0, 700)}`);
  }

  return json;
}

async function getToken(key, fetcher) {
  const now = Date.now();
  const c = tokenCache.get(key);

  if (c && c.expiresAt > now + 30_000) {
    return c.token;
  }

  const { token, expiresIn } = await fetcher();

  if (!token) {
    throw new Error(`No se ha recibido access_token para ${key}`);
  }

  tokenCache.set(key, {
    token,
    expiresAt: now + Number(expiresIn || 300) * 1000,
  });

  return token;
}

function requireVars(...names) {
  const missing = names.filter(n => !process.env[n]);

  if (missing.length) {
    throw new Error(`Variables de entorno faltantes: ${missing.join(", ")}`);
  }
}

// ── Mastodon OAuth2 client_credentials ────────────────────────────────
async function mastodonToken() {
  requireVars("MASTODON_CLIENT_ID", "MASTODON_CLIENT_SECRET", "MASTODON_INSTANCE");

  const instance = process.env.MASTODON_INSTANCE.replace(/\/$/, "");

  const j = await fetchJsonT(`${instance}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.MASTODON_CLIENT_ID,
      client_secret: process.env.MASTODON_CLIENT_SECRET,
      redirect_uri: "urn:ietf:wg:oauth:2.0:oob",
      scope: "read",
    }),
  });

  return {
    token: j.access_token,
    expiresIn: j.expires_in || 86400,
  };
}

// ── Copernicus Data Space OAuth password flow ─────────────────────────
// Variables necesarias:
//   COPERNICUS_USERNAME
//   COPERNICUS_PASSWORD
//
// No uses aquí COPERNICUS_CLIENT_ID/COPERNICUS_CLIENT_SECRET.
// Para CDSE OData se usa client_id=cdse-public con username/password.
async function copernicusToken() {
  requireVars("COPERNICUS_USERNAME", "COPERNICUS_PASSWORD");

  const j = await fetchJsonT(
    "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        grant_type: "password",
        client_id: "cdse-public",
        username: process.env.COPERNICUS_USERNAME,
        password: process.env.COPERNICUS_PASSWORD,
      }),
    }
  );

  return {
    token: j.access_token,
    expiresIn: j.expires_in || 600,
  };
}

// ── FedEx Sandbox OAuth2 client_credentials ───────────────────────────
async function fedexToken() {
  requireVars("FEDEX_CLIENT_ID", "FEDEX_CLIENT_SECRET");

  const j = await fetchJsonT("https://apis-sandbox.fedex.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.FEDEX_CLIENT_ID,
      client_secret: process.env.FEDEX_CLIENT_SECRET,
    }),
  });

  return {
    token: j.access_token,
    expiresIn: j.expires_in || 3600,
  };
}

const MASTODON_HASHTAGS = [
  "RoadSafety",
  "TrafficAccident",
  "CarCrash",
  "TrafficSafety",
  "RoadAccident",
  "AccidentesTrafico",
  "SeguridadVial",
  "SiniestroVial",
];

export function loadBackendIntegrationsJFM(app) {
  const dbFindAll = () =>
    new Promise((resolve, reject) => {
      db.find({}, (err, docs) => {
        if (err) return reject(err);
        resolve(docs || []);
      });
    });

  // Healthcheck simple para comprobar que las rutas están cargadas.
  app.get(BASE_URL_INTEGRATIONS_JFM + "/status", async (req, res) => {
    try {
      const docs = await dbFindAll();

      res.json({
        ok: true,
        module: "integrations-JFM",
        baseUrl: BASE_URL_INTEGRATIONS_JFM,
        dbDocs: docs.length,
        endpoints: [
          BASE_URL_INTEGRATIONS_JFM + "/mastodon-fatalities",
          BASE_URL_INTEGRATIONS_JFM + "/copernicus-fatalities",
          BASE_URL_INTEGRATIONS_JFM + "/fedex-fatalities",
        ],
      });
    } catch (e) {
      res.status(500).json({
        ok: false,
        error: e.message,
      });
    }
  });

  // -------------------------------------------------------------------
  // 1. Mastodon -> pie
  // -------------------------------------------------------------------
  // Señal social de seguridad vial combinada con la tasa media de fallecidos
  // de tu DB. Cada slice: posts del hashtag × avgDeathRate.
  // Si Mastodon falla, fallback: fallecidos reales de la DB agrupados por income_level.
  app.get(BASE_URL_INTEGRATIONS_JFM + "/mastodon-fatalities", async (req, res) => {
    try {
      const docs = await dbFindAll();

      if (!docs.length) {
        return res.status(500).json({
          error: "La base de datos road-fatalities-v2.db no tiene documentos.",
        });
      }

      const avgDeathRate =
        docs.reduce((s, d) => s + Number(d.population_death_rate || 0), 0) /
        Math.max(1, docs.length);

      const totalDeaths = docs.reduce((s, d) => s + Number(d.total_death || 0), 0);

      let hashtags = [];
      let dataSource = "api";
      let apiError = null;

      try {
        const instance = (process.env.MASTODON_INSTANCE || "https://mastodon.social").replace(/\/$/, "");
        const token = await getToken("jfm_mastodon", mastodonToken);

        const results = await Promise.allSettled(
          MASTODON_HASHTAGS.map(async tag => {
            const posts = await fetchJsonT(`${instance}/api/v1/timelines/tag/${tag}?limit=40`, {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
              },
            });

            return {
              tag,
              count: Array.isArray(posts) ? posts.length : 0,
            };
          })
        );

        hashtags = results
          .filter(r => r.status === "fulfilled" && r.value.count > 0)
          .map(r => ({
            tag: r.value.tag,
            count: r.value.count,
            weightedScore: Math.round(r.value.count * avgDeathRate),
          }));

        if (hashtags.length === 0) {
          throw new Error("Mastodon no devolvió posts para ningún hashtag.");
        }
      } catch (e) {
        console.warn(`[JFM Mastodon] Usando fallback de DB. Motivo: ${e.message}`);

        dataSource = "fallback-db";
        apiError = e.message;

        const groups = {};

        docs.forEach(d => {
          const k = d.income_level || "unknown";
          groups[k] = (groups[k] || 0) + Number(d.total_death || 0);
        });

        hashtags = Object.entries(groups).map(([tag, count]) => ({
          tag,
          count,
          weightedScore: count,
        }));
      }

      const totalPosts = hashtags.reduce((s, h) => s + Number(h.count || 0), 0);

      res.json({
        api: "Mastodon",
        chartType: "pie",
        dataSource,
        apiError,
        oauthUsed: true,
        oauthFlow: "client_credentials",
        externalApiUsed: dataSource === "api",
        combinedWithOwnApi: true,
        sourceType: "social signal + road fatalities DB",
        ownApiFieldsUsed: ["population_death_rate", "total_death", "income_level"],
        externalFieldsUsed: ["public posts by hashtag"],
        officialFatalitySource: false,
        explanation:
          dataSource === "api"
            ? "Conteo de posts públicos de Mastodon por hashtag, ponderado por la tasa media de fallecidos en carretera de la DB propia."
            : "Fallback: fallecidos reales de la DB propia agrupados por nivel de ingresos del país porque Mastodon no estuvo disponible.",
        hashtags,
        totalPosts,
        dbContext: {
          docs: docs.length,
          avgDeathRate: Number(avgDeathRate.toFixed(2)),
          totalDeaths,
        },
      });
    } catch (e) {
      res.status(500).json({
        error: e.message,
      });
    }
  });

  // -------------------------------------------------------------------
  // 2. Copernicus/ESA -> scatter
  // -------------------------------------------------------------------
  // Imágenes Sentinel-2 sobre España combinadas con vehicle_death_rate y
  // population_death_rate de la DB propia.
  app.get(BASE_URL_INTEGRATIONS_JFM + "/copernicus-fatalities", async (req, res) => {
    try {
      const docs = await dbFindAll();

      if (!docs.length) {
        return res.status(500).json({
          error: "La base de datos road-fatalities-v2.db no tiene documentos.",
        });
      }

      let imageCount = 20;
      let dataSource = "api";
      let apiError = null;

      try {
        const token = await getToken("jfm_copernicus", copernicusToken);

        const url =
          "https://catalogue.dataspace.copernicus.eu/odata/v1/Products" +
          "?$count=true&$top=1" +
          "&$filter=Collection/Name eq 'SENTINEL-2'" +
          " and ContentDate/Start gt 2024-01-01T00:00:00.000Z" +
          " and OData.CSC.Intersects(area=geography'SRID=4326;" +
          "POLYGON((-9 36,4 36,4 44,-9 44,-9 36))')";

        const ext = await fetchJsonT(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        imageCount = Math.min(Number(ext["@odata.count"] ?? 20), 200);
      } catch (e) {
        console.warn(`[JFM Copernicus] Usando fallback de DB. Motivo: ${e.message}`);

        dataSource = "fallback-db";
        apiError = e.message;
      }

      const data = docs.map(d => ({
        x: Number(d.vehicle_death_rate || 0),
        y: Number(d.population_death_rate || 0) * (1 + imageCount / 200),
        name: `${d.nation} (${d.year})`,
        nation: d.nation,
        year: d.year,
        originalPopulationDeathRate: Number(d.population_death_rate || 0),
        originalVehicleDeathRate: Number(d.vehicle_death_rate || 0),
      }));

      res.json({
        api: "Copernicus Data Space Ecosystem",
        chartType: "scatter",
        dataSource,
        apiError,
        oauthUsed: true,
        oauthFlow: "password",
        externalApiUsed: dataSource === "api",
        combinedWithOwnApi: true,
        sourceType: "satellite products + road fatalities DB",
        ownApiFieldsUsed: ["vehicle_death_rate", "population_death_rate", "nation", "year"],
        externalFieldsUsed: ["@odata.count"],
        explanation:
          dataSource === "api"
            ? "Se consulta Copernicus Data Space mediante OAuth y se combina el número de productos Sentinel-2 encontrados sobre España con las tasas de mortalidad vial de la DB propia."
            : "Fallback: scatter calculado con DB propia y un imageCount neutro porque Copernicus no estuvo disponible.",
        series: [
          {
            name: "Mortalidad vial + Sentinel-2",
            data,
          },
        ],
        dbContext: {
          docs: docs.length,
          imageCount,
        },
      });
    } catch (e) {
      res.status(500).json({
        error: e.message,
      });
    }
  });

  // -------------------------------------------------------------------
  // 3. FedEx Sandbox -> heatmap
  // -------------------------------------------------------------------
  // Puntos de servicio FedEx en Madrid combinados con total_death de la DB.
  app.get(BASE_URL_INTEGRATIONS_JFM + "/fedex-fatalities", async (req, res) => {
    try {
      const docs = await dbFindAll();

      if (!docs.length) {
        return res.status(500).json({
          error: "La base de datos road-fatalities-v2.db no tiene documentos.",
        });
      }

      let locationCount = 10;
      let dataSource = "api";
      let apiError = null;

      try {
        const token = await getToken("jfm_fedex", fedexToken);

        const ext = await fetchJsonT(
          "https://apis-sandbox.fedex.com/location/v1/locations",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              Accept: "application/json",
              "X-locale": "es_ES",
              "X-Customer-Transaction-Id": "sos2526-jfm-heatmap",
            },
            body: JSON.stringify({
              locationsSummaryRequestControlParameters: {
                maxOptions: 20,
              },
              locationSearchCriterion: "ADDRESS",
              location: {
                address: {
                  streetLines: ["Calle Mayor"],
                  city: "Madrid",
                  postalCode: "28013",
                  countryCode: "ES",
                },
              },
            }),
          }
        );

        locationCount =
          ext.output?.locationDetailList?.length ??
          ext.locationDetailList?.length ??
          ext.output?.matchedAddressResults?.length ??
          10;
      } catch (e) {
        console.warn(`[JFM FedEx] Usando fallback de DB. Motivo: ${e.message}`);

        dataSource = "fallback-db";
        apiError = e.message;
      }

      const normalizer = Math.max(1, Number(locationCount || 1));

      const nations = [...new Set(docs.map(d => d.nation || "unknown"))];
      const years = [...new Set(docs.map(d => d.year))].sort((a, b) => Number(a) - Number(b));

      const data = docs.map(d => [
        years.indexOf(d.year),
        nations.indexOf(d.nation || "unknown"),
        Math.round(Number(d.total_death || 0) / normalizer),
      ]);

      res.json({
        api: "FedEx Sandbox Locations API",
        chartType: "heatmap",
        dataSource,
        apiError,
        oauthUsed: true,
        oauthFlow: "client_credentials",
        externalApiUsed: dataSource === "api",
        combinedWithOwnApi: true,
        sourceType: "logistics locations + road fatalities DB",
        ownApiFieldsUsed: ["total_death", "nation", "year"],
        externalFieldsUsed: ["locationDetailList.length"],
        explanation:
          dataSource === "api"
            ? "Se consulta FedEx Locations API mediante OAuth y se combina el número de puntos logísticos encontrados con los fallecidos totales de la DB propia."
            : "Fallback: heatmap calculado con DB propia y un locationCount neutro porque FedEx no estuvo disponible.",
        xCategories: years.map(String),
        yCategories: nations,
        data,
        dbContext: {
          docs: docs.length,
          locationCount,
          normalizer,
        },
      });
    } catch (e) {
      res.status(500).json({
        error: e.message,
      });
    }
  });
}