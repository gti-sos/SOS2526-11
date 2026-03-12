import express from "express";
import bodyParser from "body-parser";
import dataStore from "nedb";
const app = express();
let db = new dataStore();
app.use(bodyParser.json());
export const BASE_URL_API_TGG = "/api/v1/literacy-rates";

function loadBackendTGG() {
// API TGG https://sos2526-11.onrender.com/api/v1/literacy-rates
    let literacyStats = [];
    db.insert(literacyStats);
    
// GET /api/v1/literacy-rates/loadInitialData - Carga datos iniciales. Ejemplo: https://sos2526-11.onrender.com/api/v1/literacy-rates/loadInitialData (carga datos como Armenia 2020, Spain 2020, etc.)
    app.get("/api/v1/literacy-rates/loadInitialData", (req, res) => {
        db.find({}, (err, literacyStats) => {
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
        res.sendStatus(200);
    });
    // PUT /api/v1/literacy-rates No permitido
    app.put(BASE_URL_API_TGG, (req, res) => res.sendStatus(405));
    

// DELETE /api/v1/literacy-rates https://sos2526-11.onrender.com/api/v1/literacy-rates
    app.delete(BASE_URL_API_TGG, (req, res) => {
        literacyStats = [];
        res.status(200).json({ message: "OK: Todos los recursos han sido eliminados." });
    });

// POST /api/v1/literacy-rates/:country/:year No permitido https://sos2526-11.onrender.com/api/v1/literacy-rates/Spain/2020
    app.post(BASE_URL_API_TGG + "/:country/:year", (req, res) => {
        res.status(405).json({ error: "Method Not Allowed: No se puede hacer POST a un recurso concreto." });
    });

// PUT /api/v1/literacy-rates/:country/:year https://sos2526-11.onrender.com/api/v1/literacy-rates/Spain/2020 { "country": "Spain", "year": 2020, "total": 99.0, "male": 99.5, "female": 98.5, "gender_gap": 1.0 }
    app.put(BASE_URL_API_TGG + "/:country/:year", (req, res) => {

        const { country, year } = req.params;
        const updatedData = req.body;

        // comprobar que hay body
        if (!updatedData) {
            return res.status(400).json({ error: "Bad Request: Body vacío." });
        }

        // comprobar campos obligatorios
        if (
            updatedData.country === undefined ||
            updatedData.year === undefined ||
            updatedData.total === undefined ||
            updatedData.male === undefined ||
            updatedData.female === undefined ||
            updatedData.gender_gap === undefined
        ) {
            return res.status(400).json({
                error: "Bad Request: Faltan campos obligatorios (country, year, total, male, female, gender_gap)"
            });
        }

        // validar tipos básicos
        if (typeof updatedData.country !== "string") {
            return res.status(400).json({ error: "Bad Request: country debe ser string." });
        }

        // comprobar que los IDs coinciden con la URL
        if (
            updatedData.country.toLowerCase() !== country.toLowerCase() ||
            Number(updatedData.year) !== Number(year)
        ) {
            return res.status(400).json({
                error: "Bad Request: Los IDs del cuerpo no coinciden con los de la URL."
            });
        }

        // buscar recurso
        const index = literacyStats.findIndex(
            d =>
                d.country.toLowerCase() === country.toLowerCase() &&
                d.year == year
        );

        // si no existe
        if (index === -1) {
            return res.status(404).json({
                error: "Not Found: El recurso que intentas actualizar no existe."
            });
        }

        // actualizar
        literacyStats[index] = {
            country: String(updatedData.country),
            year: Number(updatedData.year),
            countryCode: updatedData.countryCode || "",
            total: Number(updatedData.total),
            male: Number(updatedData.male),
            female: Number(updatedData.female),
            gender_gap: Number(updatedData.gender_gap)
        };

        res.status(200).json({ message: "OK: Recurso actualizado correctamente." });

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
}

export { loadBackendTGG };