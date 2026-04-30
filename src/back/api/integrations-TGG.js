// =====================================================================
// integrations-TGG.js  (Tomás Gutiérrez García)
// 1 widget sobre literacy-rates:
//   - NewsAPI -> funnel
// =====================================================================

import Datastore from "nedb";

export const BASE_URL_INTEGRATIONS_TGG = "/api/integrations/tgg";

export function loadBackendIntegrationsTGG(app) {
  const db = new Datastore({ filename: "./data/literacy-rates-v2.db", autoload: false });
  db.loadDatabase();

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
}
