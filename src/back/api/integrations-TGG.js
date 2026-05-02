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
}
