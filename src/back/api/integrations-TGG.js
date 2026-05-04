// =====================================================================
// integrations-TGG.js  (Tomás Gutiérrez García)
// 1 widget sobre literacy-rates:
//   - NewsAPI -> funnel
// =====================================================================

import { dbLiteracy as db } from "./db.js";

export const BASE_URL_INTEGRATIONS_TGG = "/api/integrations/tgg";

export function loadBackendIntegrationsTGG(app) {

  const findAll = () => new Promise((res, rej) =>
    db.find({}, (err, docs) => (err ? rej(err) : res(docs)))
  );

  // -------- NewsAPI -> funnel ----------------------------------------
  app.get(BASE_URL_INTEGRATIONS_TGG + "/newsapi-education", async (req, res) => {
    try {
      const ext = await fetch(
        `https://newsapi.org/v2/everything?q=literacy+education&pageSize=20&apiKey=${process.env.NEWSAPI_KEY}`
      ).then(r => r.json());

      const schools = (ext.articles || []).length || 1;

      const docs = await findAll();
      const avg = (k) => docs.reduce((a, b) => a + (b[k] || 0), 0) / Math.max(1, docs.length);

      const data = [
        ["Población alfabetizada (media)", Math.round(avg("total") * schools * 100)],
        ["Hombres alfabetizados",          Math.round(avg("male")  * schools * 100)],
        ["Mujeres alfabetizadas",          Math.round(avg("female") * schools * 100)],
        ["Brecha cubierta",                Math.round((100 - avg("gender_gap")) * schools * 50)],
        ["Educación superior (proxy)",     Math.round(avg("total") * schools * 30)],
      ];

      res.json({ chartType: "funnel", series: [{ name: "Embudo educativo", data }] });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
  app.get(BASE_URL_INTEGRATIONS_TGG + "/spotify-literacy", async (req, res) => {
  try {
    // 1. Token
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Authorization": "Basic " + Buffer.from(
          process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_CLIENT_SECRET
        ).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: "grant_type=client_credentials"
    }).then(r => r.json());

    const accessToken = tokenRes.access_token;

    // 2. Datos externos (búsqueda de tracks de educación)
    const searchUrl = new URL("https://api.spotify.com/v1/search");
    searchUrl.searchParams.set("q", "education");
    searchUrl.searchParams.set("type", "track");
    searchUrl.searchParams.set("limit", "10");
    const ext = await fetch(searchUrl.toString(), { headers: { Authorization: `Bearer ${accessToken}` } }).then(r => r.json());

    const popularity = (ext.tracks?.items?.length || 1);

    // 3. Tu DB
    const docs = await findAll();
    const avg = (k) => docs.reduce((a, b) => a + (b[k] || 0), 0) / docs.length;

    const data = [
      { name: "Alfabetización", y: avg("total"), z: popularity },
      { name: "Hombres", y: avg("male"), z: popularity / 2 },
      { name: "Mujeres", y: avg("female"), z: popularity / 2 }
    ];

    res.json({
      chartType: "variablepie",
      series: [{ name: "Spotify vs Literacy", data }]
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
  });

  
  app.get(BASE_URL_INTEGRATIONS_TGG + "/github-literacy", async (req, res) => {
  try {
    const ext = await fetch("https://api.github.com/search/repositories?q=education&per_page=10")
      .then(r => r.json());

    const repos = ext.items?.length || 1;

    const docs = await findAll();
    const avg = (k) => docs.reduce((a, b) => a + (b[k] || 0), 0) / docs.length;

    const categories = ["Total", "Hombres", "Mujeres"];

    const series = [
      {
        name: "Literacy",
        data: [avg("total"), avg("male"), avg("female")]
      },
      {
        name: "Actividad GitHub",
        data: [repos * 2, repos, repos]
      }
    ];

    res.json({ chartType: "column", categories, series });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

  // -------- SOS2526-14 Active Satellites -> C3.js donut ----------------------------------------
  app.get(BASE_URL_INTEGRATIONS_TGG + "/sos14-satellites", async (req, res) => {
    try {
      await fetch("https://sos2526-14-yjus.onrender.com/api/v1/active-satellites/loadInitialData")
        .catch(() => {});

      const ext = await fetch("https://sos2526-14-yjus.onrender.com/api/v1/active-satellites")
        .then(r => r.json());

      const docs = await findAll();
      const avg = (k) => docs.reduce((a, b) => a + (b[k] || 0), 0) / Math.max(1, docs.length);

      const items = Array.isArray(ext) ? ext : (Array.isArray(ext.data) ? ext.data : []);
      const totalSatellites = items.length || 1;

      const avgTotal  = Math.round(avg("total")  * 10) / 10;
      const avgMale   = Math.round(avg("male")   * 10) / 10;
      const avgFemale = Math.round(avg("female") * 10) / 10;
      const gapShare  = Math.max(0, Math.round((avgMale - avgFemale) * 10) / 10);

      res.json({
        chartType: "donut",
        totalSatellites,
        columns: [
          ["Alfabetización Total (%)", avgTotal],
          ["Alfabetización Masculina (%)", avgMale],
          ["Alfabetización Femenina (%)", avgFemale],
          ["Brecha de género", gapShare]
        ]
      });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // -------- SOS2526-20 Coffee Stats -> C3.js bar ----------------------------------------
  app.get(BASE_URL_INTEGRATIONS_TGG + "/sos20-coffee", async (req, res) => {
    try {
      await fetch("https://sos2526-20-stable.onrender.com/api/v2/coffee-stats/loadInitialData")
        .catch(() => {});

      const ext = await fetch("https://sos2526-20-stable.onrender.com/api/v2/coffee-stats")
        .then(r => r.json());

      const docs = await findAll();
      const avg = (k) => docs.reduce((a, b) => a + (b[k] || 0), 0) / Math.max(1, docs.length);

      const items = (Array.isArray(ext) ? ext : (Array.isArray(ext.data) ? ext.data : [])).slice(0, 5);

      const categories = [];
      const literacyVals = [];
      const coffeeVals   = [];

      for (const item of items) {
        const label = String(item.country || item.entity || item.name || item.region || "–").substring(0, 20);
        categories.push(label);

        const match = docs.find(d =>
          d.country && label.toLowerCase().startsWith(d.country.toLowerCase().substring(0, 4))
        );
        literacyVals.push(match ? Math.round(match.total * 10) / 10 : Math.round(avg("total") * 10) / 10);

        const numericKey = ["production", "consumption", "value", "yield", "total", "amount"]
          .find(k => typeof item[k] === "number");
        const raw = numericKey ? item[numericKey] : (Object.values(item).find(v => typeof v === "number") ?? 0);
        // normalise to 0-100 range relative to max in dataset
        coffeeVals.push(Math.round(Number(raw) * 10) / 10);
      }

      if (categories.length === 0) {
        categories.push(...["Total", "Hombres", "Mujeres"]);
        literacyVals.push(
          Math.round(avg("total")  * 10) / 10,
          Math.round(avg("male")   * 10) / 10,
          Math.round(avg("female") * 10) / 10
        );
        coffeeVals.push(0, 0, 0);
      }

      // normalise coffee values to 0-100 scale
      const maxCoffee = Math.max(...coffeeVals, 1);
      const coffeeNorm = coffeeVals.map(v => Math.round((v / maxCoffee) * 100 * 10) / 10);

      res.json({
        chartType: "bar",
        categories,
        columns: [
          ["Tasa Alfabetización (%)", ...literacyVals],
          ["Café stats (normalizado 0-100)", ...coffeeNorm]
        ]
      });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // -------- soporte-sos Cholera Stats -> C3.js pie ----------------------------------------
  app.get(BASE_URL_INTEGRATIONS_TGG + "/cholera-stats", async (req, res) => {
    try {
      await fetch("https://soporte-sos.onrender.com/api/v1/cholera-stats/loadInitialData")
        .catch(() => {});

      const ext = await fetch("https://soporte-sos.onrender.com/api/v1/cholera-stats")
        .then(r => r.json());

      const docs = await findAll();
      const avg = (k) => docs.reduce((a, b) => a + (b[k] || 0), 0) / Math.max(1, docs.length);

      const items = Array.isArray(ext) ? ext : (Array.isArray(ext.data) ? ext.data : []);

      // Extract top numeric value from cholera items (cases, deaths, rate, etc.)
      const numericKey = items.length > 0
        ? ["cases", "deaths", "fatalities", "rate", "total", "value", "count"]
            .find(k => typeof items[0][k] === "number")
        : null;

      const choleraTotal = items.reduce((sum, item) => {
        const raw = numericKey ? item[numericKey]
          : (Object.values(item).find(v => typeof v === "number") ?? 0);
        return sum + Number(raw);
      }, 0) || 1;

      const avgTotal  = Math.round(avg("total")  * 10) / 10;
      const avgMale   = Math.round(avg("male")   * 10) / 10;
      const avgFemale = Math.round(avg("female") * 10) / 10;

      // Normalise cholera total to same order of magnitude as literacy (0-100 scale)
      const choleraScaled = Math.min(100, Math.round((choleraTotal / Math.max(choleraTotal, 1)) * 30 * 10) / 10);

      res.json({
        chartType: "pie",
        totalItems: items.length,
        columns: [
          ["Alfabetización Total (%)", avgTotal],
          ["Alfabetización Masculina (%)", avgMale],
          ["Alfabetización Femenina (%)", avgFemale],
          ["Cólera (escala relativa)", choleraScaled]
        ]
      });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // -------- SOS2526-12 Age-Specific Fertility Rates -> C3.js scatter ----------------------------------------
  app.get(BASE_URL_INTEGRATIONS_TGG + "/sos12-fertility", async (req, res) => {
    try {
      await fetch("https://sos2526-12.onrender.com/api/v2/age-specific-fertility-rates/loadInitialData")
        .catch(() => {});

      const ext = await fetch("https://sos2526-12.onrender.com/api/v2/age-specific-fertility-rates")
        .then(r => r.json());

      const docs = await findAll();

      const items = (Array.isArray(ext) ? ext : (Array.isArray(ext.data) ? ext.data : [])).slice(0, 8);

      // Extract numeric fertility value per item
      const fertilityPoints = items.map((item, i) => {
        const numericKey = ["rate", "fertility_rate", "value", "births", "total", "fertility"]
          .find(k => typeof item[k] === "number");
        const raw = numericKey ? item[numericKey]
          : (Object.values(item).find(v => typeof v === "number") ?? 0);
        return Math.round(Number(raw) * 10) / 10;
      });

      // Top literacy rates from DB for scatter overlay
      const topDocs = [...docs]
        .sort((a, b) => (b.total || 0) - (a.total || 0))
        .slice(0, items.length || 5);
      const literacyPoints = topDocs.map(d => Math.round((d.total || 0) * 10) / 10);

      const xAxis = items.map((_, i) => i + 1);
      const xAxisLit = topDocs.map((_, i) => i + 1);

      res.json({
        chartType: "scatter",
        xs: {
          "Tasa Fertilidad (SOS12)": "x_fert",
          "Tasa Alfabetización (DB)": "x_lit"
        },
        columns: [
          ["x_fert",                    ...xAxis],
          ["Tasa Fertilidad (SOS12)",   ...fertilityPoints],
          ["x_lit",                     ...xAxisLit],
          ["Tasa Alfabetización (DB)",  ...literacyPoints]
        ]
      });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
}
