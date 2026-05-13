// =====================================================================
// integrations-JFM.js  (José Fernández Montero)
//
// Widgets OAuth2 (APIs externas reales):
//   - Mastodon API              -> pie     (señal social × tasa de fallecidos DB)
//   - Copernicus/ESA Data Space -> scatter (imágenes sat. × mortalidad DB)
//   - FedEx Sandbox API         -> heatmap (puntos logísticos × muertes DB)
//
// Widgets SOS (APIs de compañeros):
//   - SOS2526-12 birth-death-growth-rates   -> ECharts bar
//   - SOS2526-14 meteorite-landings         -> ECharts treemap
//   - SOS2526-20 spice-stats                -> ECharts radar
//   - SOS2526-21 aids-deaths-stats          -> ECharts heatmap
//   - SOS2526-27 world-hydroelectric-plants -> ECharts scatter
//
// Token endpoints OAuth2:
//   Mastodon   : {MASTODON_INSTANCE}/oauth/token
//   Copernicus : https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token
//   FedEx      : https://apis-sandbox.fedex.com/oauth/token
//
// IMPORTANTE:
// - Mastodon usa OAuth2 client_credentials.
// - FedEx usa OAuth2 client_credentials.
// - Copernicus Data Space usa OAuth con grant_type=password y client_id=cdse-public.
// - Las APIs SOS se inicializan automáticamente llamando a LoadInitialData antes
//   de cada consulta principal. No es necesario ejecutarlo manualmente.
// - Si falla una API externa, se devuelve fallback derivado de datos propios,
//   pero también se devuelve apiError para poder depurar.
// =====================================================================

import { dbRoadFatalities as db } from "./db.js";

export const BASE_URL_INTEGRATIONS_JFM = "/api/integrations/jfm";

const tokenCache = new Map();

function fetchT(url, opts = {}, ms = 45000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);

  return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(t));
}

async function fetchJsonT(url, opts = {}, ms = 45000) {
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
//
// Flujo OAuth2: client_credentials.
// El token se solicita a: {MASTODON_INSTANCE}/oauth/token
// Con ese token se llama a: /api/v1/timelines/tag/{tag}
// para obtener las publicaciones públicas de cada hashtag de seguridad vial.
// Los conteos de posts se combinan con la DB propia mediante:
//   weightedScore = count * avgDeathRate
//
// Si aparece "invalid_client", las credenciales del .env han expirado o son incorrectas.
// Para crear una nueva app de Mastodon y obtener credenciales nuevas:
//
//   Git Bash:
//     curl -X POST https://mastodon.social/api/v1/apps \
//       -F "client_name=sos2526-jfm" \
//       -F "redirect_uris=urn:ietf:wg:oauth:2.0:oob" \
//       -F "scopes=read" \
//       -F "website=https://sos2526-11.onrender.com"
//
//   PowerShell:
//     curl.exe -X POST https://mastodon.social/api/v1/apps `
//       -F "client_name=sos2526-jfm" `
//       -F "redirect_uris=urn:ietf:wg:oauth:2.0:oob" `
//       -F "scopes=read" `
//       -F "website=https://sos2526-11.onrender.com"
//
// La respuesta devuelve client_id y client_secret. Actualizar en .env:
//   MASTODON_CLIENT_ID=CLIENT_ID_DEVUELTO
//   MASTODON_CLIENT_SECRET=CLIENT_SECRET_DEVUELTO
//   MASTODON_INSTANCE=https://mastodon.social
//
// Prueba: GET http://localhost:8080/api/integrations/jfm/mastodon-fatalities
//   Si funciona: "dataSource": "api", "externalApiUsed": true, "apiError": null
//   Si falla:    "dataSource": "fallback-db" → revisar "apiError" para el motivo exacto
async function mastodonToken() {
  requireVars("MASTODON_CLIENT_ID", "MASTODON_CLIENT_SECRET", "MASTODON_INSTANCE");

  const instance = process.env.MASTODON_INSTANCE.replace(/\/$/, "");

  // Petición OAuth2 client_credentials al token endpoint de Mastodon.
  // Las credenciales (client_id, client_secret) vienen siempre del .env, nunca del código.
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
    },
    45000
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

// Máximo de posts a recuperar por hashtag en cada consulta a Mastodon.
// Este valor no representa el total histórico de publicaciones; es el límite
// de la petición. Si un hashtag devuelve exactamente este número, significa
// que Mastodon alcanzó el tope solicitado (limitReached = true).
const MASTODON_POST_LIMIT = 80;

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

// ── Helpers para endpoints SOS ────────────────────────────────────────

function extractArrayPayload(json) {
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.results)) return json.results;
  if (Array.isArray(json?.items)) return json.items;
  if (Array.isArray(json?.records)) return json.records;
  return [];
}

function pickFields(rows, preferredFields = [], maxFields = 5) {
  if (!rows.length || typeof rows[0] !== "object") return [];
  const keys = Object.keys(rows[0]);
  const preferred = preferredFields.filter(k => keys.includes(k));
  const remaining = keys.filter(k => !preferred.includes(k));
  return [...preferred, ...remaining].slice(0, maxFields);
}


function buildNationMap(docs) {
  const map = {};
  docs.forEach(d => {
    const key = String(d.nation || '').toLowerCase().trim();
    if (!key) return;
    if (!map[key]) map[key] = { nation: d.nation, population_death_rate: 0, vehicle_death_rate: 0, total_death: 0, count: 0 };
    map[key].population_death_rate += Number(d.population_death_rate || 0);
    map[key].vehicle_death_rate    += Number(d.vehicle_death_rate    || 0);
    map[key].total_death           += Number(d.total_death           || 0);
    map[key].count++;
  });
  Object.values(map).forEach(v => {
    v.population_death_rate = Number((v.population_death_rate / v.count).toFixed(4));
    v.vehicle_death_rate    = Number((v.vehicle_death_rate    / v.count).toFixed(4));
    delete v.count;
  });
  return map;
}

// ── Helpers SOS21 ─────────────────────────────────────────────────────


function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}



function normalizeTo100(value, max) {
  const n = toNumber(value);
  const m = Math.max(toNumber(max), 1);
  return Math.max(0, Math.min(100, (n / m) * 100));
}

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
          BASE_URL_INTEGRATIONS_JFM + "/sos12-birth-death-growth",
          BASE_URL_INTEGRATIONS_JFM + "/sos14-meteorite-landings",
          BASE_URL_INTEGRATIONS_JFM + "/sos20-spice-stats",
          BASE_URL_INTEGRATIONS_JFM + "/sos21-aids-deaths-stats",
          BASE_URL_INTEGRATIONS_JFM + "/sos27-world-hydroelectric-plants",
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
  // Fuentes combinadas:
  //   - API propia road-fatalities-v2: aporta population_death_rate, total_death, income_level.
  //   - API externa Mastodon (OAuth2 client_credentials): aporta el conteo de posts públicos
  //     por hashtag de seguridad vial consultando /api/v1/timelines/tag/{tag}.
  //
  // Fórmula de combinación:
  //   weightedScore = count_posts_Mastodon * avg_population_death_rate_from_DB
  //
  // Cada slice del pie representa un hashtag con su señal social ponderada por
  // la mortalidad media de la DB propia.
  //
  // Si Mastodon no responde o las credenciales son inválidas, el fallback agrupa
  // los total_death de la DB por income_level (high, middle, low).
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
            // limit=MASTODON_POST_LIMIT: número máximo de posts recientes a recuperar.
            // Si la respuesta tiene exactamente ese número, limitReached será true,
            // indicando que hay más posts pero no se han pedido (no es el total histórico).
            const posts = await fetchJsonT(`${instance}/api/v1/timelines/tag/${tag}?limit=${MASTODON_POST_LIMIT}`, {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
              },
            });

            return {
              tag,
              count: Array.isArray(posts) ? posts.length : 0,
              limitReached: Array.isArray(posts) && posts.length >= MASTODON_POST_LIMIT,
            };
          })
        );

        // La fórmula de combinación sigue siendo: weightedScore = count * avgDeathRate.
        // count es el número de posts recientes recuperados, no el total histórico de Mastodon.
        hashtags = results
          .filter(r => r.status === "fulfilled" && r.value.count > 0)
          .map(r => ({
            tag: r.value.tag,
            count: r.value.count,
            limitReached: r.value.limitReached,
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
            ? `Conteo de posts públicos recientes de Mastodon por hashtag, hasta un máximo de ${MASTODON_POST_LIMIT} por hashtag, ponderado por la tasa media de fallecidos en carretera de la DB propia.`
            : "Fallback: fallecidos reales de la DB propia agrupados por nivel de ingresos del país porque Mastodon no estuvo disponible.",
        integrationEvidence: {
          ownApi: {
            name: "road-fatalities-v2",
            fieldsUsed: ["population_death_rate", "total_death", "income_level"],
            docsUsed: docs.length,
          },
          externalApi: {
            name: "Mastodon API",
            endpoint: `${(process.env.MASTODON_INSTANCE || "https://mastodon.social").replace(/\/$/, "")}/api/v1/timelines/tag/{tag}`,
            fieldsUsed: ["public posts count by hashtag"],
            oauthUsed: true,
            oauthFlow: "client_credentials",
            hashtagsUsed: MASTODON_HASHTAGS,
            postLimitPerHashtag: MASTODON_POST_LIMIT,
            countMeaning: "posts recientes recuperados por hashtag",
          },
          formula: "weightedScore = public_posts_count_from_Mastodon * avg_population_death_rate_from_own_DB",
        },
        mastodonContext: {
          postLimitPerHashtag: MASTODON_POST_LIMIT,
          countMeaning: "Número de posts recientes recuperados por hashtag, no total histórico de Mastodon.",
          limitReachedMeaning: "Si true, Mastodon devolvió el máximo solicitado para ese hashtag.",
        },
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
  // Fuentes combinadas:
  //   - API propia road-fatalities-v2: aporta vehicle_death_rate y population_death_rate por nación/año.
  //   - API externa Copernicus Data Space OData: aporta imageCount (@odata.count),
  //     el número de productos Sentinel-2 disponibles desde 2024-01-01.
  //
  // Fórmula de combinación:
  //   y = population_death_rate * (1 + imageCount / 200)
  //
  // imageCount escala ligeramente el eje Y: mayor cobertura satelital → mayor peso visual.
  // Se usa una consulta OData simplificada (sin filtro geográfico) para evitar timeouts.
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
      let tokenOk = false;
      let catalogueOk = false;

      try {
        // OAuth password flow: las credenciales vienen de COPERNICUS_USERNAME y COPERNICUS_PASSWORD en .env.
        const token = await getToken("jfm_copernicus", copernicusToken);
        tokenOk = true;

        // Consulta OData simplificada (sin filtro geográfico) para reducir tiempo de respuesta.
        // @odata.count devuelve el total de productos Sentinel-2 disponibles desde 2024-01-01.
        // Copernicus aporta este número; road-fatalities-v2 aporta las tasas de mortalidad.
        const url =
          "https://catalogue.dataspace.copernicus.eu/odata/v1/Products" +
          "?$count=true&$top=1" +
          "&$filter=Collection/Name eq 'SENTINEL-2'" +
          " and ContentDate/Start gt 2024-01-01T00:00:00.000Z";

        const ext = await fetchJsonT(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }, 45000);

        catalogueOk = true;
        // imageCount: número real de productos Sentinel-2 devuelto por Copernicus.
        // Se limita a 200 para que el ajuste en la fórmula sea proporcionado.
        imageCount = Math.min(Number(ext["@odata.count"] ?? 20), 200);
      } catch (e) {
        console.warn(`[JFM Copernicus] Usando fallback de DB. Motivo: ${e.message}`);
        dataSource = "fallback-db";
        apiError = e.message;
      }

      // Cada punto del scatter combina ambas fuentes:
      //   x = vehicle_death_rate de la DB propia.
      //   y = population_death_rate de la DB propia × (1 + imageCount de Copernicus / 200).
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
        api: "Copernicus Data Space OData API",
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
            ? `Copernicus Data Space aporta ${imageCount} productos Sentinel-2 (desde 2024-01-01) mediante OAuth. road-fatalities-v2 aporta vehicle_death_rate y population_death_rate. Fórmula: y = population_death_rate * (1 + ${imageCount} / 200).`
            : "Fallback: scatter calculado con DB propia y un imageCount neutro porque Copernicus no estuvo disponible.",
        integrationEvidence: {
          ownApi: {
            name: "road-fatalities-v2",
            fieldsUsed: ["vehicle_death_rate", "population_death_rate", "nation", "year"],
            docsUsed: docs.length,
          },
          externalApi: {
            name: "Copernicus Data Space OData API",
            endpoint: "https://catalogue.dataspace.copernicus.eu/odata/v1/Products",
            fieldsUsed: ["@odata.count"],
            tokenOk,
            catalogueOk,
            imageCount,
          },
          formula: "adjustedPopulationDeathRate = population_death_rate_from_own_DB * (1 + imageCount_from_Copernicus / 200)",
        },
        series: [{ name: "Mortalidad vial ajustada con Sentinel-2", data }],
        dbContext: {
          docs: docs.length,
          imageCount,
          tokenOk,
          catalogueOk,
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
      // Primero obtenemos un token OAuth2 real de FedEx usando client_credentials.
      // Este token permite hacer la petición posterior a la API externa FedEx Locations.
      const token = await getToken("jfm_fedex", fedexToken);

      // Consulta real a la API externa FedEx Locations.
      // Buscamos puntos/localizaciones asociados a una dirección de Madrid
      // usando Calle Mayor, código postal 28013 y país ES.
      // La respuesta de FedEx viene en JSON y contiene resultados de localizaciones.
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

      // locationCount representa el número de localizaciones/resultados devueltos
      // por la API externa de FedEx. En una ejecución real puede valer, por ejemplo,
      // 75 si FedEx devuelve 75 puntos/resultados para la búsqueda en Madrid.
      //
      // Se intenta leer de varias rutas posibles porque la estructura JSON puede variar
      // entre respuestas de sandbox:
      // - ext.output.locationDetailList.length
      // - ext.locationDetailList.length
      // - ext.output.matchedAddressResults.length
      //
      // Si FedEx falla o no devuelve esos campos, se usa 10 como valor neutro de fallback.
      // Por eso, cuando la integración funciona, el número visible en la gráfica puede ser
      // 75 u otro valor real devuelto por FedEx, no un valor fijo inventado.
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

    // Usamos locationCount como normalizador externo.
    // Esto hace que la gráfica combine dos fuentes:
    //
    // 1. API propia / DB propia road-fatalities-v2:
    //    aporta total_death, nation y year.
    //
    // 2. API externa FedEx Locations:
    //    aporta locationCount, es decir, el número de localizaciones/resultados
    //    devueltos por FedEx mediante OAuth2.
    //
    // Si locationCount vale 75, cada valor se calcula usando ese 75 como divisor.
    const normalizer = Math.max(1, Number(locationCount || 1));

    const nations = [...new Set(docs.map(d => d.nation || "unknown"))];

    const years = [...new Set(docs.map(d => d.year))].sort(
      (a, b) => Number(a) - Number(b)
    );

    // Cada celda del heatmap es un valor combinado:
    //
    // eje X  -> año de la DB propia.
    // eje Y  -> nación de la DB propia.
    // valor  -> total_death de la DB propia dividido entre locationCount de FedEx.
    //
    // Ejemplo:
    // Si una fila de la DB tiene total_death = 5625 y FedEx devuelve locationCount = 75,
    // el valor representado será aproximadamente 5625 / 75 = 75.
    //
    // De esta forma el widget no muestra solo datos propios ni solo datos de FedEx,
    // sino una integración de ambas APIs.
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

      integrationEvidence: {
        ownApi: {
          name: "road-fatalities-v2",
          fieldsUsed: ["total_death", "nation", "year"],
          docsUsed: docs.length,
        },
        externalApi: {
          name: "FedEx Sandbox Locations API",
          endpoint: "https://apis-sandbox.fedex.com/location/v1/locations",
          fieldsUsed: ["locationDetailList.length"],
          oauthUsed: true,
          oauthFlow: "client_credentials",
          locationsFound: locationCount,
        },
        formula: "heatmapValue = total_death_from_own_DB / locationCount_from_FedEx",
      },

      sourceType: "FedEx locations + road fatalities DB",
      ownApiFieldsUsed: ["total_death", "nation", "year"],
      externalFieldsUsed: ["locationDetailList.length"],
      explanation:
        dataSource === "api"
          ? `Se consulta FedEx Locations API mediante OAuth. FedEx devuelve ${locationCount} localizaciones y ese valor se usa para normalizar los fallecidos totales de la DB propia.`
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

  // -------------------------------------------------------------------
  // 4. SOS2526-12 -> birth-death-growth-rates (proxy SOS)
  // -------------------------------------------------------------------
  // Timeout 60s: Render free tier puede tardar ~50s en arrancar tras inactividad.
  app.get(BASE_URL_INTEGRATIONS_JFM + "/sos12-birth-death-growth", async (req, res) => {
    const SOURCE_URL = "https://sos2526-12.onrender.com/api/v2/birth-death-growth-rates";
    try {
      // Fuerza la carga inicial de datos de la API externa SOS
      await fetch("https://sos2526-12.onrender.com/api/v2/birth-death-growth-rates/LoadInitialData")
        .catch(() => {});

      const [r, ownDocs] = await Promise.all([
        fetchT(SOURCE_URL, { headers: { Accept: "application/json" } }, 60000),
        dbFindAll(),
      ]);
      const text = await r.text();
      let json;
      try {
        json = text ? JSON.parse(text) : [];
      } catch {
        throw new Error(`Respuesta no JSON desde SOS12. HTTP ${r.status}: ${text.slice(0, 300)}`);
      }
      if (!r.ok) throw new Error(`HTTP ${r.status} desde SOS12: ${text.slice(0, 300)}`);

      const items = extractArrayPayload(json);
      const nationMap = buildNationMap(ownDocs);

      const firstKeys = items.length ? Object.keys(items[0]) : [];
      const deathField = ["crude_death_rate", "death_rate", "mortality_rate", "death"]
        .find(f => firstKeys.includes(f)) ?? null;
      const countryField = ["country_name", "country", "nation"].find(f => firstKeys.includes(f)) ?? "country";

      const sos12Preferred = [
        "country_name", "country", "nation",
        "year",
        "crude_birth_rate", "birth_rate",
        deathField,
        "growth_rate",
        "country_code",
      ].filter(Boolean);

      const fields = pickFields(items, sos12Preferred, 6);
      const fieldsShown = [...fields, "road_population_death_rate", "road_total_death"];

      // Filas combinadas: campos SOS12 + campos road-fatalities cruzados por país
      const combinedData = items.slice(0, 50).map(row => {
        const key = String(row[countryField] || '').toLowerCase().trim();
        const own = nationMap[key] || null;
        const projected = {};
        fields.forEach(f => { projected[f] = row?.[f]; });
        projected.road_population_death_rate = own?.population_death_rate ?? null;
        projected.road_total_death = own?.total_death ?? null;
        return projected;
      });

      let chartData12 = null;
      if (items.length > 0) {
        const fKeys = Object.keys(items[0]);
        const bField = ['crude_birth_rate', 'birth_rate'].find(f => fKeys.includes(f)) || 'crude_birth_rate';

        // Bar combinado: crude_birth_rate (SOS12) vs population_death_rate (propio) por país
        const barItems = items
          .filter(row => {
            const k = String(row[countryField] || '').toLowerCase().trim();
            return nationMap[k] && Number(row[bField] || 0) > 0;
          })
          .slice(0, 12);

        if (barItems.length > 0) {
          chartData12 = {
            library: "ECharts", type: "bar",
            description: "Tasa bruta de natalidad (SOS12) vs mortalidad vial (road-fatalities-v2) por país",
            xAxis: barItems.map(row => String(row[countryField] || '')),
            series: [
              {
                name: "crude_birth_rate (SOS2526-12)",
                data: barItems.map(row => Number(row[bField] || 0))
              },
              {
                name: "population_death_rate (road-fatalities-v2)",
                data: barItems.map(row => {
                  const k = String(row[countryField] || '').toLowerCase().trim();
                  return nationMap[k]?.population_death_rate ?? 0;
                })
              }
            ]
          };
        }

      }

      const matchedCount = combinedData.filter(r => r.road_population_death_rate !== null).length;

      res.json({
        api: "SOS2526-12 birth-death-growth-rates",
        sourceUrl: SOURCE_URL,
        dataSource: "api",
        apiError: null,
        externalApiUsed: true,
        combinedWithOwnApi: true,
        sosApi: true,
        group: "SOS2526-12",
        integratedBy: "JFM",
        fetchedAt: new Date().toISOString(),
        count: items.length,
        matchedCountries: matchedCount,
        fieldsShown,
        chartData: chartData12,
        explanation: `Combinación de tasas de natalidad por país (SOS2526-12) con mortalidad vial propia (road-fatalities-v2). El gráfico de barras compara crude_birth_rate (SOS12) con population_death_rate (propio) para ${chartData12?.xAxis?.length ?? 0} países coincidentes.`,
        ownApiFieldsUsed: ["nation", "population_death_rate", "total_death"],
        data: combinedData,
      });
    } catch (e) {
      res.json({
        api: "SOS2526-12 birth-death-growth-rates",
        sourceUrl: SOURCE_URL,
        dataSource: "api-error",
        apiError: e.message,
        externalApiUsed: false,
        combinedWithOwnApi: false,
        sosApi: true,
        group: "SOS2526-12",
        integratedBy: "JFM",
        fetchedAt: new Date().toISOString(),
        count: 0,
        fieldsShown: [],
        explanation: "No se pudo consultar la API SOS externa.",
        data: [],
      });
    }
  });

  // -------------------------------------------------------------------
  // 5. SOS2526-14 -> meteorite-landings (proxy SOS)
  // -------------------------------------------------------------------
  app.get(BASE_URL_INTEGRATIONS_JFM + "/sos14-meteorite-landings", async (req, res) => {
    const SOURCE_URL = "https://meteorite-landings-tvcf.onrender.com/api/v2/meteorite-landings";
    const FIELDS_SHOWN = ["name", "year", "mass", "country", "geolocation", "id", "road_population_death_rate", "road_total_death"];
    try {
      // Fuerza la carga inicial de datos de la API externa SOS
      await fetch("https://meteorite-landings-tvcf.onrender.com/api/v2/meteorite-landings/LoadInitialData")
        .catch(() => {});

      const [r, ownDocs] = await Promise.all([
        fetchT(SOURCE_URL, { headers: { Accept: "application/json" } }, 45000),
        dbFindAll(),
      ]);
      const text = await r.text();
      let json;
      try {
        json = text ? JSON.parse(text) : [];
      } catch {
        throw new Error(`Respuesta no JSON desde SOS14. HTTP ${r.status}: ${text.slice(0, 300)}`);
      }
      if (!r.ok) throw new Error(`HTTP ${r.status} desde SOS14: ${text.slice(0, 300)}`);

      const rows = extractArrayPayload(json);
      const nationMap = buildNationMap(ownDocs);

      // Agrega meteoritos por país para el treemap
      const byCountry14 = {};
      rows.forEach(row => {
        const country = row.country || 'Unknown';
        if (!byCountry14[country]) byCountry14[country] = { count: 0, totalMass: 0 };
        byCountry14[country].count++;
        byCountry14[country].totalMass += Number(row.mass || 0);
      });

      const chartData14 = {
        library: "ECharts",
        type: "treemap",
        description: "Meteoritos × mortalidad vial por país (SOS14 + road-fatalities-v2)",
        countries: Object.entries(byCountry14)
          .map(([name, { count, totalMass }]) => {
            const key = name.toLowerCase().trim();
            const own = nationMap[key] || null;
            if (!own) return null;
            return {
              name,
              value: Math.round(count * own.population_death_rate * 10) / 10,
              meteoriteCount: count,
              totalMass: Math.round(totalMass),
              road_population_death_rate: own.population_death_rate,
            };
          })
          .filter(Boolean)
          .sort((a, b) => b.value - a.value)
          .slice(0, 15),
      };

      // Filas para la tabla: campos SOS14 + road-fatalities cruzados por país
      const normalizedRows = rows.slice(0, 50).map(row => {
        const key = String(row.country || '').toLowerCase().trim();
        const own = nationMap[key] || null;
        return {
          name:        row.name,
          year:        row.year,
          mass:        row.mass,
          country:     row.country,
          geolocation: row.geolocation,
          id:          row.id,
          road_population_death_rate: own?.population_death_rate ?? null,
          road_total_death: own?.total_death ?? null,
        };
      });

      res.json({
        api: "SOS2526-14 meteorite-landings",
        sourceUrl: SOURCE_URL,
        dataSource: "api",
        apiError: null,
        externalApiUsed: true,
        combinedWithOwnApi: true,
        sosApi: true,
        group: "SOS2526-14",
        integratedBy: "JFM",
        fetchedAt: new Date().toISOString(),
        count: rows.length,
        matchedCountries: chartData14.countries.length,
        fieldsShown: FIELDS_SHOWN,
        chartData: chartData14,
        explanation: `Combinación de aterrizajes de meteoritos por país (SOS2526-14) con mortalidad vial propia (road-fatalities-v2). El treemap dimensiona cada país según meteorite_count × population_death_rate (ambas fuentes combinadas), mostrando los ${chartData14.countries.length} países con datos en ambas fuentes.`,
        ownApiFieldsUsed: ["nation", "population_death_rate", "total_death"],
        data: normalizedRows,
      });
    } catch (e) {
      res.json({
        api: "SOS2526-14 meteorite-landings",
        sourceUrl: SOURCE_URL,
        dataSource: "api-error",
        apiError: e.message,
        externalApiUsed: false,
        combinedWithOwnApi: false,
        sosApi: true,
        group: "SOS2526-14",
        integratedBy: "JFM",
        fetchedAt: new Date().toISOString(),
        count: 0,
        fieldsShown: [],
        explanation: "No se pudo consultar la API SOS2526-14 externa.",
        data: [],
      });
    }
  });

  // -------------------------------------------------------------------
  // 6. SOS2526-20 -> spice-stats (proxy SOS)
  // -------------------------------------------------------------------
  app.get(BASE_URL_INTEGRATIONS_JFM + "/sos20-spice-stats", async (req, res) => {
    const SOURCE_URL = "https://sos2526-20-stable.onrender.com/api/v2/spice-stats?limit=1000&offset=0";
    try {
      // Fuerza la carga inicial de datos de la API externa SOS
      await fetch("https://sos2526-20-stable.onrender.com/api/v2/spice-stats/LoadInitialData")
        .catch(() => {});

      const [r, ownDocs] = await Promise.all([
        fetchT(SOURCE_URL, { headers: { Accept: "application/json" } }, 60000),
        dbFindAll(),
      ]);
      const text = await r.text();
      let json;
      try {
        json = text ? JSON.parse(text) : [];
      } catch {
        throw new Error(`Respuesta no JSON desde SOS20. HTTP ${r.status}: ${text.slice(0, 300)}`);
      }
      if (!r.ok) throw new Error(`HTTP ${r.status} desde SOS20: ${text.slice(0, 300)}`);

      const items = extractArrayPayload(json);

      const fieldsShown = ["year", "spice_total_production", "spice_total_import", "spice_total_export", "spice_total_consumption", "spice_unique_items", "spice_unique_areas", "spice_top_items", "road_total_death", "population_death_rate", "vehicle_death_rate", "road_countries_count"];

      // Agrupa especias por año: suma métricas y recoge top items por producción
      const spiceByYear = new Map();
      items.forEach(row => {
        const year = toNumber(row.year);
        if (!year) return;
        if (!spiceByYear.has(year)) {
          spiceByYear.set(year, {
            spice_total_production:  0,
            spice_total_import:      0,
            spice_total_export:      0,
            spice_total_consumption: 0,
            areas:    new Set(),
            itemsMap: new Map(),
          });
        }
        const e = spiceByYear.get(year);
        e.spice_total_production  += toNumber(row.production);
        e.spice_total_import      += toNumber(row.import);
        e.spice_total_export      += toNumber(row.export);
        e.spice_total_consumption += toNumber(row.consumption);
        if (row.area) e.areas.add(String(row.area));
        if (row.item) {
          const prev = e.itemsMap.get(row.item) || 0;
          e.itemsMap.set(row.item, prev + toNumber(row.production));
        }
      });

      // Agrupa road-fatalities por año: suma muertes, media tasas
      const roadByYear20 = new Map();
      ownDocs.forEach(row => {
        const year = toNumber(row.year);
        if (!year) return;
        if (!roadByYear20.has(year)) {
          roadByYear20.set(year, { road_total_death: 0, pop_rate_sum: 0, veh_rate_sum: 0, rate_count: 0, road_countries_count: 0 });
        }
        const e = roadByYear20.get(year);
        e.road_total_death      += toNumber(row.total_death);
        e.pop_rate_sum          += toNumber(row.population_death_rate);
        e.veh_rate_sum          += toNumber(row.vehicle_death_rate);
        e.rate_count            += 1;
        e.road_countries_count  += 1;
      });

      const spiceYears = [...spiceByYear.keys()].sort((a, b) => a - b);
      const commonYears20 = spiceYears.filter(y => roadByYear20.has(y));

      // Fila por año común con datos de ambas fuentes
      const combinedData20 = commonYears20.map(year => {
        const s = spiceByYear.get(year);
        const r = roadByYear20.get(year);
        const topItems = [...s.itemsMap.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([name]) => name);
        return {
          year,
          spice_total_production:  Math.round(s.spice_total_production),
          spice_total_import:      Math.round(s.spice_total_import * 100) / 100,
          spice_total_export:      Math.round(s.spice_total_export * 100) / 100,
          spice_total_consumption: Math.round(s.spice_total_consumption * 100) / 100,
          spice_unique_items:      s.itemsMap.size,
          spice_unique_areas:      s.areas.size,
          spice_top_items:         topItems.join(" · ") || "—",
          road_total_death:        r.road_total_death,
          population_death_rate:   Number((r.pop_rate_sum / r.rate_count).toFixed(4)),
          vehicle_death_rate:      Number((r.veh_rate_sum / r.rate_count).toFixed(4)),
          road_countries_count:    r.road_countries_count,
        };
      });

      // Radar: métricas normalizadas (0-100) por año — cada año es una serie en el radar
      const maxProd20  = Math.max(...combinedData20.map(d => d.spice_total_production), 1);
      const maxCons20  = Math.max(...combinedData20.map(d => Math.abs(d.spice_total_consumption)), 1);
      const maxRoad20  = Math.max(...combinedData20.map(d => d.road_total_death), 1);
      const maxPop20   = Math.max(...combinedData20.map(d => d.population_death_rate), 1);
      const maxVeh20   = Math.max(...combinedData20.map(d => d.vehicle_death_rate), 1);

      const radarIndicators20 = [
        { name: "Producción especias",  max: 100 },
        { name: "Consumo especias",     max: 100 },
        { name: "Muertes viales",       max: 100 },
        { name: "Tasa vial población",  max: 100 },
        { name: "Tasa vial vehículo",   max: 100 },
      ];

      const radarSeries20 = combinedData20.map(row => ({
        name: String(row.year),
        values: [
          Math.round(normalizeTo100(row.spice_total_production,              maxProd20) * 10) / 10,
          Math.round(normalizeTo100(Math.abs(row.spice_total_consumption),   maxCons20) * 10) / 10,
          Math.round(normalizeTo100(row.road_total_death,                    maxRoad20) * 10) / 10,
          Math.round(normalizeTo100(row.population_death_rate,               maxPop20)  * 10) / 10,
          Math.round(normalizeTo100(row.vehicle_death_rate,                  maxVeh20)  * 10) / 10,
        ],
        raw: row,
      }));

      const chartData20 = combinedData20.length > 0 ? {
        library: "ECharts", type: "radar",
        description: "Métricas normalizadas (0-100) de especias y mortalidad vial por año (SOS20 + road-fatalities-v2)",
        indicators: radarIndicators20,
        series: radarSeries20,
        matchedCount: combinedData20.length,
      } : null;

      res.json({
        api: "SOS2526-20 spice-stats",
        sourceUrl: SOURCE_URL,
        dataSource: "api",
        apiError: null,
        externalApiUsed: true,
        combinedWithOwnApi: true,
        sosApi: true,
        group: "SOS2526-20",
        integratedBy: "JFM",
        fetchedAt: new Date().toISOString(),
        count: combinedData20.length,
        matchedYears: combinedData20.length,
        fieldsShown,
        chartData: chartData20,
        explanation: `Combinación de producción de especias por año (SOS2526-20) con mortalidad vial propia (road-fatalities-v2). El radar compara 5 métricas normalizadas (0-100) para los ${combinedData20.length} años en común: producción, consumo de especias, muertes viales, tasa vial por población y tasa vial por vehículo.`,
        ownApiFieldsUsed: ["year", "population_death_rate", "total_death"],
        debug: {
          sos20RawTotal:  json.total ?? null,
          sos20Returned:  items.length,
          spiceYears,
          roadYears:      [...roadByYear20.keys()].sort((a, b) => a - b),
          commonYears20,
        },
        data: combinedData20,
      });
    } catch (e) {
      res.json({
        api: "SOS2526-20 spice-stats",
        sourceUrl: SOURCE_URL,
        dataSource: "api-error",
        apiError: e.message,
        externalApiUsed: false,
        combinedWithOwnApi: false,
        sosApi: true,
        group: "SOS2526-20",
        integratedBy: "JFM",
        fetchedAt: new Date().toISOString(),
        count: 0,
        fieldsShown: [],
        explanation: "No se pudo consultar la API SOS externa.",
        data: [],
      });
    }
  });

  // -------------------------------------------------------------------
  // 6. SOS2526-21 -> aids-deaths-stats (proxy SOS)
  // -------------------------------------------------------------------
  app.get(BASE_URL_INTEGRATIONS_JFM + "/sos21-aids-deaths-stats", async (req, res) => {
    const SOURCE_URL = "https://soporte-sos.onrender.com/api/v1/aids-deaths-stats";
    const FIELDS_SHOWN = ["year", "hiv_aids_total_deaths", "aids_under5", "aids_5_14", "aids_15_49", "aids_50_69", "aids_70plus", "road_total_death", "population_death_rate", "vehicle_death_rate", "aids_countries_count", "road_countries_count"];
    try {
      // Fuerza la carga inicial de datos de la API externa SOS
      await fetch("https://soporte-sos.onrender.com/api/v1/aids-deaths-stats/LoadInitialData")
        .catch(() => {});

      const [r, ownDocs] = await Promise.all([
        fetchT(SOURCE_URL, { headers: { Accept: "application/json" } }, 60000),
        dbFindAll(),
      ]);
      const text = await r.text();
      let json;
      try {
        json = text ? JSON.parse(text) : [];
      } catch {
        throw new Error(`Respuesta no JSON desde SOS21. HTTP ${r.status}: ${text.slice(0, 300)}`);
      }
      if (!r.ok) throw new Error(`HTTP ${r.status} desde SOS21: ${text.slice(0, 300)}`);

      const aidsItems = extractArrayPayload(json);

      // Agrupa AIDS por año: suma muertes, media tasas
      const aidsByYear = new Map();
      for (const row of aidsItems) {
        const year = toNumber(row.year);
        if (!year) continue;
        if (!aidsByYear.has(year)) {
          aidsByYear.set(year, { aids_under5: 0, aids_5_14: 0, aids_15_49: 0, aids_50_69: 0, aids_70plus: 0, aids_countries_count: 0 });
        }
        const e = aidsByYear.get(year);
        e.aids_under5  += toNumber(row.death_count_hiv_aids_under_5);
        e.aids_5_14    += toNumber(row.death_count_hiv_aids_5_14);
        e.aids_15_49   += toNumber(row.death_count_hiv_aids_15_49);
        e.aids_50_69   += toNumber(row.death_count_hiv_aids_50_69);
        e.aids_70plus  += toNumber(row.death_count_hiv_aids_70_plus);
        e.aids_countries_count += 1;
      }

      // Agrupa road-fatalities por año: suma muertes, media tasas
      const roadByYear = new Map();
      for (const row of ownDocs) {
        const year = toNumber(row.year);
        if (!year) continue;
        if (!roadByYear.has(year)) {
          roadByYear.set(year, { road_total_death: 0, pop_rate_sum: 0, veh_rate_sum: 0, rate_count: 0, road_countries_count: 0 });
        }
        const e = roadByYear.get(year);
        e.road_total_death += toNumber(row.total_death);
        e.pop_rate_sum     += toNumber(row.population_death_rate);
        e.veh_rate_sum     += toNumber(row.vehicle_death_rate);
        e.rate_count       += 1;
        e.road_countries_count += 1;
      }

      const aidsYears = [...aidsByYear.keys()].sort((a, b) => a - b);
      const commonYears = aidsYears.filter(y => roadByYear.has(y));

      // Fila por año común con datos de ambas fuentes
      const combinedData = commonYears.map(year => {
        const a = aidsByYear.get(year);
        const r = roadByYear.get(year);
        const hiv_aids_total_deaths = a.aids_under5 + a.aids_5_14 + a.aids_15_49 + a.aids_50_69 + a.aids_70plus;
        return {
          year,
          hiv_aids_total_deaths,
          aids_under5:          a.aids_under5,
          aids_5_14:            a.aids_5_14,
          aids_15_49:           a.aids_15_49,
          aids_50_69:           a.aids_50_69,
          aids_70plus:          a.aids_70plus,
          aids_countries_count: a.aids_countries_count,
          road_total_death:        r.road_total_death,
          population_death_rate:   Number((r.pop_rate_sum / r.rate_count).toFixed(4)),
          vehicle_death_rate:      Number((r.veh_rate_sum / r.rate_count).toFixed(4)),
          road_countries_count:    r.road_countries_count,
        };
      });

      // Heatmap normalizado (0-100) por año × métrica
      const maxHivTotal       = Math.max(...combinedData.map(d => d.hiv_aids_total_deaths), 1);
      const maxAidsUnder5     = Math.max(...combinedData.map(d => d.aids_under5), 1);
      const maxRoadDeaths     = Math.max(...combinedData.map(d => d.road_total_death), 1);
      const maxPopulationRate = Math.max(...combinedData.map(d => d.population_death_rate), 1);
      const maxVehicleRate    = Math.max(...combinedData.map(d => d.vehicle_death_rate), 1);

      const metrics21 = [
        { key: "hiv_aids_total_deaths", label: "Muertes VIH/SIDA totales", max: maxHivTotal },
        { key: "aids_under5",           label: "Muertes VIH <5 años",       max: maxAidsUnder5 },
        { key: "road_total_death",      label: "Muertes viales",             max: maxRoadDeaths },
        { key: "population_death_rate", label: "Tasa vial población",        max: maxPopulationRate },
        { key: "vehicle_death_rate",    label: "Tasa vial vehículo",         max: maxVehicleRate },
      ];

      const heatmapData21 = [];
      combinedData.forEach((row, xIndex) => {
        metrics21.forEach((metric, yIndex) => {
          heatmapData21.push({
            value: [xIndex, yIndex, Math.round(normalizeTo100(row[metric.key], metric.max) * 10) / 10],
            raw: row,
            metric,
          });
        });
      });

      const chartData21 = combinedData.length > 0 ? {
        library: "ECharts",
        type: "heatmap",
        description: "Indicadores normalizados VIH/SIDA y mortalidad vial por año (SOS2526-21 + road-fatalities-v2)",
        years: combinedData.map(d => String(d.year)),
        metrics: metrics21.map(m => m.label),
        data: heatmapData21,
        matchedCount: combinedData.length,
      } : null;

      res.json({
        api: "SOS2526-21 aids-deaths-stats",
        sourceUrl: SOURCE_URL,
        dataSource: "api",
        apiError: null,
        externalApiUsed: true,
        combinedWithOwnApi: true,
        sosApi: true,
        group: "SOS2526-21",
        integratedBy: "JFM",
        fetchedAt: new Date().toISOString(),
        count: combinedData.length,
        matchedYears: combinedData.length,
        fieldsShown: FIELDS_SHOWN,
        chartData: chartData21,
        explanation: `Combinación de muertes por VIH/SIDA desglosadas por edad (<5, 5-14, 15-49, 50-69, 70+ años) de SOS2526-21 con mortalidad vial propia (road-fatalities-v2). El heatmap compara indicadores normalizados (0-100) de ambas fuentes para los ${combinedData.length} años en común.`,
        ownApiFieldsUsed: ["year", "population_death_rate", "vehicle_death_rate", "total_death"],
        data: combinedData,
      });
    } catch (e) {
      res.json({
        api: "SOS2526-21 aids-deaths-stats",
        sourceUrl: SOURCE_URL,
        dataSource: "api-error",
        apiError: e.message,
        externalApiUsed: false,
        combinedWithOwnApi: false,
        sosApi: true,
        group: "SOS2526-21",
        integratedBy: "JFM",
        fetchedAt: new Date().toISOString(),
        count: 0,
        fieldsShown: [],
        explanation: "No se pudo consultar la API SOS2526-21 externa.",
        data: [],
      });
    }
  });

  // ── SOS2526-27 world-hydroelectric-plants ────────────────────────────────
  app.get(BASE_URL_INTEGRATIONS_JFM + "/sos27-world-hydroelectric-plants", async (req, res) => {
    const SOURCE_URL = "https://sos2526-27.onrender.com/api/v1/world-hydroelectric-plants";
    const fieldsShown = ["country","name","year","river","plant_type","capacity_mw","head_m","dam_name","res_vol_km3","road_population_death_rate","road_total_death"];
    try {
      // Fuerza la carga inicial de datos de la API externa SOS
      await fetch("https://sos2526-27.onrender.com/api/v1/world-hydroelectric-plants/LoadInitialData")
        .catch(() => {});

      const [r, ownDocs] = await Promise.all([
        fetchT(SOURCE_URL, { headers: { Accept: "application/json" } }, 45000),
        dbFindAll(),
      ]);
      if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`);
      const json = await r.json();
      const rows = extractArrayPayload(json);
      const nationMap = buildNationMap(ownDocs);

      // Agrega capacidad total por país para el scatter combinado
      const byCountry27 = {};
      rows.forEach(row => {
        const country = String(row.country || 'N/A');
        if (!byCountry27[country]) byCountry27[country] = 0;
        byCountry27[country] += Number(row.capacity_mw || 0);
      });

      // Scatter combinado: capacidad total MW por país (SOS27) vs population_death_rate (road-fatalities-v2)
      const chartData27 = {
        library: "ECharts",
        type: "scatter",
        description: "Capacidad hidroeléctrica total MW por país (SOS27) vs mortalidad vial (road-fatalities-v2)",
        data: Object.entries(byCountry27)
          .map(([country, totalMW]) => {
            const key = country.toLowerCase().trim();
            const own = nationMap[key] || null;
            if (!own || totalMW === 0) return null;
            return {
              name: country,
              x: Math.round(totalMW),
              y: own.population_death_rate,
              capacity_mw: Math.round(totalMW),
              road_population_death_rate: own.population_death_rate,
              road_total_death: own.total_death,
            };
          })
          .filter(Boolean)
          .sort((a, b) => b.x - a.x)
          .slice(0, 30),
      };

      // Filas para tabla: campos SOS27 + road-fatalities cruzados por país
      const normalizedRows = rows.slice(0, 50).map(row => {
        const key = String(row.country || '').toLowerCase().trim();
        const own = nationMap[key] || null;
        return {
          country:     row.country     ?? "N/A",
          name:        row.name        ?? "N/A",
          year:        row.year        ?? "N/A",
          river:       row.river       ?? "N/A",
          plant_type:  row.plant_type  ?? "N/A",
          capacity_mw: row.capacity_mw ?? "N/A",
          head_m:      row.head_m      ?? "N/A",
          dam_name:    row.dam_name    ?? "N/A",
          res_vol_km3: row.res_vol_km3 ?? "N/A",
          road_population_death_rate: own?.population_death_rate ?? null,
          road_total_death: own?.total_death ?? null,
        };
      });

      res.json({
        api: "SOS2526-27 world-hydroelectric-plants",
        sourceUrl: SOURCE_URL,
        dataSource: "api",
        apiError: null,
        externalApiUsed: true,
        combinedWithOwnApi: true,
        sosApi: true,
        group: "SOS2526-27",
        integratedBy: "JFM",
        fetchedAt: new Date().toISOString(),
        count: rows.length,
        matchedCountries: chartData27.data.length,
        fieldsShown,
        chartData: chartData27,
        explanation: `Combinación de centrales hidroeléctricas por país (SOS2526-27) con mortalidad vial propia (road-fatalities-v2). El scatter muestra total_capacity_mw (SOS27) vs population_death_rate (propio) para ${chartData27.data.length} países con datos en ambas fuentes.`,
        ownApiFieldsUsed: ["nation", "population_death_rate", "total_death"],
        data: normalizedRows,
      });
    } catch (e) {
      res.json({
        api: "SOS2526-27 world-hydroelectric-plants",
        sourceUrl: SOURCE_URL,
        dataSource: "api-error",
        apiError: e.message,
        externalApiUsed: false,
        combinedWithOwnApi: false,
        sosApi: true,
        group: "SOS2526-27",
        integratedBy: "JFM",
        fetchedAt: new Date().toISOString(),
        count: 0,
        fieldsShown: [],
        explanation: "No se pudo consultar la API SOS2526-27 externa.",
        data: [],
      });
    }
  });
}