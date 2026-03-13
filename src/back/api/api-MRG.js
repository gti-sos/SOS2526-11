{
    const Datastore = require('nedb');

    module.exports = (app) => {
        const BASE_URL_API_MRG = "/api/v1/alcohol-consumptions-per-capita";
        
        // 1. Inicializamos NeDB (creará el archivo local de la BD) [cite: 21]
        const db = new Datastore({ filename: './data/alcohol-consumptions-per-capita.db', autoload: true });
    
        // Función auxiliar para comprobar que el JSON tiene EXACTAMENTE la estructura esperada
        function isValidAlcoholStats(body) {
            const expectedKeys = ["nation", "date_year", "alcohol_litre", "recorded_consumption", "unrecorded_consumption"];
            const bodyKeys = Object.keys(body);
            
            if (bodyKeys.length !== expectedKeys.length) return false;
            for (let key of expectedKeys) {
                if (!bodyKeys.includes(key)) return false;
            }
            return true;
        }
    
        // =========================================================
        // CARGA INICIAL DE DATOS
        // =========================================================
        app.get(BASE_URL_API_MRG + "/loadInitialData", (req, res) => {
            db.find({}, (err, docs) => {
                if (err) return res.status(500).json({ error: "Error interno del servidor" });
                
                if (docs.length > 0) {
                    return res.status(400).json({ error: "Bad Request: Los datos ya han sido cargados." }); // [cite: 175]
                } else {
                    const initialData = [
                        { nation: "Albania", date_year: 2016, alcohol_litre: 7.5, recorded_consumption: 4.4, unrecorded_consumption: 0.7 },
                        { nation: "Angola", date_year: 2016, alcohol_litre: 8.8, recorded_consumption: 4.8, unrecorded_consumption: 0.9 },
                        { nation: "Argentina", date_year: 2016, alcohol_litre: 9.8, recorded_consumption: 5.6, unrecorded_consumption: 1.0 },
                        { nation: "Armenia", date_year: 2016, alcohol_litre: 5.5, recorded_consumption: 2.9, unrecorded_consumption: 0.5 },
                        { nation: "Australia", date_year: 2016, alcohol_litre: 10.6, recorded_consumption: 6.8, unrecorded_consumption: 1.1 },
                        { nation: "Austria", date_year: 2016, alcohol_litre: 11.6, recorded_consumption: 7.2, unrecorded_consumption: 1.2 },
                        { nation: "Belgium", date_year: 2016, alcohol_litre: 12.1, recorded_consumption: 10.4, unrecorded_consumption: 1.7 },
                        { nation: "Brazil", date_year: 2016, alcohol_litre: 7.8, recorded_consumption: 6.1, unrecorded_consumption: 1.7 },
                        { nation: "Canada", date_year: 2016, alcohol_litre: 8.9, recorded_consumption: 6.9, unrecorded_consumption: 2.0 },
                        { nation: "Chile", date_year: 2016, alcohol_litre: 9.3, recorded_consumption: 7.7, unrecorded_consumption: 1.6 }
                    ];
    
                    db.insert(initialData, (err, newDocs) => {
                        if (err) return res.status(500).json({ error: "Error al insertar datos" });
                        
                        // ¡REGLA DEL PROFESOR!: Borramos el _id autogenerado por NeDB antes de enviarlo
                        newDocs.forEach(d => delete d._id); 
                        
                        res.status(200).json(newDocs); // [cite: 173]
                    });
                }
            });
        });

        
    // =========================================================
    // REDIRECCIÓN A LA DOCUMENTACIÓN DE POSTMAN
    // =========================================================
    app.get(BASE_URL_API_MRG + "/docs", (req, res) => {
        // Sustituye el enlace de abajo por tu enlace público de Postman
        res.redirect("https://documenter.getpostman.com/view/52276603/2sBXieqtK2");
        
    });
    
        // =========================================================
        // MÉTODOS SOBRE LA LISTA GENERAL (RECURSO BASE)
        // =========================================================
    
        // GET GENERAL (Con Búsqueda y Paginación) [cite: 164, 166]
        app.get(BASE_URL_API_MRG, (req, res) => {
            let query = {};
            let offset = 0;
            let limit = 0;
    
            // Implementación de búsquedas [cite: 164]
            if (req.query.nation) query.nation = req.query.nation;
            if (req.query.date_year) query.date_year = parseInt(req.query.date_year);
            if (req.query.alcohol_litre) query.alcohol_litre = parseFloat(req.query.alcohol_litre);
            if (req.query.recorded_consumption) query.recorded_consumption = parseFloat(req.query.recorded_consumption);
            if (req.query.unrecorded_consumption) query.unrecorded_consumption = parseFloat(req.query.unrecorded_consumption);
    
            // Implementación de paginación [cite: 166]
            if (req.query.offset) offset = parseInt(req.query.offset);
            if (req.query.limit) limit = parseInt(req.query.limit);
    
            // Ocultamos el _id y aplicamos skip(offset) y limit(limit)
            db.find(query, { _id: 0 }).skip(offset).limit(limit).exec((err, docs) => {
                if (err) return res.status(500).json({ error: "Error interno del servidor" });
                res.status(200).json(docs); // Los GET a colecciones devuelven un array [cite: 139-143, 173]
            });
        });
    
        // POST GENERAL
        app.post(BASE_URL_API_MRG, (req, res) => {
            const newData = req.body;
    
            if (!isValidAlcoholStats(newData)) {
                return res.status(400).json({ error: "Bad Request: Estructura de JSON incorrecta o campos faltantes" }); // [cite: 175]
            }
    
            db.find({ nation: newData.nation, date_year: newData.date_year }, (err, docs) => {
                if (err) return res.status(500).json({ error: "Error interno del servidor" });
                if (docs.length > 0) {
                    return res.status(409).json({ error: "Conflict: El recurso ya existe" }); // [cite: 180]
                } else {
                    db.insert(newData, (err, newDoc) => {
                        if (err) return res.status(500).json({ error: "Error al guardar el recurso" });
                        res.status(201).json({ message: "Created: Recurso creado exitosamente." }); // [cite: 176]
                    });
                }
            });
        });
    
        // PUT GENERAL (No permitido)
        app.put(BASE_URL_API_MRG, (req, res) => {
            res.status(405).json({ error: "Method Not Allowed: No se puede actualizar la lista completa" }); // [cite: 179]
        });
    
        // DELETE GENERAL
        app.delete(BASE_URL_API_MRG, (req, res) => {
            db.remove({}, { multi: true }, (err, numRemoved) => {
                if (err) return res.status(500).json({ error: "Error interno del servidor" });
                res.status(200).json({ message: `Se han borrado ${numRemoved} recursos.` }); // [cite: 173]
            });
        });
    
        // =========================================================
        // MÉTODOS SOBRE UN RECURSO CONCRETO
        // =========================================================
    
        // GET CONCRETO
        app.get(BASE_URL_API_MRG + "/:nation/:date_year", (req, res) => {
            const nationParam = req.params.nation;
            const yearParam = parseInt(req.params.date_year);
    
            db.findOne({ nation: nationParam, date_year: yearParam }, { _id: 0 }, (err, doc) => {
                if (err) return res.status(500).json({ error: "Error interno del servidor" });
                if (doc) {
                    res.status(200).json(doc); // Los GET a recursos concretos devuelven un objeto [cite: 173]
                } else {
                    res.status(404).json({ error: "Not Found: Recurso no encontrado" }); // [cite: 178]
                }
            });
        });
    
        // POST CONCRETO (No permitido)
        app.post(BASE_URL_API_MRG + "/:nation/:date_year", (req, res) => {
            res.status(405).json({ error: "Method Not Allowed: No se puede hacer POST a un recurso concreto" }); // [cite: 179]
        });
    
        // PUT CONCRETO
        app.put(BASE_URL_API_MRG + "/:nation/:date_year", (req, res) => {
            const nationParam = req.params.nation;
            const yearParam = parseInt(req.params.date_year);
            const body = req.body;
    
            if (nationParam !== body.nation || yearParam !== body.date_year) {
                return res.status(400).json({ error: "Bad Request: El país o año de la URL no coincide con el del body" }); // [cite: 175]
            }
    
            if (!isValidAlcoholStats(body)) {
                return res.status(400).json({ error: "Bad Request: Estructura de JSON incorrecta" }); // [cite: 175]
            }
    
            db.update({ nation: nationParam, date_year: yearParam }, body, {}, (err, numReplaced) => {
                if (err) return res.status(500).json({ error: "Error interno del servidor" });
                if (numReplaced === 0) {
                    return res.status(404).json({ error: "Not Found: Recurso no encontrado" }); // [cite: 178]
                }
                res.status(200).json({ message: "Recurso actualizado exitosamente" }); // [cite: 173]
            });
        });
    
        // DELETE CONCRETO
        app.delete(BASE_URL_API_MRG + "/:nation/:date_year", (req, res) => {
            const nationParam = req.params.nation;
            const yearParam = parseInt(req.params.date_year);
    
            db.remove({ nation: nationParam, date_year: yearParam }, {}, (err, numRemoved) => {
                if (err) return res.status(500).json({ error: "Error interno del servidor" });
                if (numRemoved === 0) {
                    return res.status(404).json({ error: "Not Found: Recurso no encontrado" }); // [cite: 178]
                }
                res.status(200).json({ message: "Recurso borrado exitosamente" }); // [cite: 173]
            });
        });
    };
}