import dataStore from "nedb";

export const BASE_URL_API_TGG = "/api/v1/literacy-rates";

export function loadBackendTGG(app) {
    // Inicializamos NeDB con persistencia en archivo
    const db = new dataStore({ filename: './data/literacy-rates.db', autoload: true });

    // Función auxiliar para validar JSON de literacy rates
    function isValidLiteracyStats(body) {
        if (!body || typeof body !== "object") return false;

        const requiredKeys = ["country", "year", "total", "male", "female", "gender_gap"];
        for (let key of requiredKeys) {
            if (!(key in body)) return false;
        }

        // Tipos básicos
        if (typeof body.country !== "string") return false;
        if (typeof body.year !== "number") return false;
        if (typeof body.total !== "number") return false;
        if (typeof body.male !== "number") return false;
        if (typeof body.female !== "number") return false;
        if (typeof body.gender_gap !== "number") return false;

        return true;
    }

    // GET /api/v1/literacy-rates/docs - Redirección a la documentación (si existe)
    app.get(BASE_URL_API_TGG + "/docs", (req, res) => {
        res.redirect("https://documenter.getpostman.com/view/52276603/2sBXieqtK2");
    });

    // GET /api/v1/literacy-rates/loadInitialData
    app.get(BASE_URL_API_TGG + "/loadInitialData", (req, res) => {
        db.find({}, (err, docs) => {
            if (err) return res.status(500).json({ error: "Error interno del servidor" });

            if (docs.length > 0) {
                return res.status(400).json({ error: "Bad Request: Data already exists" });
            } else {
                const initialData = [
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

                db.insert(initialData, (err, newDocs) => {
                    if (err) return res.status(500).json({ error: "Error al insertar datos" });
                    newDocs.forEach(d => delete d._id);
                    res.status(200).json(newDocs);
                });
            }
        });
    });

    // GET /api/v1/literacy-rates (con filtros y paginación)
    app.get(BASE_URL_API_TGG, (req, res) => {
        const query = {};
        let offset = 0;
        let limit = 0;

        if (req.query.country) query.country = req.query.country;
        if (req.query.year) query.year = parseInt(req.query.year);
        if (req.query.total) query.total = parseFloat(req.query.total);
        if (req.query.male) query.male = parseFloat(req.query.male);
        if (req.query.female) query.female = parseFloat(req.query.female);
        if (req.query.gender_gap) query.gender_gap = parseFloat(req.query.gender_gap);

        if (req.query.offset) offset = parseInt(req.query.offset);
        if (req.query.limit) limit = parseInt(req.query.limit);

        db.find(query, { _id: 0 }).skip(offset).limit(limit).exec((err, docs) => {
            if (err) return res.status(500).json({ error: "Error interno del servidor" });
            res.status(200).json(docs);
        });
    });

    // GET /api/v1/literacy-rates/:country (filtros year/from/to)
    app.get(BASE_URL_API_TGG + "/:country", (req, res) => {
        const countryParam = req.params.country;
        const { year, from, to } = req.query;

        db.find({ country: countryParam }, { _id: 0 }, (err, docs) => {
            if (err) return res.status(500).json({ error: "Error interno del servidor" });

            let result = docs;

            if (year) result = result.filter(d => d.year == parseInt(year));
            if (from) result = result.filter(d => d.year >= parseInt(from));
            if (to) result = result.filter(d => d.year <= parseInt(to));

            res.status(200).json(result);
        });
    });

    // GET /api/v1/literacy-rates/:country/:year
    app.get(BASE_URL_API_TGG + "/:country/:year", (req, res) => {
        const countryParam = req.params.country;
        const yearParam = parseInt(req.params.year);

        db.findOne({ country: countryParam, year: yearParam }, { _id: 0 }, (err, doc) => {
            if (err) return res.status(500).json({ error: "Error interno del servidor" });
            doc ? res.status(200).json(doc) : res.status(404).json({ error: "Not Found: Recurso no encontrado" });
        });
    });

    // POST /api/v1/literacy-rates
    app.post(BASE_URL_API_TGG, (req, res) => {
        const newData = req.body;

        if (!isValidLiteracyStats(newData)) {
            return res.status(400).json({ error: "Bad Request: Estructura de JSON incorrecta o faltan campos" });
        }

        db.find({ country: newData.country, year: newData.year }, (err, docs) => {
            if (err) return res.status(500).json({ error: "Error interno del servidor" });

            if (docs.length > 0) {
                return res.status(409).json({ error: "Conflict: Ya existe una entrada para ese país y año" });
            } else {
                db.insert(newData, (err, newDoc) => {
                    if (err) return res.status(500).json({ error: "Error al guardar" });
                    res.status(201).json({ message: "Created: Recurso creado exitosamente." });
                });
            }
        });
    });

    // PUT /api/v1/literacy-rates (No permitido)
    app.put(BASE_URL_API_TGG, (req, res) => {
        res.status(405).json({ error: "Method Not Allowed: No se puede actualizar la lista completa" });
    });

    // DELETE /api/v1/literacy-rates
    app.delete(BASE_URL_API_TGG, (req, res) => {
        db.remove({}, { multi: true }, (err, numRemoved) => {
            if (err) return res.status(500).json({ error: "Error interno del servidor" });
            res.status(200).json({ message: "OK: Todos los recursos han sido eliminados." });
        });
    });

    // POST /api/v1/literacy-rates/:country/:year (No permitido)
    app.post(BASE_URL_API_TGG + "/:country/:year", (req, res) => {
        res.status(405).json({ error: "Method Not Allowed: No se puede hacer POST a un recurso concreto." });
    });

    // PUT /api/v1/literacy-rates/:country/:year
    app.put(BASE_URL_API_TGG + "/:country/:year", (req, res) => {
        const countryParam = req.params.country;
        const yearParam = parseInt(req.params.year);
        const body = req.body;

        if (!body) return res.status(400).json({ error: "Bad Request: Body vacío." });

        if (countryParam !== body.country || yearParam !== body.year) {
            return res.status(400).json({ error: "Bad Request: Los IDs del cuerpo no coinciden con los de la URL." });
        }

        if (!isValidLiteracyStats(body)) {
            return res.status(400).json({ error: "Bad Request: Faltan campos obligatorios o estructura incorrecta." });
        }

        db.update({ country: countryParam, year: yearParam }, body, {}, (err, numReplaced) => {
            if (err) return res.status(500).json({ error: "Error interno del servidor" });
            if (numReplaced === 0) {
                return res.status(404).json({ error: "Not Found: El recurso que intentas actualizar no existe." });
            }
            res.status(200).json({ message: "OK: Recurso actualizado correctamente." });
        });
    });

    // DELETE /api/v1/literacy-rates/:country/:year
    app.delete(BASE_URL_API_TGG + "/:country/:year", (req, res) => {
        const countryParam = req.params.country;
        const yearParam = parseInt(req.params.year);

        db.remove({ country: countryParam, year: yearParam }, {}, (err, numRemoved) => {
            if (err) return res.status(500).json({ error: "Error interno del servidor" });
            if (numRemoved === 0) {
                return res.status(404).json({ error: "Not Found: El recurso a borrar no existe." });
            }
            res.status(200).json({ message: "OK: Recurso eliminado correctamente." });
        });
    });
}
