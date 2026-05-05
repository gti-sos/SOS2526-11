import Datastore from "nedb";

export const BASE_URL_API_TGG = "/api/v1/literacy-rates";

export function loadBackendTGG(app) {
    // Inicializamos NeDB con persistencia en archivo
    const db = new Datastore({ filename: './data/literacy-rates.db', autoload: false });
    db.loadDatabase();

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
        res.redirect("https://documenter.getpostman.com/view/52263638/2sBXigMDfw");
    });

    // GET /api/v1/literacy-rates/loadInitialData
    app.get(BASE_URL_API_TGG + "/loadInitialData", (req, res) => {

        const initialData = [
            { country: "Afghanistan", total: 37.3, male: 52.1, female: 22.6, gender_gap: 29.5, year: 2021 },
            { country: "Albania", total: 98.1, male: 98.5, female: 97.8, gender_gap: 0.7, year: 2018 },
            { country: "Algeria", total: 81.4, male: 87.4, female: 75.3, gender_gap: 12.1, year: 2018 },
            { country: "Andorra", total: 100.0, male: 100.0, female: 100.0, gender_gap: 0.0, year: 2016 },
            { country: "Angola", total: 71.1, male: 82.0, female: 60.7, gender_gap: 21.3, year: 2015 },
            { country: "Antigua and Barbuda", total: 99.0, male: 98.4, female: 99.4, gender_gap: 1.0, year: 2015 },
            { country: "Argentina", total: 99.0, male: 98.9, female: 99.1, gender_gap: 0.2, year: 2018 },
            { country: "Armenia", total: 99.8, male: 99.8, female: 99.7, gender_gap: 0.1, year: 2020 },
            { country: "Azerbaijan", total: 99.8, male: 99.9, female: 99.7, gender_gap: 0.2, year: 2019 },
            { country: "Bahrain", total: 97.5, male: 99.9, female: 94.9, gender_gap: 5.0, year: 2018 },
            { country: "Bangladesh", total: 74.66, male: 76.56, female: 72.82, gender_gap: 3.72, year: 2022 },
            { country: "Barbados", total: 99.6, male: 99.6, female: 99.6, gender_gap: 0.0, year: 2014 },
            { country: "Belarus", total: 99.9, male: 99.9, female: 99.9, gender_gap: 0.0, year: 2019 },
            { country: "Benin", total: 42.4, male: 54.0, female: 31.1, gender_gap: 22.9, year: 2018 },
            { country: "Bhutan", total: 66.6, male: 75.0, female: 57.1, gender_gap: 17.9, year: 2017 },
            { country: "Bolivia", total: 92.5, male: 96.5, female: 88.6, gender_gap: 7.9, year: 2015 },
            { country: "Bosnia and Herzegovina", total: 98.5, male: 99.5, female: 97.5, gender_gap: 2.0, year: 2015 },
            { country: "Botswana", total: 88.5, male: 88.0, female: 88.9, gender_gap: 0.9, year: 2015 },
            { country: "Brazil", total: 93.2, male: 93.0, female: 93.4, gender_gap: 0.4, year: 2018 },
            { country: "Brunei", total: 97.2, male: 98.1, female: 93.4, gender_gap: 4.7, year: 2018 },
            { country: "Bulgaria", total: 98.4, male: 98.7, female: 98.1, gender_gap: 0.6, year: 2015 },
            { country: "Burkina Faso", total: 39.3, male: 49.2, female: 31.0, gender_gap: 18.2, year: 2018 },
            { country: "Burundi", total: 68.4, male: 76.3, female: 61.2, gender_gap: 15.1, year: 2017 },
            { country: "Cape Verde", total: 86.8, male: 91.7, female: 82.0, gender_gap: 9.7, year: 2015 },
            { country: "Cambodia", total: 80.5, male: 86.5, female: 75.0, gender_gap: 11.5, year: 2015 },
            { country: "Cameroon", total: 77.1, male: 82.6, female: 71.6, gender_gap: 11.0, year: 2018 },
            { country: "Central African Republic", total: 37.4, male: 49.5, female: 25.8, gender_gap: 23.7, year: 2018 },
            { country: "Chad", total: 22.3, male: 31.3, female: 14.0, gender_gap: 17.3, year: 2016 },
            { country: "Chile", total: 96.3, male: 96.3, female: 96.3, gender_gap: 0.0, year: 2017 },
            { country: "China", total: 96.8, male: 98.5, female: 95.2, gender_gap: 3.3, year: 2018 },
            { country: "Colombia", total: 95.6, male: 95.4, female: 95.9, gender_gap: 0.5, year: 2020 },
            { country: "Comoros", total: 58.8, male: 64.6, female: 53.0, gender_gap: 11.6, year: 2018 },
            { country: "Congo", total: 80.3, male: 86.1, female: 74.6, gender_gap: 11.5, year: 2018 },
            { country: "DR Congo", total: 77.0, male: 88.5, female: 66.5, gender_gap: 22.0, year: 2016 },
            { country: "Costa Rica", total: 97.9, male: 97.8, female: 97.9, gender_gap: 0.1, year: 2018 },
            { country: "Ivory Coast", total: 89.9, male: 93.1, female: 86.7, gender_gap: 6.4, year: 2019 },
            { country: "Croatia", total: 99.3, male: 99.7, female: 98.9, gender_gap: 0.8, year: 2015 },
            { country: "Cuba", total: 99.8, male: 99.9, female: 99.8, gender_gap: 0.1, year: 2015 },
            { country: "Cyprus", total: 99.1, male: 99.5, female: 98.7, gender_gap: 0.8, year: 2015 },
            { country: "Czech Republic", total: 99.0, male: 99.0, female: 99.0, gender_gap: 0.0, year: 2011 },
        ];

        db.remove({}, { multi: true }, (err) => {
            if (err) return res.status(500).json({ error: "Error interno del servidor" });
            db.insert(initialData, (err, newDocs) => {
                if (err) return res.status(500).json({ error: "Error al insertar datos" });
                newDocs.forEach(d => delete d._id);
                res.status(200).json(newDocs);
            });
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

    // GET /api/v1/literacy-rates/:country (filtros year/from/to y paginación)
    app.get(BASE_URL_API_TGG + "/:country", (req, res) => {
        const countryParam = req.params.country;
        const { year, from, to, offset, limit } = req.query;

        const query = { country: countryParam };
        let skip = 0;
        let lim = 0;

        if (year) query.year = parseInt(year);
        if (from || to) {
            query.year = {};
            if (from) query.year.$gte = parseInt(from);
            if (to) query.year.$lte = parseInt(to);
        }

        if (offset) skip = parseInt(offset);
        if (limit) lim = parseInt(limit);

        db.find(query, { _id: 0 }).skip(skip).limit(lim).exec((err, docs) => {
            if (err) return res.status(500).json({ error: "Error interno del servidor" });
            res.status(200).json(docs);
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
