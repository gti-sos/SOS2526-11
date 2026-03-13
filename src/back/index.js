import express from 'express';
import path from 'path';
//import cool from 'cool-ascii-faces';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadBackendMRG } from "./api/api-MRG.js";
//import { loadBackendTGG } from './api/api-TGG.js';
import Datastore from 'nedb';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;
let BASE_URL_API = "/api/v1";
let BASE_URL_API_TGG =   BASE_URL_API + "/literacy-rates";

app.use('/', express.static('public'));

app.use(express.json());

// Sirve archivos estáticos desde la carpeta 'public' (Para about.html) https://sos2526-11.onrender.com/about.html
// Ruta /about https://sos2526-11.onrender.com/about
app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/about.html'));
});
// Tarea de Grupo: Ruta /cool https://sos2526-11.onrender.com/cool
/* {
app.get('/cool', (req, res) => {
    res.send("<html><body><h1>" + cool() + "</h1></body></html>");
});
} */

// Tarea Individual: Ruta /samples/MRG + API MRG
//Ruta /samples/MRG https://sos2526-11.onreder.com/samples/MRG
 
export default (app) => {
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



//API TGG https://sos2526-11.onrender.com/api/v1/literacy-rates

loadBackendMRG(app);
//loadBackendTGG();



// API JFM https://sos2526-11.onrender.com/api/v1/road-fatalities
{
const BASE_URL_API_JFM = "/api/v1/road-fatalities";

let roadFatalitiesStats = []; //Vacío para que loadInitialData tenga sentido

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


//loadInitialData
app.get(BASE_URL_API_JFM + "/loadInitialData", (req, res) => {
  if (roadFatalitiesStats.length > 0) {
    return res.status(400).json({ error: "Bad Request: Los datos ya han sido cargados." });
  }
  roadFatalitiesStats = [...initialRoadFatalities]; // al hacer un GET cree 10 o más datos en el array de NodeJS si está vacío.
  return res.status(200).json(roadFatalitiesStats);
});


//GET todo 
//localhost:8080/api/v1/road-fatalities https://sos2526-11.onrender.com/api/v1/road-fatalities
app.get(BASE_URL_API_JFM, (req, res) => {
    res.send(JSON.stringify(roadFatalitiesStats,null,2));
});


// GET por nación (con filtros year/from/to) Empieza filtrando por nación
// Ej: GET /api/v1/road-fatalities/italy
app.get(BASE_URL_API_JFM + "/:nation", (req, res) => {
  const { nation } = req.params;
  const { year, from, to } = req.query;

  let result = roadFatalitiesStats.filter( (d) => d.nation.toLowerCase() === nation.toLowerCase());

  if (year) result = result.filter((d) => d.year == year);
  if (from) result = result.filter((d) => d.year >= parseInt(from));
  if (to)   result = result.filter((d) => d.year <= parseInt(to));

  res.status(200).json(result); // si no hay -> []
});


// GET colección con filtros (nation, year, from, to) (Empieza filtrando por toda la colección)
// Ej:
// /api/v1/road-fatalities?nation=spain
// /api/v1/road-fatalities?year=2013
// /api/v1/road-fatalities?nation=italy&from=2010&to=2023


app.get(BASE_URL_API_JFM, (req, res) => {
  const { nation, year, from, to } = req.query;

  let result = [...roadFatalitiesStats];

  if (nation) result = result.filter(d => d.nation.toLowerCase() === nation.toLowerCase());
  if (year)   result = result.filter(d => d.year == year);
  if (from)   result = result.filter(d => d.year >= parseInt(from));
  if (to)     result = result.filter(d => d.year <= parseInt(to));

  res.status(200).json(result); // si no hay datos → devuelve []
});


// GET recurso concreto (Pais y año)
// Ej: GET /api/v1/road-fatalities/spain/2013
app.get(BASE_URL_API_JFM + "/:nation/:year", (req, res) => {

  const { nation, year } = req.params;

  const resource = roadFatalitiesStats.find(
    d => d.nation.toLowerCase() === nation.toLowerCase() && d.year == year
  );

  if (resource) {
    res.status(200).json(resource);
  } else {
    res.sendStatus(404);
  }

});


// POST colección 
// Ej: POST /api/v1/road-fatalities
app.post(BASE_URL_API_JFM, (req, res) => {
  const data = req.body;

  // Obligatorios (como mínimo)
  if (!data.nation || data.year === undefined || data.population_death_rate === undefined ||
      data.vehicle_death_rate === undefined || data.total_death === undefined ||
      !data.income_level || !data.traffic_side) {
    return res.status(400).json({ error: "Bad Request: Faltan campos obligatorios." });
  }

  const exists = roadFatalitiesStats.some(d => d.nation.toLowerCase() === String(data.nation).toLowerCase() && d.year == data.year);
  if (exists) {
    return res.status(409).json({ error: "Conflict: Ese recurso ya existe." });
  }

  roadFatalitiesStats.push({
  nation:                 String(data.nation).toLowerCase(),
  year:                   Number(data.year),
  population_death_rate:  Number(data.population_death_rate),
  vehicle_death_rate:     (data.vehicle_death_rate === null ? null : Number(data.vehicle_death_rate)),
  distance_death_rate:    (data.distance_death_rate === null || data.distance_death_rate === undefined)
                            ? null
                            : Number(data.distance_death_rate),
  total_death:            Number(data.total_death),
  income_level:           String(data.income_level),
  traffic_side:           String(data.traffic_side)
});

  return res.sendStatus(201);
});


// POST (a un recurso concreto (NO PERMITIDO))
//Ej: POST /api/v1/road-fatalities/italy/2023
app.post(BASE_URL_API_JFM + "/:nation/:year", (req, res) => res.sendStatus(405));


// PUT (coleccion (NO PERMITIDO))
//Ej: PUT  /api/v1/road-fatalities
app.put(BASE_URL_API_JFM, (req, res) => res.sendStatus(405));


// PUT (a un recurso concreto (Actualiza los datos))
// Ej: PUT /api/v1/road-fatalities/spain/2013
app.put(BASE_URL_API_JFM + "/:nation/:year", (req, res) => {
  const { nation, year } = req.params;
  const data = req.body;

  // Error 400: Falta el JSON correcto o faltan campos obligatorios
  if (!data.nation || 
      data.year === undefined || 
      data.population_death_rate === undefined ||
      data.vehicle_death_rate === undefined || 
      data.total_death === undefined ||
      !data.income_level || 
      !data.traffic_side) {
    return res.status(400).json({ error: "Bad Request: JSON inválido o faltan campos esperados." });
  }

  // Error 400: El ID del body no coincide con el de la URL
  if (data.nation.toLowerCase() !== nation.toLowerCase() || String(data.year) !== String(year)) {
    return res.status(400).json({ error: "Bad Request: Los identificadores de la URL no coinciden con el body." });
  }

  const index = roadFatalitiesStats.findIndex(
    d => d.nation.toLowerCase() === nation.toLowerCase() && d.year == year
  );

  // Error 404: El recurso no existe
  if (index === -1) {
    return res.sendStatus(404);
  }

  // Éxito 200: Actualización correcta (Sobreescribiendo el índice)
  roadFatalitiesStats[index] = {
    nation:                 String(data.nation).toLowerCase(),
    year:                   Number(data.year),
    population_death_rate:  Number(data.population_death_rate),
    vehicle_death_rate:     (data.vehicle_death_rate === null ? null : Number(data.vehicle_death_rate)),
    distance_death_rate:    (data.distance_death_rate === null || data.distance_death_rate === undefined)
                              ? null
                              : Number(data.distance_death_rate),
    total_death:            Number(data.total_death),
    income_level:           String(data.income_level),
    traffic_side:           String(data.traffic_side)
  };

  return res.sendStatus(200);
});


// DELETE (a todo)
//Ej: DELETE  /api/v1/road-fatalities
app.delete(BASE_URL_API_JFM, (req, res) => {
    roadFatalitiesStats = [];
    res.sendStatus(200);
});


// DELETE (a un recurso concreto, borra solo un país en un año específico)
//Ej: DELETE  /api/v1/road-fatalities/spain/2013
app.delete(BASE_URL_API_JFM + "/:nation/:year", (req, res) => {
  const { nation, year } = req.params;

  const initialLength = roadFatalitiesStats.length;
  roadFatalitiesStats = roadFatalitiesStats.filter(
    d => !(d.nation.toLowerCase() === nation.toLowerCase() && d.year == year));

  // Si no ha cambiado el tamaño, el recurso no existía
  if (roadFatalitiesStats.length === initialLength) {
    return res.sendStatus(404);
  }

  // Si se ha borrado correctamente
  return res.sendStatus(200);
});


}

//ruta de acceso al servidort localhost:8080
app.listen(port, () => {
    console.log(`Servidor funcionando en el puerto ${port}`);
});
