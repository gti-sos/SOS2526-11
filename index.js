const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 8080;
let cool = require('cool-ascii-faces');
let BASE_URL_API = "/api/v1";
let BASE_URL_API_TGG =   BASE_URL_API + "/literacy-rates";

// Middleware para parsear JSON
app.use(express.json());

// Sirve archivos estáticos desde la carpeta 'public' (Para about.html) https://sos2526-11.onrender.com/about.html
// Ruta /about https://sos2526-11.onrender.com/about
app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/about.html'));
});
// Tarea de Grupo: Ruta /cool https://sos2526-11.onrender.com/cool
{
app.get('/cool', (req, res) => {
    res.send("<html><body><h1>" + cool() + "</h1></body></html>");
});
}

// Tarea Individual: Ruta /samples/MRG + API MRG
//Ruta /samples/MRG https://sos2526-11.onreder.com/samples/MRG
{
app.get('/samples/MRG', (req, res) => {
    const alcoholData = [
        { nation: "Albania", date_year: 2016, alcohol_litre: 7.5, recorded_consumption: 4.4, unrecorded_consumption: 0.7 },
        { nation: "Albania", date_year: 1996, alcohol_litre: 2.59, recorded_consumption: 4.4, unrecorded_consumption: 0.7 },
        { nation: "Albania", date_year: 2019, alcohol_litre: 5.1, recorded_consumption: 4.4, unrecorded_consumption: 0.7 },
        { nation: "Brazil", date_year: 2016, alcohol_litre: 7.8, recorded_consumption: 6.3, unrecorded_consumption: 1.4 },
        { nation: "Brazil", date_year: 2019, alcohol_litre: 7.7, recorded_consumption: 6.3, unrecorded_consumption: 1.4 },
        { nation: "Andorra", date_year: 2019, alcohol_litre: 11.3, recorded_consumption: 11.1, unrecorded_consumption: 0.4 },
        { nation: "Angola", date_year: 2016, alcohol_litre: 6.4, recorded_consumption: 5.3, unrecorded_consumption: 0.9 },
        { nation: "Argentina", date_year: 2019, alcohol_litre: 8, recorded_consumption: 7.6, unrecorded_consumption: 0.4 },
        { nation: "Armenia", date_year: 2016, alcohol_litre: 5.5, recorded_consumption: 4.1, unrecorded_consumption: 0.9 },
        { nation: "Austria", date_year: 2016, alcohol_litre: 11.6, recorded_consumption: 11.7, unrecorded_consumption: 0.4 },
        { nation: "Australia", date_year: 2016, alcohol_litre: 10.6, recorded_consumption: 9.5, unrecorded_consumption: 0.4 },
        { nation: "Denmark", date_year: 2016, alcohol_litre: 10.4, recorded_consumption: 9.2, unrecorded_consumption: 0.4 }
    ];

    const targetNation = "Albania";
    const filtered = alcoholData.filter(d => d.nation === targetNation);

    if (filtered.length > 0) {
        let totalAlcohol = 0;
        filtered.forEach(e => {
            totalAlcohol += e.alcohol_litre;
        });
        const average = totalAlcohol / filtered.length;
        console.log(`Media de 'alcohol_litre' en ${targetNation}: ${average.toFixed(2)}`);
        res.send(`<p>Media de 'alcohol_litre' en ${targetNation}: ${average.toFixed(2)} litros.</p>`);
    } else {
        res.send(`<p>No se encontraron datos para ${targetNation}</p>`);
    }
});
const BASE_URL_API_MRG = "/api/v1/alcohol-consumptions-per-capita";
let alcoholStats = []; 

app.use(express.json());

app.get(BASE_URL_API_MRG + "/loadInitialData", (req, res) => {
    if (alcoholStats.length > 0) {
        return res.status(400).json({ error: "Bad Request: Los datos ya han sido cargados." });
    }
    
    alcoholStats = [
        { nation: "Albania", date_year: 2016, alcohol_litre: 7.5, recorded_consumption: 4.4, unrecorded_consumption: 0.7 },
        { nation: "Albania", date_year: 1996, alcohol_litre: 2.59, recorded_consumption: 4.4, unrecorded_consumption: 0.7 },
        { nation: "Albania", date_year: 2019, alcohol_litre: 5.1, recorded_consumption: 4.4, unrecorded_consumption: 0.7 },
        { nation: "Brazil", date_year: 2016, alcohol_litre: 7.8, recorded_consumption: 6.3, unrecorded_consumption: 1.4 },
        { nation: "Brazil", date_year: 2019, alcohol_litre: 7.7, recorded_consumption: 6.3, unrecorded_consumption: 1.4 },
        { nation: "Andorra", date_year: 2019, alcohol_litre: 11.3, recorded_consumption: 11.1, unrecorded_consumption: 0.4 },
        { nation: "Angola", date_year: 2016, alcohol_litre: 6.4, recorded_consumption: 5.3, unrecorded_consumption: 0.9 },
        { nation: "Argentina", date_year: 2019, alcohol_litre: 8, recorded_consumption: 7.6, unrecorded_consumption: 0.4 },
        { nation: "Armenia", date_year: 2016, alcohol_litre: 5.5, recorded_consumption: 4.1, unrecorded_consumption: 0.9 },
        { nation: "Austria", date_year: 2016, alcohol_litre: 11.6, recorded_consumption: 11.7, unrecorded_consumption: 0.4 },
        { nation: "Australia", date_year: 2016, alcohol_litre: 10.6, recorded_consumption: 9.5, unrecorded_consumption: 0.4 },
        { nation: "Denmark", date_year: 2016, alcohol_litre: 10.4, recorded_consumption: 9.2, unrecorded_consumption: 0.4 }
    ];
    
    res.status(200).json(alcoholStats);
});

app.get(BASE_URL_API_MRG, (req, res) => {
    res.status(200).json(alcoholStats);
});

app.get(BASE_URL_API_MRG + "/:nation/:date_year", (req, res) => {
    const { nation, date_year } = req.params;
    const resource = alcoholStats.find(d => d.nation === nation && d.date_year == date_year);
    
    if (resource) {
        res.status(200).json(resource);
    } else {
        res.status(404).json({ error: "Not Found: No se encontró el recurso." });
    }
});

app.post(BASE_URL_API_MRG, (req, res) => {
    const newData = req.body;

    if (!newData.nation || !newData.date_year || !newData.alcohol_litre || !newData.recorded_consumption || !newData.unrecorded_consumption) {
        return res.status(400).json({ error: "Bad Request: Faltan campos obligatorios." });
    }

    const exists = alcoholStats.some(d => d.nation === newData.nation && d.date_year == newData.date_year);
    if (exists) {
        return res.status(409).json({ error: "Conflict: Ese recurso ya existe." });
    }

    alcoholStats.push(newData);
    res.status(201).json({ message: "Created: Recurso creado exitosamente." });
});

app.delete(BASE_URL_API_MRG, (req, res) => {
    alcoholStats = [];
    res.status(200).json({ message: "OK: Todos los recursos han sido eliminados." });
});

app.delete(BASE_URL_API_MRG + "/:nation/:date_year", (req, res) => {
    const { nation, date_year } = req.params;
    const initialLength = alcoholStats.length;
    
    alcoholStats = alcoholStats.filter(d => !(d.nation === nation && d.date_year == date_year));

    if (alcoholStats.length < initialLength) {
        res.status(200).json({ message: "OK: Recurso eliminado correctamente." });
    } else {
        res.status(404).json({ error: "Not Found: El recurso a borrar no existe." });
    }
});

app.put(BASE_URL_API_MRG + "/:nation/:date_year", (req, res) => {
    const { nation, date_year } = req.params;
    const updatedData = req.body;

    if (updatedData.nation !== nation || updatedData.date_year != date_year) {
        return res.status(400).json({ error: "Bad Request: Los IDs del cuerpo no coinciden con los de la URL." });
    }

    const index = alcoholStats.findIndex(d => d.nation === nation && d.date_year == date_year);
    
    if (index !== -1) {
        alcoholStats[index] = updatedData;
        res.status(200).json({ message: "OK: Recurso actualizado." });
    } else {
        res.status(404).json({ error: "Not Found: El recurso que intentas actualizar no existe." });
    }
});

app.post(BASE_URL_API_MRG + "/:nation/:date_year", (req, res) => {
    res.status(405).json({ error: "Method Not Allowed: No se puede hacer POST a un recurso concreto." });
});

app.put(BASE_URL_API_MRG, (req, res) => {
    res.status(405).json({ error: "Method Not Allowed: No se puede hacer PUT sobre la lista general." });
});
}






// Tarea Individual: Ruta /samples/TGG + API TGG
//Ruta /samples/TGG https://sos2526-11.onrender.com/samples/TGG
{
app.get('/samples/TGG', (req, res) => {
    const literacyData = [
    { country: "Armenia", total: 99.8, male: 99.8, female: 99.7, gender_gap: 0.1, year: 2020 },
    { country: "Colombia", total: 95.6, male: 95.4, female: 95.9, gender_gap: 0.5, year: 2020 },
    { country: "Ecuador", total: 93.6, male: 94.8, female: 92.5, gender_gap: 2.3, year: 2020 },
    { country: "Indonesia", total: 96.0, male: 97.4, female: 94.6, gender_gap: 2.8, year: 2020 },
    { country: "Kuwait", total: 96.5, male: 97.1, female: 95.4, gender_gap: 1.7, year: 2020 },
    { country: "Mexico", total: 95.2, male: 96.1, female: 94.5, gender_gap: 1.6, year: 2020 },
    { country: "Mongolia", total: 99.2, male: 99.1, female: 99.2, gender_gap: 0.1, year: 2020 },
    { country: "North Macedonia", total: 98.4, male: 99.1, female: 97.6, gender_gap: 1.5, year: 2020 },
    { country: "Paraguay", total: 94.5, male: 94.9, female: 94.2, gender_gap: 0.7, year: 2020 },
    { country: "Peru", total: 94.5, male: 97.0, female: 92.0, gender_gap: 5.0, year: 2020 },
    { country: "Saudi Arabia", total: 97.6, male: 98.6, female: 96.0, gender_gap: 2.6, year: 2020 },
    { country: "Spain", total: 98.6, male: 99.0, female: 98.2, gender_gap: 0.8, year: 2020 },
    { country: "Spain", total: 99.3, male: 98.5, female: 98.1, gender_gap: 0.6, year: 2021 }
    ];
   
    const targetCountry = "Spain";
    const filtered = literacyData.filter(d => d.country === targetCountry);
    if (filtered.length > 0) {
        const averageTotal = filtered
            .map(d => d.total)
            .reduce((acc, value) => acc + value, 0) / filtered.length;
        console.log(`Media de 'total' en ${targetCountry}: ${averageTotal.toFixed(2)}%`);
        res.send(`<p>Media de 'total' en ${targetCountry}: ${averageTotal.toFixed(2)}%</p>`);
    } else {
        console.log(`No se encontraron datos para ${targetCountry}`);
        res.send(`<p>No se encontraron datos para ${targetCountry}</p>`);
    }
});
}

//API TGG https://sos2526-11.onrender.com/api/v1/literacy-rates
{
let literacyStats = [
        
    ];
// GET /api/v1/literacy-rates/loadInitialData - Carga datos iniciales. Ejemplo: https://sos2526-11.onrender.com/api/v1/literacy-rates/loadInitialData (carga datos como Armenia 2020, Spain 2020, etc.)
app.get("/api/v1/literacy-rates/loadInitialData", (req, res) => {
    if (literacyStats.length > 0) {
        return res.status(400).json({ error: "Bad Request: Data already exists" });
    }
    literacyStats = [
        { country: "Armenia", total: 99.8, male: 99.8, female: 99.7, gender_gap: 0.1, year: 2020 },
    { country: "Colombia", total: 95.6, male: 95.4, female: 95.9, gender_gap: 0.5, year: 2020 },
    { country: "Ecuador", total: 93.6, male: 94.8, female: 92.5, gender_gap: 2.3, year: 2020 },
    { country: "Indonesia", total: 96.0, male: 97.4, female: 94.6, gender_gap: 2.8, year: 2020 },
    { country: "Kuwait", total: 96.5, male: 97.1, female: 95.4, gender_gap: 1.7, year: 2020 },
    { country: "Mexico", total: 95.2, male: 96.1, female: 94.5, gender_gap: 1.6, year: 2020 },
    { country: "Mongolia", total: 99.2, male: 99.1, female: 99.2, gender_gap: 0.1, year: 2020 },
    { country: "North Macedonia", total: 98.4, male: 99.1, female: 97.6, gender_gap: 1.5, year: 2020 },
    { country: "Paraguay", total: 94.5, male: 94.9, female: 94.2, gender_gap: 0.7, year: 2020 },
    { country: "Peru", total: 94.5, male: 97.0, female: 92.0, gender_gap: 5.0, year: 2020 },
    { country: "Saudi Arabia", total: 97.6, male: 98.6, female: 96.0, gender_gap: 2.6, year: 2020 },
    { country: "Spain", total: 98.6, male: 99.0, female: 98.2, gender_gap: 0.8, year: 2020 },
    { country: "Spain", total: 99.3, male: 98.5, female: 98.1, gender_gap: 0.6, year: 2021 }
    ];
    res.status(200).json(literacyStats);
});
// GET /api/v1/literacy-rates  https://sos2526-11.onrender.com/api/v1/literacy-rates
app.get(BASE_URL_API_TGG, (req, res) => {
    res.send(JSON.stringify(literacyStats,null,2));
});
// GET /api/v1/literacy-rates/:country https://sos2526-11.onrender.com/api/v1/literacy-rates/Spain
app.get(BASE_URL_API_TGG + "/:country", (req, res) => {
    const { country } = req.params;
    const { year, from, to } = req.query;
    let result = literacyStats.filter((d) => d.country.toLowerCase() === country.toLowerCase());
    if (year) result = result.filter((d) => d.year == year);
    if (from) result = result.filter((d) => d.year >= parseInt(from));
    if (to)   result = result.filter((d) => d.year <= parseInt(to));
    res.status(200).json(result);
});
// GET /api/v1/literacy-rates con filtros https://sos2526-11.onrender.com/api/v1/literacy-rates?country=Spain
app.get(BASE_URL_API_TGG, (req, res) => {
    const { country, year, from, to } = req.query;
    let result = [...literacyStats];
    if (country) result = result.filter((d) => d.country.toLowerCase() === country.toLowerCase());
    if (year)    result = result.filter((d) => d.year == year);
    if (from)    result = result.filter((d) => d.year >= parseInt(from));
    if (to)      result = result.filter((d) => d.year <= parseInt(to));
    res.status(200).json(result);
});  
// GET /api/v1/literacy-rates/:country/:year - Obtiene un recurso concreto. Ejemplo: https://sos2526-11.onrender.com/api/v1/literacy-rates/Spain/2020
app.get(BASE_URL_API_TGG + "/:country/:year", (req, res) => {
    const { country, year } = req.params;
    const resource = literacyStats.find(
      (d) => d.country.toLowerCase() === country.toLowerCase() && d.year == year);
    resource ? res.status(200).json(resource) : res.sendStatus(404);
});
// POST /api/v1/literacy-rates  https://sos2526-11.onrender.com/api/v1/literacy-rates { "country": "Spain", "year": 2022, "total": 99.0, "male": 99.5, "female": 98.5, "gender_gap": 1.0 }
app.post(BASE_URL_API_TGG, (req, res) => {
    const data = req.body;
    if (!data.country || !data.year || data.total === undefined ||
        data.male === undefined || data.female === undefined || data.gender_gap === undefined)
      return res.status(401).json({ error: "Bad Request: Faltan campos obligatorios (country, year, total, male, female, gender_gap)" });
    const exists = literacyStats.some(
      (d) => d.country.toLowerCase() === data.country.toLowerCase() && d.year == data.year
    );
    if (exists)
      return res.status(409).json({ error: "Conflict: Ya existe una entrada para ese país y año" });

    literacyStats.push({
      country:     String(data.country),
      year:        Number(data.year),
      countryCode: data.countryCode || "",
      total:       Number(data.total),
      male:        Number(data.male),
      female:      Number(data.female),
      gender_gap:  Number(data.gender_gap),
    });
    res.sendStatus(200);
});
// PUT /api/v1/literacy-rates No permitido
app.put(BASE_URL_API_TGG, (req, res) => res.sendStatus(405));
}

// DELETE /api/v1/literacy-rates https://sos2526-11.onrender.com/api/v1/literacy-rates
app.delete(BASE_URL_API_TGG, (req, res) => {
    literacyStats = [];
    res.status(200).json({ message: "OK: Todos los recursos han sido eliminados." });
});

// POST /api/v1/literacy-rates/:country/:year No permitido https://sos2526-11.onrender.com/api/v1/literacy-rates/Spain/2020
app.post(BASE_URL_API_TGG + "/:country/:year", (req, res) => {
    res.status(405).json({ error: "Method Not Allowed: No se puede hacer POST a un recurso concreto." });
});

// PUT /api/v1/literacy-rates/:country/:year https://sos2526-11.onrender.com/api/v1/literacy-rates/Spain/2020 con body { "country": "Spain", "year": 2020, "total": 99.0, "male": 99.5, "female": 98.5, "gender_gap": 1.0 }
app.put(BASE_URL_API_TGG + "/:country/:year", (req, res) => {
    const { country, year } = req.params;
    const updatedData = req.body;

    if (!updatedData.country || !updatedData.year || updatedData.total === undefined ||
        updatedData.male === undefined || updatedData.female === undefined || updatedData.gender_gap === undefined) {
        return res.status(400).json({ error: "Bad Request: Faltan campos obligatorios." });
    }

    if (updatedData.country.toLowerCase() !== country.toLowerCase() || updatedData.year != year) {
        return res.status(400).json({ error: "Bad Request: Los IDs del cuerpo no coinciden con los de la URL." });
    }

    const index = literacyStats.findIndex(d => d.country.toLowerCase() === country.toLowerCase() && d.year == year);
    
    if (index !== -1) {
        literacyStats[index] = {
            country: String(updatedData.country),
            year: Number(updatedData.year),
            countryCode: updatedData.countryCode || "",
            total: Number(updatedData.total),
            male: Number(updatedData.male),
            female: Number(updatedData.female),
            gender_gap: Number(updatedData.gender_gap),
        };
        res.status(200).json({ message: "OK: Recurso actualizado." });
    } else {
        res.status(404).json({ error: "Not Found: El recurso que intentas actualizar no existe." });
    }
});

// DELETE /api/v1/literacy-rates/:country/:year https://sos2526-11.onrender.com/api/v1/literacy-rates/Spain/2020
app.delete(BASE_URL_API_TGG + "/:country/:year", (req, res) => {
    const { country, year } = req.params;
    const initialLength = literacyStats.length;
    
    literacyStats = literacyStats.filter(d => !(d.country.toLowerCase() === country.toLowerCase() && d.year == year));

    if (literacyStats.length < initialLength) {
        res.status(200).json({ message: "OK: Recurso eliminado correctamente." });
    } else {
        res.status(404).json({ error: "Not Found: El recurso a borrar no existe." });
    }
});




// Tarea Individual: Ruta /samples/JFM https://sos2526-11.onrender.com/samples/JFM
{
app.get('/samples/JFM', (req, res) => {

    const deathData = [
      { nation: "mexico", year: 2019, population_death_rate: 5.7, vehicle_death_rate: 14.2, distance_death_rate: null, total_death: 4125, income_level: "middle", traffic_side: "right" },
      { nation: "albania", year: 2013, population_death_rate: 15.1, vehicle_death_rate: 107.2, distance_death_rate: null, total_death: 478, income_level: "middle", traffic_side: "right" },
      { nation: "argelia", year: 2013, population_death_rate: 23.8, vehicle_death_rate: 127.8, distance_death_rate: null, total_death: 9337, income_level: "middle", traffic_side: "right" },
      { nation: "canada", year: 2013, population_death_rate: 6, vehicle_death_rate: 9.5, distance_death_rate: 6.2, total_death: 2114, income_level: "high", traffic_side: "right" },
      { nation: "united kingdom", year: 2013, population_death_rate: 2.9, vehicle_death_rate: 5.1, distance_death_rate: 3.6, total_death: 1827, income_level: "high", traffic_side: "left" },
      { nation: "ukraine", year: 2012, population_death_rate: 13.5, vehicle_death_rate: 35.3, distance_death_rate: null, total_death: 5099, income_level: "middle", traffic_side: "right" },
      { nation: "spain", year: 2013, population_death_rate: 3.7, vehicle_death_rate: 5.3, distance_death_rate: 7.8, total_death: 1730, income_level: "high", traffic_side: "right" },
      { nation: "norway", year: 2017, population_death_rate: 2.2, vehicle_death_rate: 3.1, distance_death_rate: null, total_death: 112, income_level: "high", traffic_side: "right" },
      { nation: "uganda", year: 2013, population_death_rate: 27.4, vehicle_death_rate: 836.8, distance_death_rate: null, total_death: 10280, income_level: "low", traffic_side: "left" },
      { nation: "switzerland", year: 2016, population_death_rate: 2.6, vehicle_death_rate: 3.6, distance_death_rate: 3.6, total_death: 216, income_level: "high", traffic_side: "right" },
      { nation: "argentina", year: 2013, population_death_rate: 13.6, vehicle_death_rate: 24.3, distance_death_rate: null, total_death: 5619, income_level: "middle", traffic_side: "right" },
      { nation: "italy", year: 2013, population_death_rate: 6.1, vehicle_death_rate: 7.3, distance_death_rate: null, total_death: 3753, income_level: "high", traffic_side: "right" },
      { nation: "italy", year: 2023, population_death_rate: 5.2, vehicle_death_rate: null, distance_death_rate: null, total_death: 3039, income_level: "high", traffic_side: "right" }
    ];

    const targetNation = "italy";

    const filteredData = deathData.filter(e => e.nation === targetNation);

    if (filteredData.length > 0) {

        let totalDeaths = 0;

        filteredData.forEach(e => {
            totalDeaths += e.total_death;
        });

        const average = totalDeaths / filteredData.length;

        res.send(`<p>Resultado: La media de 'total_death' en ${targetNation} es ${average.toFixed(2)}.</p>`);

    } else {
        res.send(`<p>No se encontraron datos para la nación: ${targetNation}</p>`);
    }

});

}

// API JFM https://sos2526-11.onrender.com/api/v1/road-fatalities
{
const BASE_URL_API_JFM = "/api/v1/road-fatalities";

let roadFatalitiesStats = []; //Vacío para que loadInitialData tenga sentido

const initialRoadFatalities = [
  { nation: "mexico", year: 2019, population_death_rate: 5.7, vehicle_death_rate: 14.2, distance_death_rate: null, total_death: 4125, income_level: "middle", traffic_side: "right" },
  { nation: "albania", year: 2013, population_death_rate: 15.1, vehicle_death_rate: 107.2, distance_death_rate: null, total_death: 478, income_level: "middle", traffic_side: "right" },
  { nation: "argelia", year: 2013, population_death_rate: 23.8, vehicle_death_rate: 127.8, distance_death_rate: null, total_death: 9337, income_level: "middle", traffic_side: "right" },
  { nation: "canada", year: 2013, population_death_rate: 6, vehicle_death_rate: 9.5, distance_death_rate: 6.2, total_death: 2114, income_level: "high", traffic_side: "right" },
  { nation: "united kingdom", year: 2013, population_death_rate: 2.9, vehicle_death_rate: 5.1, distance_death_rate: 3.6, total_death: 1827, income_level: "high", traffic_side: "left" },
  { nation: "ukraine", year: 2012, population_death_rate: 13.5, vehicle_death_rate: 35.3, distance_death_rate: null, total_death: 5099, income_level: "middle", traffic_side: "right" },
  { nation: "spain", year: 2013, population_death_rate: 3.7, vehicle_death_rate: 5.3, distance_death_rate: 7.8, total_death: 1730, income_level: "high", traffic_side: "right" },
  { nation: "norway", year: 2017, population_death_rate: 2.2, vehicle_death_rate: 3.1, distance_death_rate: null, total_death: 112, income_level: "high", traffic_side: "right" },
  { nation: "uganda", year: 2013, population_death_rate: 27.4, vehicle_death_rate: 836.8, distance_death_rate: null, total_death: 10280, income_level: "low", traffic_side: "left" },
  { nation: "switzerland", year: 2016, population_death_rate: 2.6, vehicle_death_rate: 3.6, distance_death_rate: 3.6, total_death: 216, income_level: "high", traffic_side: "right" },
  { nation: "argentina", year: 2013, population_death_rate: 13.6, vehicle_death_rate: 24.3, distance_death_rate: null, total_death: 5619, income_level: "middle", traffic_side: "right" },
  { nation: "italy", year: 2013, population_death_rate: 6.1, vehicle_death_rate: 7.3, distance_death_rate: null, total_death: 3753, income_level: "high", traffic_side: "right" },
  { nation: "italy", year: 2023, population_death_rate: 5.2, vehicle_death_rate: null, distance_death_rate: null, total_death: 3039, income_level: "high", traffic_side: "right" }
];


//loadInitialData
app.get(BASE_URL_API_JFM + "/loadInitialData", (req, res) => {
  if (roadFatalitiesStats.length > 0) {
    return res.status(400).json({ error: "Bad Request: Los datos ya han sido cargados." });
  }
  roadFatalitiesStats = [...initialRoadFatalities]; // al hacer un GET cree 10 o más datos en el array de NodeJS si está vacío.
  return res.status(200).json(roadFatalitiesStats);
});


//GET todo 
//localhost:8080/api/v1/road-fatalities https://sos2526-11.onrender.com/api/v1/road-fatalities
app.get(BASE_URL_API_JFM, (req, res) => {
    res.send(JSON.stringify(roadFatalitiesStats,null,2));
});


// GET por nación (con filtros year/from/to) Empieza filtrando por nación
// Ej: GET /api/v1/road-fatalities/italy
app.get(BASE_URL_API_JFM + "/:nation", (req, res) => {
  const { nation } = req.params;
  const { year, from, to } = req.query;

  let result = roadFatalitiesStats.filter( (d) => d.nation.toLowerCase() === nation.toLowerCase());

  if (year) result = result.filter((d) => d.year == year);
  if (from) result = result.filter((d) => d.year >= parseInt(from));
  if (to)   result = result.filter((d) => d.year <= parseInt(to));

  res.status(200).json(result); // si no hay -> []
});


// GET colección con filtros (nation, year, from, to) (Empieza filtrando por toda la colección)
// Ej:
// /api/v1/road-fatalities?nation=spain
// /api/v1/road-fatalities?year=2013
// /api/v1/road-fatalities?nation=italy&from=2010&to=2023


app.get(BASE_URL_API_JFM, (req, res) => {
  const { nation, year, from, to } = req.query;

  let result = [...roadFatalitiesStats];

  if (nation) result = result.filter(d => d.nation.toLowerCase() === nation.toLowerCase());
  if (year)   result = result.filter(d => d.year == year);
  if (from)   result = result.filter(d => d.year >= parseInt(from));
  if (to)     result = result.filter(d => d.year <= parseInt(to));

  res.status(200).json(result); // si no hay datos → devuelve []
});


// GET recurso concreto (Pais y año)
// Ej: GET /api/v1/road-fatalities/spain/2013
app.get(BASE_URL_API_JFM + "/:nation/:year", (req, res) => {

  const { nation, year } = req.params;

  const resource = roadFatalitiesStats.find(
    d => d.nation.toLowerCase() === nation.toLowerCase() && d.year == year
  );

  if (resource) {
    res.status(200).json(resource);
  } else {
    res.sendStatus(404);
  }

});


// POST colección 
// Ej: POST /api/v1/road-fatalities
app.post(BASE_URL_API_JFM, (req, res) => {
  const data = req.body;

  // Obligatorios (como mínimo)
  if (!data.nation || data.year === undefined || data.population_death_rate === undefined ||
      data.vehicle_death_rate === undefined || data.total_death === undefined ||
      !data.income_level || !data.traffic_side) {
    return res.status(400).json({ error: "Bad Request: Faltan campos obligatorios." });
  }

  const exists = roadFatalitiesStats.some(d => d.nation.toLowerCase() === String(data.nation).toLowerCase() && d.year == data.year);
  if (exists) {
    return res.status(409).json({ error: "Conflict: Ese recurso ya existe." });
  }

  roadFatalitiesStats.push({
  nation:                 String(data.nation).toLowerCase(),
  year:                   Number(data.year),
  population_death_rate:  Number(data.population_death_rate),
  vehicle_death_rate:     (data.vehicle_death_rate === null ? null : Number(data.vehicle_death_rate)),
  distance_death_rate:    (data.distance_death_rate === null || data.distance_death_rate === undefined)
                            ? null
                            : Number(data.distance_death_rate),
  total_death:            Number(data.total_death),
  income_level:           String(data.income_level),
  traffic_side:           String(data.traffic_side)
});

  return res.sendStatus(201);
});


// POST (a un recurso concreto (NO PERMITIDO))
//Ej: POST /api/v1/road-fatalities/italy/2023
app.post(BASE_URL_API_JFM + "/:nation/:year", (req, res) => res.sendStatus(405));


// PUT (coleccion (NO PERMITIDO))
//Ej: PUT  /api/v1/road-fatalities
app.put(BASE_URL_API_JFM, (req, res) => res.sendStatus(405));


// PUT (a un recurso concreto (Actualiza los datos))
// Ej: PUT /api/v1/road-fatalities/spain/2013
app.put(BASE_URL_API_JFM + "/:nation/:year", (req, res) => {
  const { nation, year } = req.params;
  const data = req.body;

  // Error 400: Falta el JSON correcto o faltan campos obligatorios
  if (!data.nation || 
      data.year === undefined || 
      data.population_death_rate === undefined ||
      data.vehicle_death_rate === undefined || 
      data.total_death === undefined ||
      !data.income_level || 
      !data.traffic_side) {
    return res.status(400).json({ error: "Bad Request: JSON inválido o faltan campos esperados." });
  }

  // Error 400: El ID del body no coincide con el de la URL
  if (data.nation.toLowerCase() !== nation.toLowerCase() || String(data.year) !== String(year)) {
    return res.status(400).json({ error: "Bad Request: Los identificadores de la URL no coinciden con el body." });
  }

  const index = roadFatalitiesStats.findIndex(
    d => d.nation.toLowerCase() === nation.toLowerCase() && d.year == year
  );

  // Error 404: El recurso no existe
  if (index === -1) {
    return res.sendStatus(404);
  }

  // Éxito 200: Actualización correcta (Sobreescribiendo el índice)
  roadFatalitiesStats[index] = {
    nation:                 String(data.nation).toLowerCase(),
    year:                   Number(data.year),
    population_death_rate:  Number(data.population_death_rate),
    vehicle_death_rate:     (data.vehicle_death_rate === null ? null : Number(data.vehicle_death_rate)),
    distance_death_rate:    (data.distance_death_rate === null || data.distance_death_rate === undefined)
                              ? null
                              : Number(data.distance_death_rate),
    total_death:            Number(data.total_death),
    income_level:           String(data.income_level),
    traffic_side:           String(data.traffic_side)
  };

  return res.sendStatus(200);
});


// DELETE (a todo)
//Ej: DELETE  /api/v1/road-fatalities
app.delete(BASE_URL_API_JFM, (req, res) => {
    roadFatalitiesStats = [];
    res.sendStatus(200);
});


// DELETE (a un recurso concreto, borra solo un país en un año específico)
//Ej: DELETE  /api/v1/road-fatalities/spain/2013
app.delete(BASE_URL_API_JFM + "/:nation/:year", (req, res) => {
  const { nation, year } = req.params;

  const initialLength = roadFatalitiesStats.length;
  roadFatalitiesStats = roadFatalitiesStats.filter(
    d => !(d.nation.toLowerCase() === nation.toLowerCase() && d.year == year));

  // Si no ha cambiado el tamaño, el recurso no existía
  if (roadFatalitiesStats.length === initialLength) {
    return res.sendStatus(404);
  }

  // Si se ha borrado correctamente
  return res.sendStatus(200);
});


}

//ruta de acceso al servidort localhost:8080
app.listen(port, () => {
    console.log(`Servidor funcionando en el puerto ${port}`);
});
