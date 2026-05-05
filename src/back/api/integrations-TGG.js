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

  // -------- NewsAPI -> polar/spider ----------------------------------------
  app.get(BASE_URL_INTEGRATIONS_TGG + "/newsapi-education", async (req, res) => {
    try {
      const ext = await fetch(
        `https://newsapi.org/v2/everything?q=literacy+education&pageSize=20&apiKey=${process.env.NEWSAPI_KEY}`
      ).then(r => r.json());

      const articlesCount = (ext.articles || []).length;
      const docs = await findAll();
      const avg = (k) => docs.reduce((a, b) => a + (b[k] || 0), 0) / Math.max(1, docs.length);

      const categories = [
        "Alfabetización media (%)",
        "Masculina (%)",
        "Femenina (%)",
        "Sin brecha (est. %)",
        "Cobertura noticias"
      ];
      const values = [
        Math.round(avg("total") * 10) / 10,
        Math.round(avg("male") * 10) / 10,
        Math.round(avg("female") * 10) / 10,
        Math.round((100 - avg("gender_gap")) * 10) / 10,
        Math.min(articlesCount, 100)
      ];

      res.json({
        chartType: "polar",
        articlesCount,
        categories,
        series: [{ name: "Indicadores educativos", data: values }]
      });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
  // Mapeo ISO 3166-1 alpha-2 → nombre de país usado en la DB
  const ISO_TO_COUNTRY = {
    AF:"Afghanistan",AL:"Albania",DZ:"Algeria",AO:"Angola",AG:"Antigua and Barbuda",
    AR:"Argentina",AM:"Armenia",AZ:"Azerbaijan",BH:"Bahrain",BD:"Bangladesh",
    BB:"Barbados",BY:"Belarus",BJ:"Benin",BT:"Bhutan",BO:"Bolivia",
    BA:"Bosnia and Herzegovina",BW:"Botswana",BR:"Brazil",BN:"Brunei",BG:"Bulgaria",
    BF:"Burkina Faso",BI:"Burundi",KH:"Cambodia",CM:"Cameroon",CV:"Cape Verde",
    CF:"Central African Republic",TD:"Chad",CL:"Chile",CN:"China",CO:"Colombia",
    KM:"Comoros",CG:"Congo",CD:"DR Congo",CR:"Costa Rica",CI:"Ivory Coast",
    HR:"Croatia",CU:"Cuba",CY:"Cyprus",CZ:"Czech Republic",DO:"Dominican Republic",
    EC:"Ecuador",EG:"Egypt",SV:"El Salvador",GQ:"Equatorial Guinea",ER:"Eritrea",
    EE:"Estonia",ET:"Ethiopia",FJ:"Fiji",GA:"Gabon",GM:"Gambia",GE:"Georgia",
    GH:"Ghana",GR:"Greece",GD:"Grenada",GT:"Guatemala",GN:"Guinea",GW:"Guinea-Bissau",
    GY:"Guyana",HT:"Haiti",HN:"Honduras",HU:"Hungary",IN:"India",ID:"Indonesia",
    IR:"Iran",IQ:"Iraq",IL:"Israel",IT:"Italy",JM:"Jamaica",JO:"Jordan",
    KZ:"Kazakhstan",KE:"Kenya",KP:"North Korea",KW:"Kuwait",KG:"Kyrgyzstan",
    LA:"Laos",LV:"Latvia",LB:"Lebanon",LS:"Lesotho",LR:"Liberia",LY:"Libya",
    LT:"Lithuania",MG:"Madagascar",MW:"Malawi",MY:"Malaysia",MV:"Maldives",
    ML:"Mali",MT:"Malta",MH:"Marshall Islands",MR:"Mauritania",MU:"Mauritius",
    MX:"Mexico",MD:"Moldova",MN:"Mongolia",ME:"Montenegro",MA:"Morocco",
    MZ:"Mozambique",MM:"Myanmar",NA:"Namibia",NP:"Nepal",NI:"Nicaragua",
    NE:"Niger",NG:"Nigeria",MK:"North Macedonia",OM:"Oman",PK:"Pakistan",
    PW:"Palau",PA:"Panama",PG:"Papua New Guinea",PY:"Paraguay",PE:"Peru",
    PH:"Philippines",PL:"Poland",PT:"Portugal",PS:"Palestine",QA:"Qatar",
    RO:"Romania",RU:"Russia",RW:"Rwanda",WS:"Samoa",SM:"San Marino",
    ST:"Sao Tome and Principe",SA:"Saudi Arabia",SN:"Senegal",RS:"Serbia",
    SC:"Seychelles",SL:"Sierra Leone",SG:"Singapore",SI:"Slovenia",ZA:"South Africa",
    SS:"South Sudan",ES:"Spain",LK:"Sri Lanka",SD:"Sudan",SR:"Suriname",
    SZ:"Eswatini",SY:"Syria",TW:"Taiwan",TJ:"Tajikistan",TZ:"Tanzania",
    TH:"Thailand",TL:"Timor-Leste",TG:"Togo",TO:"Tonga",TT:"Trinidad and Tobago",
    TN:"Tunisia",TR:"Turkey",TM:"Turkmenistan",UG:"Uganda",UA:"Ukraine",
    AE:"United Arab Emirates",UY:"Uruguay",UZ:"Uzbekistan",VU:"Vanuatu",
    VE:"Venezuela",VN:"Vietnam",YE:"Yemen",ZM:"Zambia",ZW:"Zimbabwe"
  };

  app.get(BASE_URL_INTEGRATIONS_TGG + "/spotify-literacy", async (req, res) => {
  try {
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
    const searchUrl = new URL("https://api.spotify.com/v1/search");
    searchUrl.searchParams.set("q", "literacy education");
    searchUrl.searchParams.set("type", "track");
    searchUrl.searchParams.set("limit", "10");
    const ext = await fetch(searchUrl.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` }
    }).then(r => r.json());

    const tracks = (ext.tracks?.items || []).slice(0, 10);
    const categories = tracks.map(t => {
      const n = t.name || "";
      return n.length > 28 ? n.substring(0, 25) + "…" : n;
    });
    const duration = tracks.map(t => Math.round((t.duration_ms || 0) / 1000));
    const artists  = tracks.map(t => t.artists?.[0]?.name || "");

    res.json({
      chartType: "bar",
      categories,
      artists,
      series: [{ name: "Duración (seg)", data: duration, color: "#1DB954" }]
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
  });

  app.get(BASE_URL_INTEGRATIONS_TGG + "/github-literacy", async (req, res) => {
  try {
    const ext = await fetch(
      "https://api.github.com/search/repositories?q=education+literacy&per_page=30",
      { headers: { "User-Agent": "SOS2526-11" } }
    ).then(r => r.json());

    const totalRepos = ext.total_count || 0;
    const repos = ext.items || [];
    const docs = await findAll();

    // Detectar países de la DB mencionados en descripciones o topics de repos
    const mentioned = new Set();
    for (const repo of repos) {
      const text = `${repo.description || ""} ${(repo.topics || []).join(" ")}`.toLowerCase();
      for (const doc of docs) {
        const cn = doc.country.toLowerCase();
        // match si el nombre completo aparece en el texto
        if (cn.length >= 4 && text.includes(cn)) mentioned.add(doc.country);
      }
    }

    // Dos series: datos directos de GitHub (mencionados) y proxy (resto de la DB)
    const direct = docs.filter(d =>  mentioned.has(d.country));
    const proxy  = docs.filter(d => !mentioned.has(d.country));

    const toPoint = d => ({
      x: Math.round((d.gender_gap || 0) * 10) / 10,
      y: Math.round((d.total      || 0) * 10) / 10,
      name: d.country
    });

    const series = [
      { name: "Mencionados en repos", color: "#98c379", data: direct.map(toPoint) },
      { name: "DB (proxy)",           color: "#61afef55",
        marker: { fillColor: "#61afef33", lineColor: "#61afef", lineWidth: 1 },
        data: proxy.map(d => ({ ...toPoint(d), name: `${d.country} (proxy)` })) }
    ];

    res.json({ chartType: "scatter", totalRepos, matchedCountries: [...mentioned], series });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

  // Matching flexible por nombre de país entre APIs externas y la DB
  const matchByCountry = (docs, name) => {
    if (!name) return null;
    const n = name.toLowerCase().trim();
    return docs.find(d => {
      const dc = (d.country || "").toLowerCase().trim();
      return dc === n || n.includes(dc) || dc.includes(n);
    }) || null;
  };

  // -------- SOS2526-14 Active Satellites -> C3.js grouped bar ----------------------------------------
  // Por país: alfabetización total (DB propia) + nº de satélites activos (API externa)
  app.get(BASE_URL_INTEGRATIONS_TGG + "/sos14-satellites", async (req, res) => {
    try {
      await fetch("https://sos2526-14-yjus.onrender.com/api/v1/active-satellites/loadInitialData")
        .catch(() => {});

      const ext = await fetch("https://sos2526-14-yjus.onrender.com/api/v1/active-satellites")
        .then(r => r.json());

      const docs = await findAll();
      const items = Array.isArray(ext) ? ext : (Array.isArray(ext.data) ? ext.data : []);

      // Agrupar satélites por país coincidente
      const byCountry = {};
      for (const item of items) {
        const match = matchByCountry(docs, item.country);
        if (!match) continue;
        const key = match.country;
        if (!byCountry[key]) byCountry[key] = { literacy: Math.round(match.total * 10) / 10, count: 0 };
        byCountry[key].count += 1;
      }

      const entries = Object.entries(byCountry).slice(0, 12);
      const columns  = entries.map(([c, v]) => [c, v.literacy]);
      const satellites = Object.fromEntries(entries.map(([c, v]) => [c, v.count]));

      res.json({
        chartType: "donut",
        totalSatellites: items.length,
        columns: columns.length > 0 ? columns : [["Sin coincidencias", 100]],
        satellites
      });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // -------- SOS2526-20 Coffee Stats -> C3.js bar ----------------------------------------
  // Países que producen café Y tienen datos de literacy. Barras: alfabetización vs producción.
  app.get(BASE_URL_INTEGRATIONS_TGG + "/sos20-coffee", async (req, res) => {
    try {
      await fetch("https://sos2526-20-stable.onrender.com/api/v2/coffee-stats/loadInitialData")
        .catch(() => {});

      const ext = await fetch("https://sos2526-20-stable.onrender.com/api/v2/coffee-stats")
        .then(r => r.json());

      const docs = await findAll();
      const coffeeItems = (Array.isArray(ext.data) ? ext.data : (Array.isArray(ext) ? ext : [])).slice(0, 15);

      const categories = [];
      const literacyVals = [];
      const coffeeVals   = [];

      for (const item of coffeeItems) {
        const match = matchByCountry(docs, item.country);
        if (!match) continue;
        if (categories.includes(match.country)) continue;
        categories.push(match.country);
        literacyVals.push(Math.round(match.total * 10) / 10);
        coffeeVals.push(item.production || 0);
      }

      const maxCoffee = Math.max(...coffeeVals, 1);
      const coffeeNorm = coffeeVals.map(v => Math.round((v / maxCoffee) * 100 * 10) / 10);

      res.json({
        chartType: "bar",
        categories,
        columns: [
          ["Alfabetización (%)", ...literacyVals],
          ["Producción café (norm. 0-100)", ...coffeeNorm]
        ]
      });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // -------- soporte-sos Cholera Stats -> C3.js grouped bar ----------------------------------------
  // Por país: alfabetización total (DB propia) + casos de cólera (API externa)
  app.get(BASE_URL_INTEGRATIONS_TGG + "/cholera-stats", async (req, res) => {
    try {
      await fetch("https://soporte-sos.onrender.com/api/v1/cholera-stats/loadInitialData")
        .catch(() => {});

      const ext = await fetch("https://soporte-sos.onrender.com/api/v1/cholera-stats")
        .then(r => r.json());

      const docs = await findAll();
      const items = Array.isArray(ext) ? ext : (Array.isArray(ext.data) ? ext.data : []);

      // Agrupar por país: sumar casos, tomar literacy
      const byCountry = {};
      for (const item of items) {
        const match = matchByCountry(docs, item.country);
        if (!match) continue;
        const key = match.country;
        if (!byCountry[key]) byCountry[key] = { literacy: Math.round(match.total * 10) / 10, cases: 0 };
        byCountry[key].cases += item.cases || item.deaths || item.reported_cases || 1;
      }

      const entries = Object.entries(byCountry).slice(0, 12);
      const columns  = entries.map(([c, v]) => [c, v.literacy]);
      const casesMap = Object.fromEntries(entries.map(([c, v]) => [c, v.cases]));

      res.json({
        chartType: "pie",
        totalItems: items.length,
        columns: columns.length > 0 ? columns : [["Sin coincidencias", 100]],
        casesMap
      });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // -------- SOS2526-12 Age-Specific Fertility Rates -> C3.js scatter ----------------------------------------
  // Scatter por país: eje X = tasa de fertilidad (20-24), eje Y = tasa de alfabetización.
  app.get(BASE_URL_INTEGRATIONS_TGG + "/sos12-fertility", async (req, res) => {
    try {
      await fetch("https://sos2526-12.onrender.com/api/v2/age-specific-fertility-rates/loadInitialData")
        .catch(() => {});

      const ext = await fetch("https://sos2526-12.onrender.com/api/v2/age-specific-fertility-rates")
        .then(r => r.json());

      const docs = await findAll();
      const items = (Array.isArray(ext) ? ext : (Array.isArray(ext.data) ? ext.data : [])).slice(0, 20);

      const xs = {};
      const columns = [];
      const seen = new Set();

      for (const item of items) {
        const match = matchByCountry(docs, item.country_name);
        if (!match || seen.has(match.country)) continue;
        seen.add(match.country);
        const fert = Math.round((item.fert_20_24 || item.fert_15_19 || 0) * 10) / 10;
        const xKey = `x_${match.country}`;
        xs[match.country] = xKey;
        columns.push([xKey, fert]);
        columns.push([match.country, Math.round(match.total * 10) / 10]);
      }

      res.json({
        chartType: "scatter",
        xs: Object.keys(xs).length > 0 ? xs : { "Sin datos comunes": "x_none" },
        columns: columns.length > 0 ? columns : [["x_none", 0], ["Sin datos comunes", 0]]
      });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
}
