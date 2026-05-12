// =====================================================================
// integrations-TGG.js  (Tomás Gutiérrez García)
// 1 widget sobre literacy-rates:
//   - NewsAPI -> funnel
// =====================================================================

import { dbLiteracy as db } from "./db.js";

export const BASE_URL_INTEGRATIONS_TGG = "/api/integrations/tgg";

// Nombre de país (DB) → ISO 3166-1 alpha-2 (para llamadas a Spotify search por market)
const COUNTRY_TO_ISO = {
  "Afghanistan":"AF","Albania":"AL","Algeria":"DZ","Angola":"AO","Antigua and Barbuda":"AG",
  "Argentina":"AR","Armenia":"AM","Azerbaijan":"AZ","Bahrain":"BH","Bangladesh":"BD",
  "Barbados":"BB","Belarus":"BY","Benin":"BJ","Bhutan":"BT","Bolivia":"BO",
  "Bosnia and Herzegovina":"BA","Botswana":"BW","Brazil":"BR","Brunei":"BN","Bulgaria":"BG",
  "Burkina Faso":"BF","Burundi":"BI","Cambodia":"KH","Cameroon":"CM","Cape Verde":"CV",
  "Central African Republic":"CF","Chad":"TD","Chile":"CL","China":"CN","Colombia":"CO",
  "Comoros":"KM","Congo":"CG","DR Congo":"CD","Costa Rica":"CR","Ivory Coast":"CI",
  "Croatia":"HR","Cuba":"CU","Cyprus":"CY","Czech Republic":"CZ","Dominican Republic":"DO",
  "Ecuador":"EC","Egypt":"EG","El Salvador":"SV","Equatorial Guinea":"GQ","Eritrea":"ER",
  "Estonia":"EE","Ethiopia":"ET","Fiji":"FJ","Gabon":"GA","Gambia":"GM","Georgia":"GE",
  "Ghana":"GH","Greece":"GR","Grenada":"GD","Guatemala":"GT","Guinea":"GN","Guinea-Bissau":"GW",
  "Guyana":"GY","Haiti":"HT","Honduras":"HN","Hungary":"HU","India":"IN","Indonesia":"ID",
  "Iran":"IR","Iraq":"IQ","Israel":"IL","Italy":"IT","Jamaica":"JM","Jordan":"JO",
  "Kazakhstan":"KZ","Kenya":"KE","North Korea":"KP","Kuwait":"KW","Kyrgyzstan":"KG",
  "Laos":"LA","Latvia":"LV","Lebanon":"LB","Lesotho":"LS","Liberia":"LR","Libya":"LY",
  "Lithuania":"LT","Madagascar":"MG","Malawi":"MW","Malaysia":"MY","Maldives":"MV",
  "Mali":"ML","Malta":"MT","Marshall Islands":"MH","Mauritania":"MR","Mauritius":"MU",
  "Mexico":"MX","Moldova":"MD","Mongolia":"MN","Montenegro":"ME","Morocco":"MA",
  "Mozambique":"MZ","Myanmar":"MM","Namibia":"NA","Nepal":"NP","Nicaragua":"NI",
  "Niger":"NE","Nigeria":"NG","North Macedonia":"MK","Oman":"OM","Pakistan":"PK",
  "Palau":"PW","Panama":"PA","Papua New Guinea":"PG","Paraguay":"PY","Peru":"PE",
  "Philippines":"PH","Poland":"PL","Portugal":"PT","Palestine":"PS","Qatar":"QA",
  "Romania":"RO","Russia":"RU","Rwanda":"RW","Samoa":"WS","San Marino":"SM",
  "Sao Tome and Principe":"ST","Saudi Arabia":"SA","Senegal":"SN","Serbia":"RS",
  "Seychelles":"SC","Sierra Leone":"SL","Singapore":"SG","Slovenia":"SI","South Africa":"ZA",
  "South Sudan":"SS","Spain":"ES","Sri Lanka":"LK","Sudan":"SD","Suriname":"SR",
  "Eswatini":"SZ","Syria":"SY","Taiwan":"TW","Tajikistan":"TJ","Tanzania":"TZ",
  "Thailand":"TH","Timor-Leste":"TL","Togo":"TG","Tonga":"TO","Trinidad and Tobago":"TT",
  "Tunisia":"TN","Turkey":"TR","Turkmenistan":"TM","Uganda":"UG","Ukraine":"UA",
  "United Arab Emirates":"AE","Uruguay":"UY","Uzbekistan":"UZ","Vanuatu":"VU",
  "Venezuela":"VE","Vietnam":"VN","Yemen":"YE","Zambia":"ZM","Zimbabwe":"ZW"
};

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
        articlesCount,
        categories,
        series: [{ name: "Indicadores educativos", data: values }]
      });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // -------- Google OAuth2 setup (one-time) ----------------------------------------
  // Visita /api/integrations/tgg/google-setup en el navegador para obtener el refresh_token
  let googleRefreshToken = process.env.GOOGLE_REFRESH_TOKEN || null;

  app.get(BASE_URL_INTEGRATIONS_TGG + "/google-setup", (req, res) => {
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id",     process.env.GOOGLE_CLIENT_ID);
    url.searchParams.set("redirect_uri",  "http://localhost:8080/api/integrations/tgg/google-callback");
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope",         "https://www.googleapis.com/auth/books");
    url.searchParams.set("access_type",   "offline");
    url.searchParams.set("prompt",        "consent");
    res.redirect(url.toString());
  });

  app.get(BASE_URL_INTEGRATIONS_TGG + "/google-callback", async (req, res) => {
    const code = req.query.code;
    if (!code) {
      return res.status(400).send(
        `<pre>No se recibió código.\nParámetros recibidos:\n${JSON.stringify(req.query, null, 2)}</pre>`
      );
    }
    try {
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id:     process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri:  "http://localhost:8080/api/integrations/tgg/google-callback",
          grant_type:    "authorization_code"
        })
      }).then(r => r.json());

      if (!tokenRes.refresh_token) {
        return res.status(502).send(`No se obtuvo refresh_token: ${JSON.stringify(tokenRes)}`);
      }
      googleRefreshToken = tokenRes.refresh_token;
      console.log("✅ GOOGLE_REFRESH_TOKEN:", googleRefreshToken);
      res.send(`<h2>✅ Autorización completada</h2><p>Refresh token guardado en memoria. Añádelo al .env:</p><pre>GOOGLE_REFRESH_TOKEN=${googleRefreshToken}</pre>`);
    } catch (e) {
      res.status(500).send("Error: " + e.message);
    }
  });

  // Google Books API (OAuth2 refresh_token) → libros de educación por idioma
  // Compara: total de libros (norm. 0-100) vs alfabetización media de países que hablan ese idioma
  app.get(BASE_URL_INTEGRATIONS_TGG + "/books-literacy", async (req, res) => {
  try {
    // OAuth2: intercambiar refresh_token por access_token
    if (!googleRefreshToken) {
      return res.status(503).json({ error: "Visita /api/integrations/tgg/google-setup para autorizar Google Books." });
    }

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id:     process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: googleRefreshToken,
        grant_type:    "refresh_token"
      })
    }).then(r => r.json());

    const accessToken = tokenRes.access_token;
    if (!accessToken) {
      return res.status(502).json({ error: "Google OAuth2 falló", detail: tokenRes });
    }

    // Idiomas y países representativos de la DB
    const LANG_COUNTRIES = {
      "ar": ["Egypt","Algeria","Morocco","Sudan","Yemen","Iraq","Jordan","Tunisia","Libya"],
      "es": ["Bolivia","Ecuador","Peru","Guatemala","Honduras","Nicaragua","El Salvador","Paraguay","Cuba"],
      "fr": ["Senegal","Mali","Burkina Faso","Niger","Chad","Madagascar","Cameroon","Benin","Togo"],
      "en": ["Nigeria","Kenya","Uganda","Tanzania","Ghana","Zambia","Zimbabwe","Malawi","Sierra Leone"],
      "pt": ["Mozambique","Angola"],
      "hi": ["India"],
      "sw": ["Tanzania","Kenya","Uganda"],
      "zh": ["China"],
      "ru": ["Russia","Kazakhstan","Kyrgyzstan","Tajikistan","Uzbekistan","Turkmenistan"]
    };
    const LANG_LABELS = { ar:"Árabe", es:"Español", fr:"Francés", en:"Inglés", pt:"Portugués", hi:"Hindi", sw:"Swahili", zh:"Chino", ru:"Ruso" };

    const docs = await findAll();

    // Llamadas paralelas a Google Books por idioma
    const results = await Promise.all(Object.entries(LANG_COUNTRIES).map(async ([lang, countries]) => {
      try {
        const r = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=education+literacy&langRestrict=${lang}&maxResults=1`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        ).then(r => r.json());

        const totalBooks = r.totalItems || 0;

        // Alfabetización media de los países de la DB que hablan este idioma
        const matches = docs.filter(d => countries.includes(d.country) && d.total);
        if (!matches.length) return null;
        const avgLiteracy = Math.round(matches.reduce((s, d) => s + d.total, 0) / matches.length * 10) / 10;

        return { lang, label: LANG_LABELS[lang], totalBooks, avgLiteracy };
      } catch { return null; }
    }));

    const data = results.filter(Boolean).sort((a, b) => a.avgLiteracy - b.avgLiteracy);

    // Normalizar totalBooks a escala 0-100 para comparar con literacy
    const maxBooks = Math.max(...data.map(d => d.totalBooks), 1);
    data.forEach(d => { d.booksNorm = Math.round((d.totalBooks / maxBooks) * 100); });

    res.json({ data });
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

    res.json({ totalRepos, matchedCountries: [...mentioned], series });
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
        xs: Object.keys(xs).length > 0 ? xs : { "Sin datos comunes": "x_none" },
        columns: columns.length > 0 ? columns : [["x_none", 0], ["Sin datos comunes", 0]]
      });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
}
