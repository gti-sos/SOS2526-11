const express = require('express');
const app = express();
const port = process.env.PORT || 8080;
let cool = require('cool-ascii-faces');
let BASE_URL_API = "/api/v1";
let BASE_URL_API_TGG =   BASE_URL_API + "/literacy-rates";

// Middleware para parsear JSON
app.use(express.json());

// Sirve archivos estáticos desde la carpeta 'public' (Para about.html)
app.use('/', express.static('./public'));

// Tarea de Grupo: Ruta /cool
{
app.get('/cool', (req, res) => {
    res.send("<html><body><h1>" + cool() + "</h1></body></html>");
});
}
// Tarea Individual: Ruta /samples/MRG
{
app.get('/samples/MRG', (req, res) => {
    const alcoholData = [
        { nation: "Albania", date_year: 2016, alcohol_litre: 7.5, recorded_consumption: 4.4, unrecorded_consumption: 0.7 },
        { nation: "Albania", date_year: 1996, alcohol_litre: 2.59, recorded_consumption: 4.4, unrecorded_consumption: 0.7 },
        { nation: "Albania", date_year: 2019, alcohol_litre: 5.1, recorded_consumption: 4.4, unrecorded_consumption: 0.7 },
        { nation: "Brazil", date_year: 2016, alcohol_litre: 7.8, recorded_consumption: 6.3, unrecorded_consumption: 1.4 }
        
    ];

    const targetNation = "Albania";
    const filteredData = alcoholData.filter(e => e.nation === targetNation);

    if (filteredData.length > 0) {
        let totalAlcohol = 0;
        filteredData.forEach(e => {
            totalAlcohol += e.alcohol_litre;
        });
        const average = totalAlcohol / filteredData.length;
        res.send(`<p>Resultado: La media de 'alcohol_litre' en ${targetNation} es ${average.toFixed(2)} litros.</p>`);
    } else {
        res.send(`<p>No se encontraron datos para la nacion: ${targetNation}</p>`);
    }
});
}

// Tarea Individual: Ruta /samples/TGG + API TGG
//Ruta /samples/TGG
{
app.get('/samples/TGG', (req, res) => {
    //Inicializa un array con los datos de ejemplo pestaña individual de la ficha de trabajo.
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

    // Realice un algoritmo usando iteradores (forEach, Map, filter, …) que permita calcular la media de
    // valores de alguna de los campos numéricos del subconjunto de filas que comparten un determinado valor
    // en el campo de información geográfica.
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

//API TGG
{
let literacyStats = [
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
//loadInitialData localhost:8080/api/v1/literacy-rates/loadInitialData
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
//get todo localhost:8080/api/v1/literacy-rates
app.get(BASE_URL_API_TGG, (req, res) => {
    res.send(JSON.stringify(literacyStats,null,2));
});
// get pais localhost:8080/api/v1/literacy-rates/Spain
app.get(BASE_URL_API_TGG + "/:country", (req, res) => {
    const { country } = req.params;
    const { year, from, to } = req.query;
    let result = literacyStats.filter((d) => d.country.toLowerCase() === country.toLowerCase());
    if (year) result = result.filter((d) => d.year == year);
    if (from) result = result.filter((d) => d.year >= parseInt(from));
    if (to)   result = result.filter((d) => d.year <= parseInt(to));
    res.status(200).json(result);
});
//get pais año localhost:8080/api/v1/literacy-rates/Spain/2020
app.get(BASE_URL_API_TGG, (req, res) => {
    const { country, year, from, to } = req.query;
    let result = [...literacyStats];
    if (country) result = result.filter((d) => d.country.toLowerCase() === country.toLowerCase());
    if (year)    result = result.filter((d) => d.year == year);
    if (from)    result = result.filter((d) => d.year >= parseInt(from));
    if (to)      result = result.filter((d) => d.year <= parseInt(to));
    res.status(200).json(result);
});  
// get  pais/año (recurso concreto) localhost:8080/api/v1/literacy-rates/Spain/2020
app.get(BASE_URL_API_TGG + "/:country/:year", (req, res) => {
    const { country, year } = req.params;
    const resource = literacyStats.find(
      (d) => d.country.toLowerCase() === country.toLowerCase() && d.year == year);
    resource ? res.status(200).json(resource) : res.sendStatus(404);
});
//post 
app.post(BASE_URL_API_TGG, (req, res) => {
    const data = req.body;
    if (!data.country || !data.year || data.total === undefined ||
        data.male === undefined || data.female === undefined || data.gender_gap === undefined)
      return res.status(400).json({ error: "Bad Request: Faltan campos obligatorios (country, year, total, male, female, gender_gap)" });
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
    res.sendStatus(201);
});
// put
app.put(BASE_URL_API_TGG, (req, res) => res.sendStatus(200));
}
//ruta de acceso al servidort localhost:8080
app.listen(port, () => {
    console.log(`Servidor funcionando en el puerto ${port}`);
});




// Tarea Individual: Ruta /samples/JFM
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