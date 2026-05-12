// =====================================================================
// integrations-MRG.js  (Miguel Ridao)
// 3 widgets sobre alcohol-consumptions-per-capita con OAuth2 real (client_credentials):
//   - Vimeo    -> bubble
//   - Twitch   -> treemap
//   - Discord  -> packedbubble
// Combina los datos externos con la DB propia alcohol-consumptions-per-capita-v2.db.
// =====================================================================

import { dbAlcohol as db } from "./db.js";

export const BASE_URL_INTEGRATIONS_MRG = "/api/integrations/mrg";

const tokenCache = new Map();

function fetchT(url, opts = {}, ms = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(t));
}

// Para APIs SOS de compañeros: si devuelven array vacío (BD reseteada tras deploy),
// disparamos su /loadInitialData y reintentamos. Así las gráficas no quedan vacías
// cuando otro grupo despliega y se le borra el almacenamiento efímero de Render.
async function fetchSosJsonAutoload(sourceUrl, ms = 60000) {
  const r1 = await fetchT(sourceUrl, { headers: { Accept: "application/json" } }, ms);
  if (!r1.ok) throw new Error(`HTTP ${r1.status} en ${sourceUrl}`);
  const data1 = await r1.json();
  if (Array.isArray(data1) && data1.length > 0) return data1;

  // BD del compañero vacía: intentamos cargar sus datos iniciales.
  try {
    await fetchT(sourceUrl.replace(/\/$/, "") + "/loadInitialData", { headers: { Accept: "application/json" } }, ms);
  } catch (e) { console.warn(`loadInitialData fallback en ${sourceUrl}:`, e.message); }

  const r2 = await fetchT(sourceUrl, { headers: { Accept: "application/json" } }, ms);
  if (!r2.ok) throw new Error(`HTTP ${r2.status} (reintento) en ${sourceUrl}`);
  return await r2.json();
}

async function getToken(key, fetcher) {
  const now = Date.now();
  const c = tokenCache.get(key);
  if (c && c.expiresAt > now + 30_000) return c.token;
  const { token, expiresIn } = await fetcher();
  tokenCache.set(key, { token, expiresAt: now + expiresIn * 1000 });
  return token;
}

async function vimeoToken() {
  const creds = Buffer.from(`${process.env.VIMEO_CLIENT_ID}:${process.env.VIMEO_CLIENT_SECRET}`).toString("base64");
  const r = await fetchT("https://api.vimeo.com/oauth/authorize/client", {
    method: "POST",
    headers: {
      Authorization: `Basic ${creds}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.vimeo.*+json;version=3.4",
    },
    body: JSON.stringify({ grant_type: "client_credentials", scope: "public" }),
  });
  if (!r.ok) throw new Error(`Vimeo OAuth -> ${r.status}`);
  const j = await r.json();
  return { token: j.access_token, expiresIn: j.expires_in || 3600 };
}

async function twitchToken() {
  const r = await fetchT("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.TWITCH_CLIENT_ID,
      client_secret: process.env.TWITCH_CLIENT_SECRET,
      grant_type: "client_credentials",
    }),
  });
  if (!r.ok) throw new Error(`Twitch OAuth -> ${r.status}`);
  const j = await r.json();
  return { token: j.access_token, expiresIn: j.expires_in || 3600 };
}

async function discordToken() {
  const r = await fetchT("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type: "client_credentials",
      scope: "identify",
    }),
  });
  if (!r.ok) throw new Error(`Discord OAuth -> ${r.status}`);
  const j = await r.json();
  return { token: j.access_token, expiresIn: j.expires_in || 604800 };
}

export function loadBackendIntegrationsMRG(app) {
  const findAll = () => new Promise((res, rej) =>
    db.find({}, (err, docs) => (err ? rej(err) : res(docs)))
  );

  // -------- 1. Vimeo -> bubble ------------------------------------------
  app.get(BASE_URL_INTEGRATIONS_MRG + "/vimeo-alcohol", async (req, res) => {
    try {
      let factor = 8;
      try {
        const token = await getToken("mrg_vimeo", vimeoToken);
        const ext = await fetchT(
          "https://api.vimeo.com/videos?query=alcohol+consumption&per_page=10",
          { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.vimeo.*+json;version=3.4" } }
        ).then(r => r.json());
        factor = Math.min(ext.total || 8, 50);
      } catch (e) { console.warn("Vimeo fallback:", e.message); }

      const docs = await findAll();
      const data = docs.map(d => ({
        x: d.alcohol_litre ?? 0,
        y: 80 - (d.alcohol_litre ?? 0) * 0.5,
        z: Math.max(1, factor / 5),
        name: d.nation,
      }));

      res.json({ chartType: "bubble", series: [{ name: "Alcohol vs salud", data }] });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // -------- 2. Twitch -> treemap -----------------------------------
  // Relación real: broadcaster_language de cada canal → países en alcohol DB
  // Los países cuyo idioma está representado en Twitch reciben un bonus proporcional
  // al nº de canales que lo hablan, haciendo su tile más grande en el treemap.
  app.get(BASE_URL_INTEGRATIONS_MRG + "/twitch-alcohol", async (req, res) => {
    try {
      let channels = [];
      try {
        const token = await getToken("mrg_twitch", twitchToken);
        const ext = await fetchT(
          "https://api.twitch.tv/helix/search/channels?query=alcohol&first=20",
          { headers: { Authorization: `Bearer ${token}`, "Client-Id": process.env.TWITCH_CLIENT_ID } }
        ).then(r => r.json());
        channels = ext.data || [];
      } catch (e) { console.warn("Twitch fallback:", e.message); }

      // Idioma Twitch → países en la DB de alcohol (nombres en inglés)
      const LANG_NATIONS = {
        en: ["United Kingdom", "Australia", "Ireland", "New Zealand"],
        es: ["Spain", "Argentina", "Colombia", "Chile"],
        de: ["Germany", "Austria"],
        fr: ["France", "Belgium"],
        pt: ["Brazil", "Portugal"],
        ru: ["Russia"],
        pl: ["Poland"],
        nl: ["Netherlands"],
        zh: ["China"],
        ja: ["Japan"],
        ko: ["South Korea"],
        it: ["Italy"],
        cs: ["Czech Republic"],
        sv: ["Sweden"],
        da: ["Denmark"],
        fi: ["Finland"],
        no: ["Norway"],
        hu: ["Hungary"],
        ro: ["Romania"],
        bg: ["Bulgaria"],
        tr: ["Turkey"],
        uk: ["Ukraine"],
        hr: ["Croatia"],
      };

      // Peso por nación: cuántos canales Twitch hablan su idioma
      const nationBonus = {};
      channels.forEach(ch => {
        const lang = (ch.broadcaster_language || "").toLowerCase();
        (LANG_NATIONS[lang] || []).forEach(n => {
          nationBonus[n.toLowerCase()] = (nationBonus[n.toLowerCase()] || 0) + 1;
        });
      });

      const docs = await findAll();
      const byYear = {};
      docs.forEach(d => {
        const y = String(d.date_year);
        if (!byYear[y]) byYear[y] = [];
        const nKey = (d.nation || "").toLowerCase();
        const bonus = nationBonus[nKey] || 0;
        byYear[y].push({
          name: `${d.nation} ${y}`,
          parent: y,
          // El bonus amplifica el tile: +25% por cada canal Twitch en su idioma
          value: Math.round(Number(d.alcohol_litre ?? 0) * (1 + bonus * 0.25) * 10) / 10,
          twitchBonus: bonus,
        });
      });

      const data = [];
      Object.keys(byYear).sort().forEach(y => {
        data.push({ id: y, name: y });
        data.push(...byYear[y]);
      });

      const channelNames = channels.map(ch => ({
        name: ch.display_name,
        lang: ch.broadcaster_language,
        live: ch.is_live,
      }));

      res.json({
        chartType: "treemap",
        data,
        twitchChannels: channels.length,
        channelNames,
      });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // -------- 3. Discord -> packedbubble ----------------------------------
  // Relación real: el Snowflake ID de Discord codifica el momento de creación de la app.
  // Decodificamos ese timestamp para obtener el año de referencia.
  // Calculamos la media global de consumo de alcohol en ese año y agrupamos los países
  // en dos clusters: los que estaban por encima o por debajo de esa media en el año de referencia.
  app.get(BASE_URL_INTEGRATIONS_MRG + "/discord-alcohol", async (req, res) => {
    try {
      const DISCORD_EPOCH = 1420070400000n; // 2015-01-01 UTC
      let refYear = 2016; // año de referencia por defecto (fallback)

      try {
        const token = await getToken("mrg_discord", discordToken);
        const ext = await fetchT("https://discord.com/api/oauth2/@me", {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json());

        const appId = ext.application?.id ?? ext.user?.id ?? null;
        if (appId) {
          // Decodificar Snowflake → timestamp → año de creación de la app
          const timestampMs = Number((BigInt(appId) >> 22n) + DISCORD_EPOCH);
          refYear = new Date(timestampMs).getFullYear();
        }
      } catch (e) { console.warn("Discord fallback:", e.message); }

      const docs = await findAll();

      // Media global de alcohol en el año de referencia
      const refDocs = docs.filter(d => d.date_year === refYear);
      const globalAvgRef = refDocs.length > 0
        ? Math.round((refDocs.reduce((s, d) => s + Number(d.alcohol_litre || 0), 0) / refDocs.length) * 100) / 100
        : 5.0;

      // Para cada país: consumo promedio y si estaba por encima/debajo de la media en refYear
      const byCountry = {};
      docs.forEach(d => {
        const c = d.nation;
        if (!byCountry[c]) byCountry[c] = { sum: 0, count: 0, refLitres: null };
        byCountry[c].sum += Number(d.alcohol_litre || 0);
        byCountry[c].count += 1;
        if (d.date_year === refYear) byCountry[c].refLitres = Number(d.alcohol_litre || 0);
      });

      const aboveAvg = [];
      const belowAvg = [];
      Object.entries(byCountry).forEach(([nation, info]) => {
        const avgLitres = Math.round((info.sum / Math.max(1, info.count)) * 10) / 10;
        const ref = info.refLitres ?? avgLitres;
        const point = { name: nation, value: avgLitres };
        if (ref >= globalAvgRef) aboveAvg.push(point);
        else belowAvg.push(point);
      });

      const series = [
        { name: `Sobre la media en ${refYear} (>${globalAvgRef} L)`, data: aboveAvg },
        { name: `Bajo la media en ${refYear} (<${globalAvgRef} L)`, data: belowAvg },
      ];

      res.json({ chartType: "packedbubble", series, refYear, globalAvgRef });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // =====================================================================
  // INTEGRACIONES SOS (proxies a APIs de otros alumnos SOS)
  // Cada endpoint hace fetch a la API SOS externa y combina los datos
  // con la base de datos propia de alcohol-consumptions-per-capita-v2.
  // =====================================================================

  // -------- 4. SOS2526-12 mid-population-ages -> ApexCharts donut -------
  // Comparte año/país con alcohol DB. El donut muestra la población total
  // por tramo de edad, ponderada por el consumo medio de alcohol del país.
  app.get(BASE_URL_INTEGRATIONS_MRG + "/sos12-mid-population-ages", async (req, res) => {
    const SOURCE_URL = "https://sos2526-12.onrender.com/api/v2/mid-population-ages";
    try {
      const [items, ownDocs] = await Promise.all([
        fetchSosJsonAutoload(SOURCE_URL),
        findAll(),
      ]);

      // Mapa nation->avg(alcohol_litre) de la DB propia para cruce por país
      const alcoholByNation = {};
      ownDocs.forEach(d => {
        const k = String(d.nation || "").toLowerCase().trim();
        if (!alcoholByNation[k]) alcoholByNation[k] = { sum: 0, count: 0 };
        alcoholByNation[k].sum += Number(d.alcohol_litre || 0);
        alcoholByNation[k].count += 1;
      });
      const alcoholAvg = (name) => {
        const k = String(name || "").toLowerCase().trim();
        const r = alcoholByNation[k];
        return r ? r.sum / r.count : 0;
      };

      // Suma por tramo de edad para los países que también aparecen en alcohol DB
      const buckets = {
        "0-24": 0,
        "25-49": 0,
        "50-74": 0,
        "75-99": 0,
        "100+": 0,
      };
      let matchedCountries = 0;
      const matchedSet = new Set();
      items.forEach(row => {
        const country = row.country_name;
        const factor = alcoholAvg(country);
        if (factor === 0) return;
        matchedSet.add(String(country).toLowerCase().trim());
        // Ponderamos cada tramo por el consumo medio de alcohol del país
        buckets["0-24"]   += Number(row.population_age_0   || 0) * (1 + factor / 20);
        buckets["25-49"]  += Number(row.population_age_25  || 0) * (1 + factor / 20);
        buckets["50-74"]  += Number(row.population_age_50  || 0) * (1 + factor / 20);
        buckets["75-99"]  += Number(row.population_age_75  || 0) * (1 + factor / 20);
        buckets["100+"]   += Number(row.population_age_100 || 0) * (1 + factor / 20);
      });
      matchedCountries = matchedSet.size;

      const labels = Object.keys(buckets);
      const series = Object.values(buckets).map(v => Math.round(v));

      res.json({
        api: "SOS2526-12 mid-population-ages",
        sourceUrl: SOURCE_URL,
        chartType: "donut",
        library: "ApexCharts",
        externalApiUsed: true,
        combinedWithOwnApi: true,
        ownApiFieldsUsed: ["nation", "alcohol_litre"],
        externalFieldsUsed: ["country_name", "population_age_0/25/50/75/100"],
        explanation: "Población mundial agrupada por tramos de edad (SOS2526-12), ponderada por el consumo medio de alcohol propio de cada país.",
        matchedCountries,
        labels,
        series,
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // -------- 5. soporte-sos religious-believes-stats -> ApexCharts radar
  // Cruce por país: ejes del radar = porcentajes religiosos del país (medias mundiales)
  // y se añade el consumo de alcohol como un eje extra para visualizar la combinación.
  app.get(BASE_URL_INTEGRATIONS_MRG + "/sos-religious-believes", async (req, res) => {
    const SOURCE_URL = "https://soporte-sos.onrender.com/api/v1/religious-believes-stats";
    try {
      const [items, ownDocs] = await Promise.all([
        fetchSosJsonAutoload(SOURCE_URL),
        findAll(),
      ]);

      const alcoholByNation = {};
      ownDocs.forEach(d => {
        const k = String(d.nation || "").toLowerCase().trim();
        if (!alcoholByNation[k]) alcoholByNation[k] = { sum: 0, count: 0 };
        alcoholByNation[k].sum += Number(d.alcohol_litre || 0);
        alcoholByNation[k].count += 1;
      });

      // Filtramos a entidades que también están en alcohol DB
      const matched = items.filter(r => {
        const k = String(r.entity || "").toLowerCase().trim();
        return alcoholByNation[k];
      });

      // Top 6 países por consumo de alcohol
      const top = matched
        .map(r => {
          const k = String(r.entity || "").toLowerCase().trim();
          const a = alcoholByNation[k];
          return { ...r, alcohol_avg: a.sum / a.count };
        })
        .sort((a, b) => b.alcohol_avg - a.alcohol_avg)
        .slice(0, 6);

      const categories = ["Christian", "Muslim", "Hindu", "Buddhist", "Jew", "No religion", "Alcohol×10"];
      const series = top.map(r => ({
        name: r.entity,
        // Multiplicamos alcohol×10 para que entre en la misma escala 0-100 del radar
        data: [
          parseFloat(r.christian) || 0,
          parseFloat(r.muslim) || 0,
          parseFloat(r.hindu) || 0,
          parseFloat(r.budhist) || 0,
          parseFloat(r.jew) || 0,
          parseFloat(r.no_religion) || 0,
          Math.min(100, r.alcohol_avg * 10),
        ],
      }));

      res.json({
        api: "soporte-sos religious-believes-stats",
        sourceUrl: SOURCE_URL,
        chartType: "radar",
        library: "ApexCharts",
        externalApiUsed: true,
        combinedWithOwnApi: true,
        ownApiFieldsUsed: ["nation", "alcohol_litre"],
        externalFieldsUsed: ["entity", "christian", "muslim", "hindu", "budhist", "jew", "no_religion"],
        explanation: "Top 6 países (por consumo medio de alcohol propio) con su distribución religiosa de soporte-sos. Cada eje es un porcentaje religioso, y se añade un eje 'Alcohol×10' para mostrar la integración con la API propia.",
        matchedCountries: top.length,
        categories,
        series,
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // -------- 6. space-launches -> ApexCharts polarArea -------------------
  // Cruce por país: nº de lanzamientos × consumo medio de alcohol del país.
  app.get(BASE_URL_INTEGRATIONS_MRG + "/sos-space-launches", async (req, res) => {
    const SOURCE_URL = "https://space-launches-8cix.onrender.com/api/v2/space-launches";
    try {
      const [items, ownDocs] = await Promise.all([
        fetchSosJsonAutoload(SOURCE_URL),
        findAll(),
      ]);

      const alcoholByNation = {};
      ownDocs.forEach(d => {
        const k = String(d.nation || "").toLowerCase().trim();
        if (!alcoholByNation[k]) alcoholByNation[k] = { sum: 0, count: 0 };
        alcoholByNation[k].sum += Number(d.alcohol_litre || 0);
        alcoholByNation[k].count += 1;
      });

      // Conteo de lanzamientos por país
      const launchesByCountry = {};
      items.forEach(row => {
        const c = String(row.country || "").trim();
        if (!c) return;
        launchesByCountry[c] = (launchesByCountry[c] || 0) + 1;
      });

      // Mantenemos solo países que también están en alcohol DB.
      // Si no hay coincidencias (porque la API space-launches usa nombres
      // como "USA"/"Russia" que pueden no coincidir), caemos a top por
      // lanzamientos sin filtrar.
      const matched = Object.entries(launchesByCountry)
        .map(([country, launches]) => {
          const k = country.toLowerCase().trim();
          const a = alcoholByNation[k];
          return {
            country,
            launches,
            alcohol_avg: a ? a.sum / a.count : 0,
            inOwnDb: !!a,
          };
        });

      const inDb = matched.filter(m => m.inOwnDb).sort((a, b) => b.launches - a.launches).slice(0, 8);
      const final = inDb.length > 0
        ? inDb
        : matched.sort((a, b) => b.launches - a.launches).slice(0, 8);

      // Métrica combinada para la polarArea: launches × (1 + alcohol_avg/10)
      const series = final.map(m => Math.round(m.launches * (1 + m.alcohol_avg / 10)));
      const labels = final.map(m => m.country);

      res.json({
        api: "space-launches",
        sourceUrl: SOURCE_URL,
        chartType: "polarArea",
        library: "ApexCharts",
        externalApiUsed: true,
        combinedWithOwnApi: inDb.length > 0,
        ownApiFieldsUsed: ["nation", "alcohol_litre"],
        externalFieldsUsed: ["country", "mission_id"],
        explanation: "Top países por número de lanzamientos espaciales, ponderados por el consumo medio de alcohol propio. Si no hay coincidencias por nombre de país, se muestran los top globales.",
        matchedCountries: inDb.length,
        labels,
        series,
        rawCounts: final.map(m => ({ country: m.country, launches: m.launches, alcoholAvg: Math.round(m.alcohol_avg * 100) / 100 })),
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
}
