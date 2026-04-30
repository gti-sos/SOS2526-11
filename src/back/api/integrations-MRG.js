// =====================================================================
// integrations-MRG.js  (Miguel Ridao)
// 3 widgets sobre alcohol-consumptions-per-capita con APIs externas
// autenticadas por API key (sin OAuth / sin refresh token):
//   - Nutritionix          -> bubble
//   - USDA FoodData Central -> treemap
//   - API-Ninjas Nutrition  -> packedbubble
// Combina los datos externos con la DB propia alcohol-consumptions-per-capita-v2.db.
// =====================================================================

import Datastore from "nedb";

export const BASE_URL_INTEGRATIONS_MRG = "/api/integrations/mrg";

export function loadBackendIntegrationsMRG(app) {
  const db = new Datastore({ filename: "./data/alcohol-consumptions-per-capita-v2.db", autoload: true });

  const findAll = () => new Promise((res, rej) =>
    db.find({}, (err, docs) => (err ? rej(err) : res(docs)))
  );

  // -------- 1. Nutritionix -> bubble ------------------------------------
  app.get(BASE_URL_INTEGRATIONS_MRG + "/nutritionix-activity", async (req, res) => {
    try {
      const ext = await fetch("https://trackapi.nutritionix.com/v2/natural/nutrients", {
        method: "POST",
        headers: {
          "x-app-id": process.env.NUTRITIONIX_APP_ID,
          "x-app-key": process.env.NUTRITIONIX_APP_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: "1 glass of red wine" }),
      }).then(r => r.json());

      const calsPerDrink = ext.foods?.[0]?.nf_calories || 125;

      // Bubble: x=consumo alcohol, y=esperanza de vida proxy, z=cal por bebida
      const docs = await findAll();
      const data = docs.map(d => ({
        x: d.alcohol_consumption ?? d.consumption ?? 0,
        y: 80 - (d.alcohol_consumption ?? 0) * 0.5,
        z: Math.max(1, calsPerDrink / 10),
        name: d.country,
      }));

      res.json({ chartType: "bubble", series: [{ name: "Alcohol vs salud", data }] });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // -------- 2. USDA FoodData Central -> treemap -------------------------
  app.get(BASE_URL_INTEGRATIONS_MRG + "/usda-health", async (req, res) => {
    try {
      const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=beer&pageSize=1&api_key=${process.env.USDA_API_KEY}`;
      const ext = await fetch(url).then(r => r.json());

      const measureCount = ext.foods?.[0]?.foodNutrients?.length || 1;

      // Treemap: jerarquía año -> país, valor = consumo*nutrientesUSDA
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

  // -------- 3. API-Ninjas Nutrition -> packedbubble ---------------------
  app.get(BASE_URL_INTEGRATIONS_MRG + "/apininjas-nutrition", async (req, res) => {
    try {
      const ext = await fetch("https://api.api-ninjas.com/v1/nutrition?query=beer", {
        headers: { "X-Api-Key": process.env.API_NINJAS_KEY },
      }).then(r => r.json());

      const calPerBeer = Array.isArray(ext) ? (ext[0]?.calories || 0) : 0;

      // Packedbubble agrupado por país, valor = consumo + (cal/100)
      const docs = await findAll();
      const byCountry = {};
      docs.forEach(d => {
        if (!byCountry[d.country]) byCountry[d.country] = [];
        byCountry[d.country].push({
          name: `${d.country} ${d.year}`,
          value: (d.alcohol_consumption ?? 0) + calPerBeer / 100,
        });
      });
      const series = Object.entries(byCountry).map(([name, data]) => ({ name, data }));

      res.json({ chartType: "packedbubble", series });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
}
