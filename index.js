const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

// Sirve archivos estáticos desde la carpeta 'public' (Para tu about.html)
app.use('/', express.static('public'));

// Tarea de Grupo: Ruta /cool
app.get('/cool', (req, res) => {
    res.send("<html><body><h1>( ͡° ͜ʖ ͡°)</h1></body></html>");
});

// Tarea Individual: Ruta /samples/MRG
app.get('/samples/MRG', (req, res) => {
    const alcoholData = [
        { nation: "Albania", date_year: 2016, alcohol_litre: 7.5, recorded_consumption: 4.4, unrecorded_consumption: 0.7 },
        { nation: "Albania", date_year: 1996, alcohol_litre: 2.59, recorded_consumption: 4.4, unrecorded_consumption: 0.7 },
        { nation: "Albania", date_year: 2019, alcohol_litre: 5.1, recorded_consumption: 4.4, unrecorded_consumption: 0.7 },
        { nation: "Brazil", date_year: 2016, alcohol_litre: 7.8, recorded_consumption: 6.3, unrecorded_consumption: 1.4 }
        // Nota: Añade aquí el resto de tus filas del Excel para que haya al menos 10
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

app.listen(port, () => {
    console.log(`Servidor funcionando en el puerto ${port}`);
});
