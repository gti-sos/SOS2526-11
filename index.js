const express = require('express');
const app = express();
const port = process.env.PORT || 8080;
let cool = require('cool-ascii-faces');

// Sirve archivos estáticos desde la carpeta 'public' (Para tu about.html)
app.use('/', express.static('public'));

// Tarea de Grupo: Ruta /cool
app.get('/cool', (req, res) => {
    res.send("<html><body><h1>" + cool() + "</h1></body></html>");
});

// Tarea Individual: Ruta /samples/MRG
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
app.listen(port, () => {
    console.log(`Servidor funcionando en el puerto ${port}`);
});
