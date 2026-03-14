import Datastore from "nedb";

export const BASE_URL_API_JFM = "/api/v1/road-fatalities";

export function loadBackendJFM(app) {
    // Inicializamos NeDB con persistencia en archivo 
    const db = new Datastore({ filename: './data/road-fatalities.db', autoload: true });

    // Función auxiliar estricta para validar JSON de JFM
    function isValidRoadFatalities(body) {
        const expectedKeys = [
            "nation", "year", "population_death_rate", "vehicle_death_rate", 
            "distance_death_rate", "total_death", "income_level", "traffic_side"
        ];
        const bodyKeys = Object.keys(body);
        if (bodyKeys.length !== expectedKeys.length) return false;
        for (let key of expectedKeys) {
            if (!bodyKeys.includes(key)) return false;
        }
        return true;
    }

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

    // GET /loadInitialData
    app.get(BASE_URL_API_JFM + "/loadInitialData", (req, res) => {
        db.find({}, (err, docs) => {
            if (err) return res.status(500).json({ error: "Error interno del servidor" });
            
            if (docs.length > 0) {
                return res.status(400).json({ error: "Bad Request: Los datos ya han sido cargados." });
            } else {
                db.insert(initialRoadFatalities, (err, newDocs) => {
                    if (err) return res.status(500).json({ error: "Error al insertar datos" });
                    newDocs.forEach(d => delete d._id); // Limpiamos el _id interno de NeDB para la respuesta
                    res.status(200).json(newDocs);
                });
            }
        });
    });

    // GET colección con filtros (nation, year, from, to) y paginación
    app.get(BASE_URL_API_JFM, (req, res) => {
        let query = {};
        
        if (req.query.nation) query.nation = { $regex: new RegExp(`^${req.query.nation}$`, "i") }; // Búsqueda case-insensitive
        if (req.query.year) query.year = parseInt(req.query.year);
        
        // Filtros from y to
        if (req.query.from || req.query.to) {
            query.year = {};
            if (req.query.from) query.year.$gte = parseInt(req.query.from);
            if (req.query.to) query.year.$lte = parseInt(req.query.to);
        }

        let offset = 0;
        let limit = 0; // 0 significa sin límite en NeDB
        if (req.query.offset) offset = parseInt(req.query.offset);
        if (req.query.limit) limit = parseInt(req.query.limit);

        db.find(query, { _id: 0 }).skip(offset).limit(limit).exec((err, docs) => {
            if (err) return res.status(500).json({ error: "Error interno del servidor" });
            res.status(200).json(docs);
        });
    });

    // GET recurso concreto (País y año)
    app.get(BASE_URL_API_JFM + "/:nation/:year", (req, res) => {
        const nationParam = req.params.nation;
        const yearParam = parseInt(req.params.year);

        db.findOne({ nation: { $regex: new RegExp(`^${nationParam}$`, "i") }, year: yearParam }, { _id: 0 }, (err, doc) => {
            if (err) return res.status(500).json({ error: "Error interno del servidor" });
            doc ? res.status(200).json(doc) : res.status(404).json({ error: "Not Found: Recurso no encontrado" });
        });
    });

    // POST colección
    app.post(BASE_URL_API_JFM, (req, res) => {
        const newData = req.body;

        if (!isValidRoadFatalities(newData)) {
            return res.status(400).json({ error: "Bad Request: Estructura de JSON incorrecta o faltan campos obligatorios" });
        }

        // Aseguramos tipos de datos correctos antes de insertar
        newData.nation = newData.nation.toLowerCase();
        newData.year = parseInt(newData.year);

        db.find({ nation: newData.nation, year: newData.year }, (err, docs) => {
            if (err) return res.status(500).json({ error: "Error interno del servidor" });
            
            if (docs.length > 0) {
                return res.status(409).json({ error: "Conflict: Ya existe un recurso para ese país y año" });
            } else {
                db.insert(newData, (err, newDoc) => {
                    if (err) return res.status(500).json({ error: "Error al guardar" });
                    res.status(201).json({ message: "Created: Recurso creado exitosamente." });
                });
            }
        });
    });

    // POST a un recurso concreto (NO PERMITIDO)
    app.post(BASE_URL_API_JFM + "/:nation/:year", (req, res) => {
        res.status(405).json({ error: "Method Not Allowed: No se puede hacer POST a un recurso concreto." });
    });

    // PUT colección (NO PERMITIDO)
    app.put(BASE_URL_API_JFM, (req, res) => {
        res.status(405).json({ error: "Method Not Allowed: No se puede actualizar la lista completa" });
    });

    // PUT a un recurso concreto
    app.put(BASE_URL_API_JFM + "/:nation/:year", (req, res) => {
        const nationParam = req.params.nation.toLowerCase();
        const yearParam = parseInt(req.params.year);
        const body = req.body;

        if (!body) return res.status(400).json({ error: "Bad Request: Body vacío." });

        if (nationParam !== body.nation.toLowerCase() || yearParam !== parseInt(body.year)) {
            return res.status(400).json({ error: "Bad Request: Los IDs del cuerpo no coinciden con los de la URL." });
        }

        if (!isValidRoadFatalities(body)) {
            return res.status(400).json({ error: "Bad Request: Faltan campos obligatorios o estructura incorrecta." });
        }

        // Aseguramos minúsculas y números antes de actualizar
        body.nation = body.nation.toLowerCase();
        body.year = parseInt(body.year);

        db.update({ nation: nationParam, year: yearParam }, body, {}, (err, numReplaced) => {
            if (err) return res.status(500).json({ error: "Error interno del servidor" });
            if (numReplaced === 0) {
                return res.status(404).json({ error: "Not Found: El recurso que intentas actualizar no existe." });
            }
            res.status(200).json({ message: "OK: Recurso actualizado correctamente." });
        });
    });

    // DELETE colección completa
    app.delete(BASE_URL_API_JFM, (req, res) => {
        db.remove({}, { multi: true }, (err, numRemoved) => {
            if (err) return res.status(500).json({ error: "Error interno del servidor" });
            res.status(200).json({ message: "OK: Todos los recursos han sido eliminados." });
        });
    });

    // DELETE recurso concreto
    app.delete(BASE_URL_API_JFM + "/:nation/:year", (req, res) => {
        const nationParam = req.params.nation;
        const yearParam = parseInt(req.params.year);

        db.remove({ nation: { $regex: new RegExp(`^${nationParam}$`, "i") }, year: yearParam }, {}, (err, numRemoved) => {
            if (err) return res.status(500).json({ error: "Error interno del servidor" });
            if (numRemoved === 0) {
                return res.status(404).json({ error: "Not Found: El recurso a borrar no existe." });
            }
            res.status(200).json({ message: "OK: Recurso eliminado correctamente." });
        });
    });
}