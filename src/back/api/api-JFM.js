import Datastore from "nedb";

export const BASE_URL_API_JFM = "/api/v1/road-fatalities";

export function loadBackendJFM(app) {
    // Inicializamos NeDB con persistencia en archivo
    const db = new Datastore({ filename: './data/road-fatalities.db', autoload: true });

    // Función auxiliar estricta para validar JSON (Requisito: devolver 400 si no tiene la estructura exacta)
    function isValidRoadFatalities(body) {
        const expectedKeys = [
            "nation", "year", "population_death_rate",
            "vehicle_death_rate", "distance_death_rate",
            "total_death", "income_level", "traffic_side"
        ];
        const bodyKeys = Object.keys(body);
        if (bodyKeys.length !== expectedKeys.length) return false;
        for (let key of expectedKeys) {
            if (!bodyKeys.includes(key)) return false;
        }
        return true;
    }

    // Ruta para la documentación 
    // Ej: // GET /api/v1/road-fatalities/docs
    app.get(BASE_URL_API_JFM + "/docs", (req, res) => {
        res.redirect("https://documenter.getpostman.com/view/52276616/2sBXigMDg4");
    });

    // GET /loadInitialData
    //Ej :  // GET /api/v1/road-fatalities/loadInitialData
    app.get(BASE_URL_API_JFM + "/loadInitialData", (req, res) => {
        db.find({}, (err, docs) => {
            if (err) return res.status(500).json({ error: "Error interno del servidor" });

            if (docs.length > 0) {
                return res.status(400).json({ error: "Bad Request: Los datos ya han sido cargados." });
            } else {
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

                db.insert(initialRoadFatalities, (err, newDocs) => {
                    if (err) return res.status(500).json({ error: "Error al insertar datos" });
                    newDocs.forEach(d => delete d._id); // Requisito: no enviar la propiedad _id autogenerada
                    res.status(200).json(newDocs);
                });
            }
        });
    });

    
    // GET colección con Paginación y Búsquedas por TODOS los campos
    // Ej: GET /api/v1/road-fatalities
    // Ej (Búsqueda): GET /api/v1/road-fatalities?income_level=high
    // Ej (Rango de años): GET /api/v1/road-fatalities?from=2013&to=2019
    // Ej (Paginación): GET /api/v1/road-fatalities?limit=5&offset=2
    app.get(BASE_URL_API_JFM, (req, res) => {
        let query = {};
        let offset = 0;
        let limit = 0;

        // Paginación
        if (req.query.offset) offset = parseInt(req.query.offset);
        if (req.query.limit) limit = parseInt(req.query.limit);

        // Búsquedas directas
        if (req.query.nation) query.nation = req.query.nation.toLowerCase();
        if (req.query.population_death_rate) query.population_death_rate = parseFloat(req.query.population_death_rate);
        if (req.query.vehicle_death_rate) query.vehicle_death_rate = req.query.vehicle_death_rate === "null" ? null : parseFloat(req.query.vehicle_death_rate);
        if (req.query.distance_death_rate) query.distance_death_rate = req.query.distance_death_rate === "null" ? null : parseFloat(req.query.distance_death_rate);
        if (req.query.total_death) query.total_death = parseInt(req.query.total_death);
        if (req.query.income_level) query.income_level = req.query.income_level.toLowerCase();
        if (req.query.traffic_side) query.traffic_side = req.query.traffic_side.toLowerCase();

        // Búsqueda por año (exacto) o por rango (from / to)
        if (req.query.from || req.query.to) {
            query.year = {};
            if (req.query.from) query.year.$gte = parseInt(req.query.from);
            if (req.query.to)   query.year.$lte = parseInt(req.query.to);
        } else if (req.query.year) {
            query.year = parseInt(req.query.year);
        }

        db.find(query, { _id: 0 }).skip(offset).limit(limit).exec((err, docs) => {
            if (err) return res.status(500).json({ error: "Error interno del servidor" });
            res.status(200).json(docs);
        });
    });


    // GET colección de un país específico con opción a filtrar por año (Devuelve Array)
    // Ej (País específico): GET /api/v1/road-fatalities/italy
    // Ej (País y rango de años): GET /api/v1/road-fatalities/italy?from=2010&to=2020
    app.get(BASE_URL_API_JFM + "/:nation", (req, res) => {
        const nationParam = req.params.nation.toLowerCase();
        
        // Empezamos la búsqueda fijando obligatoriamente el país de la URL
        let query = { nation: nationParam }; 

        // Si nos pasan parámetros de fecha en la URL (?from=2010&to=2020), los añadimos a la búsqueda
        if (req.query.from || req.query.to) {
            query.year = {};
            if (req.query.from) query.year.$gte = parseInt(req.query.from);
            if (req.query.to)   query.year.$lte = parseInt(req.query.to);
        } else if (req.query.year) {
            query.year = parseInt(req.query.year);
        }

        // Ejecutamos la búsqueda en la base de datos
        db.find(query, { _id: 0 }, (err, docs) => {
            if (err) return res.status(500).json({ error: "Error interno del servidor" });
            res.status(200).json(docs); 
        });
    });


    // GET recurso concreto (País y Año) (Devuelve Objeto)
    // Ej: GET /api/v1/road-fatalities/spain/2013
    app.get(BASE_URL_API_JFM + "/:nation/:year", (req, res) => {
        const nationParam = req.params.nation.toLowerCase();
        const yearParam = parseInt(req.params.year);

        db.findOne({ nation: nationParam, year: yearParam }, { _id: 0 }, (err, doc) => {
            if (err) return res.status(500).json({ error: "Error interno del servidor" });
            if (doc) {
                res.status(200).json(doc); // Los GET a recursos concretos deben devolver un objeto
            } else {
                res.status(404).json({ error: "Not Found: Recurso no encontrado" });
            }
        });
    });


    // POST colección 
    // Ej: POST /api/v1/road-fatalities
    app.post(BASE_URL_API_JFM, (req, res) => {
        const newData = req.body;

        // Comprobar estrictamente el formato esperado
        if (!isValidRoadFatalities(newData)) {
            return res.status(400).json({ error: "Bad Request: Estructura de JSON incorrecta o faltan campos esperados" });
        }

        // Formatear para evitar inyecciones raras
        newData.nation = newData.nation.toLowerCase();

        db.find({ nation: newData.nation, year: newData.year }, (err, docs) => {
            if (err) return res.status(500).json({ error: "Error interno del servidor" });

            if (docs.length > 0) {
                return res.status(409).json({ error: "Conflict: Ya existe un recurso para ese país y año." });
            } else {
                db.insert(newData, (err, newDoc) => {
                    if (err) return res.status(500).json({ error: "Error al guardar" });
                    res.status(201).json({ message: "Created: Recurso creado exitosamente." });
                });
            }
        });
    });


    // POST a recurso concreto (NO PERMITIDO)
    //Ej: POST /api/v1/road-fatalities/italy/2023
    app.post(BASE_URL_API_JFM + "/:nation/:year", (req, res) => {
        res.status(405).json({ error: "Method Not Allowed" });
    });


    // PUT colección (NO PERMITIDO)
    //Ej: PUT  /api/v1/road-fatalities
    app.put(BASE_URL_API_JFM, (req, res) => {
        res.status(405).json({ error: "Method Not Allowed" });
    });


    // PUT recurso concreto (Actualiza los datos)
    // Ej: PUT /api/v1/road-fatalities/spain/2013
    app.put(BASE_URL_API_JFM + "/:nation/:year", (req, res) => {
        const nationParam = req.params.nation.toLowerCase();
        const yearParam = parseInt(req.params.year);
        const body = req.body;

        if (!body) return res.status(400).json({ error: "Bad Request: Body vacío." });

        if (!isValidRoadFatalities(body)) {
            return res.status(400).json({ error: "Bad Request: Estructura de JSON incorrecta o faltan campos esperados." });
        }

        if (body.nation.toLowerCase() !== nationParam || body.year !== yearParam) {
            return res.status(400).json({ error: "Bad Request: Los identificadores de la URL no coinciden con el body." });
        }

        db.update({ nation: nationParam, year: yearParam }, body, {}, (err, numReplaced) => {
            if (err) return res.status(500).json({ error: "Error interno del servidor" });
            if (numReplaced === 0) {
                return res.status(404).json({ error: "Not Found: El recurso a actualizar no existe." });
            }
            res.status(200).json({ message: "OK: Recurso actualizado correctamente." });
        });
    });


    // DELETE a todo
    //Ej: DELETE  /api/v1/road-fatalities
    app.delete(BASE_URL_API_JFM, (req, res) => {
        db.remove({}, { multi: true }, (err, numRemoved) => {
            if (err) return res.status(500).json({ error: "Error interno del servidor" });
            res.status(200).json({ message: "OK: Todos los recursos eliminados." });
        });
    });


    // DELETE a recurso concreto    
    //Ej: DELETE  /api/v1/road-fatalities/spain/2013  (borra solo un país en un año específico)
    app.delete(BASE_URL_API_JFM + "/:nation/:year", (req, res) => {
        const nationParam = req.params.nation.toLowerCase();
        const yearParam = parseInt(req.params.year);

        db.remove({ nation: nationParam, year: yearParam }, {}, (err, numRemoved) => {
            if (err) return res.status(500).json({ error: "Error interno del servidor" });
            if (numRemoved === 0) {
                return res.status(404).json({ error: "Not Found: El recurso a borrar no existe." });
            }
            res.status(200).json({ message: "OK: Recurso eliminado correctamente." });
        });
    });
}