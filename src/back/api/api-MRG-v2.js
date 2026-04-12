import Datastore from "nedb";
import jwt from "jsonwebtoken"; // 1. Importamos la librería

export const BASE_URL_API_MRG_V2 = "/api/v2/alcohol-consumptions-per-capita";

// 2. Definimos tu clave secreta
const SECRET_KEY = "contraseñaMiguel"; 

export function loadBackendMRGv2(app) {

    const db = new Datastore({ filename: './data/alcohol-consumptions-per-capita-v2.db', autoload: true });

    // --- MIDDLEWARE DE VERIFICACIÓN ---
    // Este es el "portero" que revisa el token antes de entrar a las rutas protegidas
    function verifyToken(req, res, next) {
        const authHeader = req.headers['authorization'];
        
        if (!authHeader) {
            return res.status(403).json({ error: "No se ha proporcionado un token de autenticación." });
        }

        // El formato esperado es "Bearer <TOKEN>"
        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(403).json({ error: "Formato de token incorrecto." });
        }

        jwt.verify(token, SECRET_KEY, (err, decoded) => {
            if (err) {
                return res.status(401).json({ error: "Token inválido o caducado." });
            }
            req.user = decoded;
            next(); // Si todo está bien, pasamos a la función de la API
        });
    }

    function isValidAlcoholStats(body) {
        const expectedKeys = ["nation", "date_year", "alcohol_litre", "recorded_consumption", "unrecorded_consumption"];
        const bodyKeys = Object.keys(body);
        if (bodyKeys.length !== expectedKeys.length) return false;
        for (let key of expectedKeys) {
            if (!bodyKeys.includes(key)) return false;
        }
        return true;
    }

    // --- RUTA DE LOGIN ---
    // Ruta para obtener el token. Usuario: admin / Pass: admin
    app.post(BASE_URL_API_MRG_V2 + "/login", (req, res) => {
        const { username, password } = req.body;

        if (username === "admin" && password === "admin") {
            const token = jwt.sign({ user: username }, SECRET_KEY, { expiresIn: "1h" });
            return res.status(200).json({ token: token });
        } else {
            return res.status(401).json({ error: "Usuario o contraseña incorrectos." });
        }
    });

    
    app.get(BASE_URL_API_MRG_V2 + "/docs", (req, res) => {
        res.redirect("https://documenter.getpostman.com/view/52276603/2sBXijJBwi");
    });

    // GET /api/v2/.../loadInitialData
    app.get(BASE_URL_API_MRG_V2 + "/loadInitialData", (req, res) => {
        db.find({}, (err, docs) => {
            if (err) return res.status(500).json({ error: "Error interno del servidor" });
            
            if (docs.length > 0) {
                return res.status(400).json({ error: "Bad Request: Data already exists" });
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
                    newDocs.forEach(d => delete d._id);
                    res.status(200).json(newDocs);
                });
            }
        });
    });

    // GET a toda la colección (PÚBLICO)
    app.get(BASE_URL_API_MRG_V2, (req, res) => {
        let query = {};
        let offset = 0;
        let limit = 0;

        if (req.query.nation) query.nation = req.query.nation;
        if (req.query.date_year) query.date_year = parseInt(req.query.date_year);
        if (req.query.alcohol_litre) query.alcohol_litre = parseFloat(req.query.alcohol_litre);
        if (req.query.recorded_consumption) query.recorded_consumption = parseFloat(req.query.recorded_consumption);
        if (req.query.unrecorded_consumption) query.unrecorded_consumption = parseFloat(req.query.unrecorded_consumption);

        if (req.query.offset) offset = parseInt(req.query.offset);
        if (req.query.limit) limit = parseInt(req.query.limit);

        db.find(query, { _id: 0 }).skip(offset).limit(limit).exec((err, docs) => {
            if (err) return res.status(500).json({ error: "Error interno del servidor" });
            res.status(200).json(docs);
        });
    });
    

    // GET a recurso concreto (PÚBLICO)
    app.get(BASE_URL_API_MRG_V2 + "/:nation/:date_year", (req, res) => {
        const nationParam = req.params.nation;
        const yearParam = parseInt(req.params.date_year);

        db.findOne({ nation: nationParam, date_year: yearParam }, { _id: 0 }, (err, doc) => {
            if (err) return res.status(500).json({ error: "Error interno del servidor" });
            doc ? res.status(200).json(doc) : res.status(404).json({ error: "Not Found: Recurso no encontrado" });
        });
    });

    // POST a la colección (PROTEGIDO)
    app.post(BASE_URL_API_MRG_V2, verifyToken, (req, res) => {
        const newData = req.body;

        if (!isValidAlcoholStats(newData)) {
            return res.status(400).json({ error: "Bad Request: Estructura de JSON incorrecta o faltan campos" });
        }

        db.find({ nation: newData.nation, date_year: newData.date_year }, (err, docs) => {
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

    // PUT a la colección (NO PERMITIDO)
    app.put(BASE_URL_API_MRG_V2, (req, res) => {
        res.status(405).json({ error: "Method Not Allowed: No se puede actualizar la lista completa" });
    });

    // DELETE a la colección (PROTEGIDO)
    app.delete(BASE_URL_API_MRG_V2, verifyToken, (req, res) => {
        db.remove({}, { multi: true }, (err, numRemoved) => {
            if (err) return res.status(500).json({ error: "Error interno del servidor" });
            res.status(200).json({ message: "OK: Todos los recursos han sido eliminados." });
        });
    });

    // POST a recurso concreto (NO PERMITIDO)
    app.post(BASE_URL_API_MRG_V2 + "/:nation/:date_year", (req, res) => {
        res.status(405).json({ error: "Method Not Allowed: No se puede hacer POST a un recurso concreto." });
    });

    // PUT a recurso concreto (PROTEGIDO)
    app.put(BASE_URL_API_MRG_V2 + "/:nation/:date_year", verifyToken, (req, res) => {
        const nationParam = req.params.nation;
        const yearParam = parseInt(req.params.date_year);
        const body = req.body;

        if (!body) return res.status(400).json({ error: "Bad Request: Body vacío." });

        if (nationParam !== body.nation || yearParam !== body.date_year) {
            return res.status(400).json({ error: "Bad Request: Los IDs del cuerpo no coinciden con los de la URL." });
        }

        if (!isValidAlcoholStats(body)) {
            return res.status(400).json({ error: "Bad Request: Faltan campos obligatorios o estructura incorrecta." });
        }

        db.update({ nation: nationParam, date_year: yearParam }, body, {}, (err, numReplaced) => {
            if (err) return res.status(500).json({ error: "Error interno del servidor" });
            if (numReplaced === 0) {
                return res.status(404).json({ error: "Not Found: El recurso que intentas actualizar no existe." });
            }
            res.status(200).json({ message: "OK: Recurso actualizado correctamente." });
        });
    });

    // DELETE a recurso concreto (PROTEGIDO)
    app.delete(BASE_URL_API_MRG_V2 + "/:nation/:date_year", verifyToken, (req, res) => {
        const nationParam = req.params.nation;
        const yearParam = parseInt(req.params.date_year);

        db.remove({ nation: nationParam, date_year: yearParam }, {}, (err, numRemoved) => {
            if (err) return res.status(500).json({ error: "Error interno del servidor" });
            if (numRemoved === 0) {
                return res.status(404).json({ error: "Not Found: El recurso a borrar no existe." });
            }
            res.status(200).json({ message: "OK: Recurso eliminado correctamente." });
        });
    });
}