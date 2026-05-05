import { dbRoadFatalities as db } from "./db.js";

export const BASE_URL_API_JFM_V2 = "/api/v2/road-fatalities";

export function loadBackendJFMv2(app) {

    // Función auxiliar de validación 
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
    // Ej: GET /api/v2/road-fatalities/docs
    app.get(BASE_URL_API_JFM_V2 + "/docs", (req, res) => {
        res.redirect("https://documenter.getpostman.com/view/52276616/2sBXijJC24");
    });


    // GET loadInitialData
    // Ej: GET /api/v2/road-fatalities/loadInitialData
    app.get(BASE_URL_API_JFM_V2 + "/loadInitialData", (req, res) => {
        db.find({}, (err, docs) => {
            if (err) return res.status(500).json({ error: "Error interno del servidor" });

            if (docs.length > 0) {
                return res.status(400).json({ error: "Bad Request: Los datos de la v2 ya han sido cargados." });
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
                    { nation: "italy", year: 2023, population_death_rate: 5.2, vehicle_death_rate: null, distance_death_rate: null, total_death: 3039, income_level: "high", traffic_side: "right" },
                    { nation: "afganistan", year: 2013, population_death_rate: 15.5, vehicle_death_rate: 722.4, distance_death_rate: null, total_death: 4734, income_level: "low", traffic_side: "right" },
                    { nation: "albania", year: 2013, population_death_rate: 15.1, vehicle_death_rate: 107.2, distance_death_rate: null, total_death: 478, income_level: "middle", traffic_side: "right" },
                    { nation: "alemania", year: 2013, population_death_rate: 4.3, vehicle_death_rate: 6.8, distance_death_rate: 4.9, total_death: 3540, income_level: "high", traffic_side: "right" },
                    { nation: "argelia", year: 2013, population_death_rate: 23.8, vehicle_death_rate: 127.8, distance_death_rate: null, total_death: 9337, income_level: "middle", traffic_side: "right" },
                    { nation: "andorra", year: 2013, population_death_rate: 7.6, vehicle_death_rate: 7.9, distance_death_rate: null, total_death: 6, income_level: "high", traffic_side: "right" },
                    { nation: "angola", year: 2013, population_death_rate: 26.9, vehicle_death_rate: 992, distance_death_rate: null, total_death: 5769, income_level: "middle", traffic_side: "right" },
                    { nation: "antigua y barbuda", year: 2013, population_death_rate: 6.7, vehicle_death_rate: 20, distance_death_rate: null, total_death: 6, income_level: "high", traffic_side: "left" },
                    { nation: "arabia saudita", year: 2013, population_death_rate: 27.4, vehicle_death_rate: 119.7, distance_death_rate: null, total_death: 7898, income_level: "high", traffic_side: "right" },
                    { nation: "argentina", year: 2013, population_death_rate: 13.6, vehicle_death_rate: 24.3, distance_death_rate: null, total_death: 5619, income_level: "middle", traffic_side: "right" },
                    { nation: "armenia", year: 2013, population_death_rate: 18.3, vehicle_death_rate: 18.2, distance_death_rate: null, total_death: 546, income_level: "middle", traffic_side: "right" },
                    { nation: "australia", year: 2013, population_death_rate: 5.4, vehicle_death_rate: 7.3, distance_death_rate: 5.2, total_death: 1252, income_level: "high", traffic_side: "left" },
                    { nation: "austria", year: 2013, population_death_rate: 5.4, vehicle_death_rate: 7.1, distance_death_rate: 5.8, total_death: 455, income_level: "high", traffic_side: "right" },
                    { nation: "azerbaiyan", year: 2013, population_death_rate: 10, vehicle_death_rate: 83, distance_death_rate: null, total_death: 943, income_level: "middle", traffic_side: "right" },
                    { nation: "bahamas", year: 2013, population_death_rate: 13.8, vehicle_death_rate: 36, distance_death_rate: null, total_death: 52, income_level: "high", traffic_side: "left" },
                    { nation: "barein", year: 2013, population_death_rate: 8, vehicle_death_rate: 19.6, distance_death_rate: null, total_death: 107, income_level: "high", traffic_side: "right" },
                    { nation: "banglades", year: 2013, population_death_rate: 13.6, vehicle_death_rate: 1020.6, distance_death_rate: null, total_death: 21316, income_level: "low", traffic_side: "left" },
                    { nation: "barbados", year: 2013, population_death_rate: 6.7, vehicle_death_rate: 16.9, distance_death_rate: null, total_death: 19, income_level: "high", traffic_side: "left" },
                    { nation: "bielorrusia", year: 2013, population_death_rate: 13.7, vehicle_death_rate: 32.9, distance_death_rate: null, total_death: 1282, income_level: "middle", traffic_side: "right" },
                    { nation: "belgica", year: 2013, population_death_rate: 6.7, vehicle_death_rate: 10.7, distance_death_rate: 7.3, total_death: 746, income_level: "high", traffic_side: "right" },
                    { nation: "belice", year: 2013, population_death_rate: 24.4, vehicle_death_rate: 26, distance_death_rate: null, total_death: 81, income_level: "middle", traffic_side: "right" },
                    { nation: "benin", year: 2013, population_death_rate: 27.7, vehicle_death_rate: 8177.2, distance_death_rate: null, total_death: 2855, income_level: "low", traffic_side: "right" },
                    { nation: "birmania", year: 2013, population_death_rate: 20.3, vehicle_death_rate: 250.8, distance_death_rate: null, total_death: 10809, income_level: "low", traffic_side: "right" },
                    { nation: "butan", year: 2013, population_death_rate: 15.1, vehicle_death_rate: 167.2, distance_death_rate: null, total_death: 114, income_level: "middle", traffic_side: "left" },
                    { nation: "bolivia", year: 2013, population_death_rate: 23.2, vehicle_death_rate: 205.2, distance_death_rate: null, total_death: 3476, income_level: "middle", traffic_side: "right" },
                    { nation: "bosnia y herzegovina", year: 2013, population_death_rate: 17.7, vehicle_death_rate: 76.7, distance_death_rate: null, total_death: 676, income_level: "middle", traffic_side: "right" },
                    { nation: "botsuana", year: 2013, population_death_rate: 23.6, vehicle_death_rate: 91.6, distance_death_rate: null, total_death: 477, income_level: "middle", traffic_side: "left" },
                    { nation: "brasil", year: 2013, population_death_rate: 23.4, vehicle_death_rate: 57.5, distance_death_rate: null, total_death: 46935, income_level: "middle", traffic_side: "right" },
                    { nation: "bulgaria", year: 2013, population_death_rate: 8.3, vehicle_death_rate: 17.2, distance_death_rate: null, total_death: 601, income_level: "middle", traffic_side: "right" },
                    { nation: "burkina faso", year: 2013, population_death_rate: 30, vehicle_death_rate: 328.1, distance_death_rate: null, total_death: 5072, income_level: "low", traffic_side: "right" },
                    { nation: "camboya", year: 2013, population_death_rate: 17.4, vehicle_death_rate: 107.2, distance_death_rate: null, total_death: 2635, income_level: "low", traffic_side: "right" },
                    { nation: "camerun", year: 2013, population_death_rate: 27.6, vehicle_death_rate: 1385.1, distance_death_rate: null, total_death: 6136, income_level: "middle", traffic_side: "right" },
                    { nation: "canada", year: 2013, population_death_rate: 6, vehicle_death_rate: 9.5, distance_death_rate: 6.2, total_death: 2114, income_level: "high", traffic_side: "right" },
                    { nation: "cabo verde", year: 2013, population_death_rate: 26.1, vehicle_death_rate: 229, distance_death_rate: null, total_death: 130, income_level: "middle", traffic_side: "right" },
                    { nation: "catar", year: 2013, population_death_rate: 15.2, vehicle_death_rate: 50.9, distance_death_rate: null, total_death: 330, income_level: "high", traffic_side: "right" },
                    { nation: "republica centroafricana", year: 2013, population_death_rate: 32.4, vehicle_death_rate: 4336.5, distance_death_rate: null, total_death: 1495, income_level: "low", traffic_side: "right" },
                    { nation: "chad", year: 2013, population_death_rate: 24.1, vehicle_death_rate: 497, distance_death_rate: null, total_death: 3089, income_level: "low", traffic_side: "right" },
                    { nation: "chile", year: 2013, population_death_rate: 12.4, vehicle_death_rate: 51.1, distance_death_rate: null, total_death: 2179, income_level: "high", traffic_side: "right" },
                    { nation: "china", year: 2013, population_death_rate: 18.8, vehicle_death_rate: 104.5, distance_death_rate: null, total_death: 261367, income_level: "middle", traffic_side: "right" },
                    { nation: "colombia", year: 2013, population_death_rate: 16.8, vehicle_death_rate: 83.3, distance_death_rate: null, total_death: 8107, income_level: "middle", traffic_side: "right" },
                    { nation: "congo", year: 2013, population_death_rate: 26.4, vehicle_death_rate: 1063, distance_death_rate: null, total_death: 1174, income_level: "middle", traffic_side: "right" },
                    { nation: "islas cooks", year: 2013, population_death_rate: 24.2, vehicle_death_rate: 40.2, distance_death_rate: null, total_death: 5, income_level: "middle", traffic_side: "left" },
                    { nation: "corea del sur", year: 2014, population_death_rate: 9.3, vehicle_death_rate: 20.6, distance_death_rate: 15.6, total_death: 4777, income_level: "high", traffic_side: "right" },
                    { nation: "costa de marfil", year: 2013, population_death_rate: 24.2, vehicle_death_rate: 828.9, distance_death_rate: null, total_death: 4924, income_level: "middle", traffic_side: "right" },
                    { nation: "costa rica", year: 2013, population_death_rate: 13.9, vehicle_death_rate: 38.4, distance_death_rate: null, total_death: 676, income_level: "middle", traffic_side: "right" },
                    { nation: "croacia", year: 2013, population_death_rate: 9.2, vehicle_death_rate: 21.1, distance_death_rate: null, total_death: 395, income_level: "high", traffic_side: "right" },
                    { nation: "cuba", year: 2013, population_death_rate: 7.5, vehicle_death_rate: 133.7, distance_death_rate: null, total_death: 840, income_level: "middle", traffic_side: "right" },
                    { nation: "chipre", year: 2013, population_death_rate: 5.2, vehicle_death_rate: 9.2, distance_death_rate: null, total_death: 59, income_level: "high", traffic_side: "left" },
                    { nation: "republica checa", year: 2013, population_death_rate: 6.1, vehicle_death_rate: 8.5, distance_death_rate: 13.9, total_death: 654, income_level: "high", traffic_side: "right" },
                    { nation: "republica democratica del congo", year: 2013, population_death_rate: 33.2, vehicle_death_rate: 6405.4, distance_death_rate: null, total_death: 22419, income_level: "low", traffic_side: "right" },
                    { nation: "dinamarca", year: 2013, population_death_rate: 3.5, vehicle_death_rate: 6.7, distance_death_rate: 4, total_death: 196, income_level: "high", traffic_side: "right" },
                    { nation: "dominica", year: 2013, population_death_rate: 15.3, vehicle_death_rate: 44.7, distance_death_rate: null, total_death: 11, income_level: "middle", traffic_side: "left" },
                    { nation: "republica dominicana", year: 2013, population_death_rate: 29.3, vehicle_death_rate: 94.9, distance_death_rate: null, total_death: 3052, income_level: "middle", traffic_side: "right" },
                    { nation: "ecuador", year: 2013, population_death_rate: 20.1, vehicle_death_rate: 183.8, distance_death_rate: null, total_death: 3164, income_level: "middle", traffic_side: "right" },
                    { nation: "egipto", year: 2013, population_death_rate: 12.8, vehicle_death_rate: 148.7, distance_death_rate: null, total_death: 10466, income_level: "middle", traffic_side: "right" },
                    { nation: "el salvador", year: 2013, population_death_rate: 21.1, vehicle_death_rate: 163.7, distance_death_rate: null, total_death: 1339, income_level: "middle", traffic_side: "right" },
                    { nation: "emiratos arabes unidos", year: 2013, population_death_rate: 10.9, vehicle_death_rate: 38.2, distance_death_rate: null, total_death: 1021, income_level: "high", traffic_side: "right" },
                    { nation: "eritrea", year: 2013, population_death_rate: 24.1, vehicle_death_rate: 2171.5, distance_death_rate: null, total_death: 1527, income_level: "low", traffic_side: "right" },
                    { nation: "eslovaquia", year: 2013, population_death_rate: 6.6, vehicle_death_rate: 13.7, distance_death_rate: null, total_death: 360, income_level: "high", traffic_side: "right" },
                    { nation: "eslovenia", year: 2013, population_death_rate: 6.4, vehicle_death_rate: 9.5, distance_death_rate: 7.6, total_death: 132, income_level: "high", traffic_side: "right" },
                    { nation: "espana", year: 2013, population_death_rate: 3.7, vehicle_death_rate: 5.3, distance_death_rate: 7.8, total_death: 1730, income_level: "high", traffic_side: "right" },
                    { nation: "estados unidos", year: 2013, population_death_rate: 10.6, vehicle_death_rate: 12.9, distance_death_rate: 7.1, total_death: 34064, income_level: "high", traffic_side: "right" },
                    { nation: "estonia", year: 2013, population_death_rate: 7, vehicle_death_rate: 11.8, distance_death_rate: null, total_death: 90, income_level: "high", traffic_side: "right" },
                    { nation: "etiopia", year: 2013, population_death_rate: 25.3, vehicle_death_rate: 4984.3, distance_death_rate: null, total_death: 23837, income_level: "low", traffic_side: "right" },
                    { nation: "filipinas", year: 2013, population_death_rate: 10.5, vehicle_death_rate: 135, distance_death_rate: null, total_death: 10379, income_level: "middle", traffic_side: "right" },
                    { nation: "finlandia", year: 2013, population_death_rate: 4.8, vehicle_death_rate: 4.4, distance_death_rate: 4.8, total_death: 258, income_level: "high", traffic_side: "right" },
                    { nation: "francia", year: 2013, population_death_rate: 5.1, vehicle_death_rate: 7.6, distance_death_rate: 5.8, total_death: 3268, income_level: "high", traffic_side: "right" },
                    { nation: "fiyi", year: 2013, population_death_rate: 5.8, vehicle_death_rate: 58.9, distance_death_rate: null, total_death: 51, income_level: "middle", traffic_side: "left" },
                    { nation: "gabon", year: 2013, population_death_rate: 22.9, vehicle_death_rate: 196.4, distance_death_rate: null, total_death: 383, income_level: "middle", traffic_side: "right" },
                    { nation: "gambia", year: 2013, population_death_rate: 29.4, vehicle_death_rate: 998.7, distance_death_rate: null, total_death: 544, income_level: "low", traffic_side: "right" },
                    { nation: "georgia", year: 2013, population_death_rate: 11.8, vehicle_death_rate: 54, distance_death_rate: null, total_death: 514, income_level: "middle", traffic_side: "right" },
                    { nation: "ghana", year: 2013, population_death_rate: 26.2, vehicle_death_rate: 443.1, distance_death_rate: null, total_death: 6789, income_level: "middle", traffic_side: "right" },
                    { nation: "grecia", year: 2013, population_death_rate: 9.1, vehicle_death_rate: 12.6, distance_death_rate: null, total_death: 1013, income_level: "high", traffic_side: "right" },
                    { nation: "guatemala", year: 2013, population_death_rate: 19, vehicle_death_rate: 114.7, distance_death_rate: null, total_death: 2939, income_level: "middle", traffic_side: "right" },
                    { nation: "guinea", year: 2013, population_death_rate: 27.3, vehicle_death_rate: 9462.5, distance_death_rate: null, total_death: 3211, income_level: "low", traffic_side: "right" },
                    { nation: "guinea-bisau", year: 2013, population_death_rate: 27.5, vehicle_death_rate: 751.9, distance_death_rate: null, total_death: 468, income_level: "low", traffic_side: "right" },
                    { nation: "guyana", year: 2013, population_death_rate: 17.3, vehicle_death_rate: 864.4, distance_death_rate: null, total_death: 138, income_level: "middle", traffic_side: "left" },
                    { nation: "honduras", year: 2013, population_death_rate: 17.4, vehicle_death_rate: 1021.7, distance_death_rate: null, total_death: 1408, income_level: "middle", traffic_side: "right" },
                    { nation: "hungria", year: 2013, population_death_rate: 7.7, vehicle_death_rate: 20.7, distance_death_rate: null, total_death: 765, income_level: "middle", traffic_side: "right" },
                    { nation: "islandia", year: 2013, population_death_rate: 4.6, vehicle_death_rate: 6.1, distance_death_rate: 4.7, total_death: 15, income_level: "high", traffic_side: "right" },
                    { nation: "india", year: 2013, population_death_rate: 16.6, vehicle_death_rate: 130.1, distance_death_rate: null, total_death: 238562, income_level: "middle", traffic_side: "left" },
                    { nation: "indonesia", year: 2013, population_death_rate: 15.3, vehicle_death_rate: 36.7, distance_death_rate: null, total_death: 38279, income_level: "middle", traffic_side: "left" },
                    { nation: "iran", year: 2013, population_death_rate: 32.1, vehicle_death_rate: 92.7, distance_death_rate: null, total_death: 24896, income_level: "middle", traffic_side: "right" },
                    { nation: "irak", year: 2013, population_death_rate: 20.2, vehicle_death_rate: 151.2, distance_death_rate: null, total_death: 6826, income_level: "middle", traffic_side: "right" },
                    { nation: "irlanda", year: 2013, population_death_rate: 4.1, vehicle_death_rate: 7.6, distance_death_rate: 3.9, total_death: 188, income_level: "high", traffic_side: "left" },
                    { nation: "israel", year: 2013, population_death_rate: 3.6, vehicle_death_rate: 9.7, distance_death_rate: 5.3, total_death: 277, income_level: "high", traffic_side: "right" },
                    { nation: "italia", year: 2013, population_death_rate: 6.1, vehicle_death_rate: 7.3, distance_death_rate: null, total_death: 3753, income_level: "high", traffic_side: "right" },
                    { nation: "jamaica", year: 2013, population_death_rate: 11.5, vehicle_death_rate: 61.7, distance_death_rate: null, total_death: 320, income_level: "middle", traffic_side: "left" },
                    { nation: "japon", year: 2013, population_death_rate: 4.7, vehicle_death_rate: 6.5, distance_death_rate: 8, total_death: 5971, income_level: "high", traffic_side: "left" },
                    { nation: "jordania", year: 2013, population_death_rate: 26.3, vehicle_death_rate: 151.4, distance_death_rate: null, total_death: 1913, income_level: "middle", traffic_side: "right" },
                    { nation: "kazajistan", year: 2013, population_death_rate: 24.2, vehicle_death_rate: 101.4, distance_death_rate: null, total_death: 3983, income_level: "middle", traffic_side: "right" },
                    { nation: "kenia", year: 2013, population_death_rate: 29.1, vehicle_death_rate: 640.7, distance_death_rate: null, total_death: 12891, income_level: "low", traffic_side: "left" },
                    { nation: "kiribati", year: 2013, population_death_rate: 2.9, vehicle_death_rate: 86.9, distance_death_rate: null, total_death: 3, income_level: "middle", traffic_side: "left" },
                    { nation: "kuwait", year: 2013, population_death_rate: 18.7, vehicle_death_rate: 34.2, distance_death_rate: null, total_death: 629, income_level: "high", traffic_side: "right" },
                    { nation: "kirguistan", year: 2013, population_death_rate: 22, vehicle_death_rate: 127.3, distance_death_rate: null, total_death: 1220, income_level: "middle", traffic_side: "right" },
                    { nation: "laos", year: 2013, population_death_rate: 14.3, vehicle_death_rate: 67.5, distance_death_rate: null, total_death: 971, income_level: "middle", traffic_side: "right" },
                    { nation: "letonia", year: 2013, population_death_rate: 10, vehicle_death_rate: 24.8, distance_death_rate: null, total_death: 205, income_level: "high", traffic_side: "right" },
                    { nation: "libano", year: 2013, population_death_rate: 22.6, vehicle_death_rate: 64.8, distance_death_rate: null, total_death: 1088, income_level: "middle", traffic_side: "right" },
                    { nation: "lesoto", year: 2013, population_death_rate: 28.2, vehicle_death_rate: 474.8, distance_death_rate: null, total_death: 584, income_level: "middle", traffic_side: "left" },
                    { nation: "liberia", year: 2013, population_death_rate: 33.7, vehicle_death_rate: 133.4, distance_death_rate: null, total_death: 1448, income_level: "low", traffic_side: "right" },
                    { nation: "libia", year: 2013, population_death_rate: 73.4, vehicle_death_rate: 128.2, distance_death_rate: null, total_death: 4554, income_level: "middle", traffic_side: "right" },
                    { nation: "lituania", year: 2013, population_death_rate: 10.6, vehicle_death_rate: 16.1, distance_death_rate: null, total_death: 320, income_level: "high", traffic_side: "right" },
                    { nation: "luxemburgo", year: 2013, population_death_rate: 8.7, vehicle_death_rate: 10.7, distance_death_rate: null, total_death: 46, income_level: "high", traffic_side: "right" },
                    { nation: "macedonia", year: 2013, population_death_rate: 9.4, vehicle_death_rate: 49.1, distance_death_rate: null, total_death: 198, income_level: "middle", traffic_side: "right" },
                    { nation: "madagascar", year: 2013, population_death_rate: 28.4, vehicle_death_rate: 2963, distance_death_rate: null, total_death: 6506, income_level: "low", traffic_side: "right" },
                    { nation: "malaui", year: 2013, population_death_rate: 35, vehicle_death_rate: 1310.4, distance_death_rate: null, total_death: 5732, income_level: "low", traffic_side: "left" },
                    { nation: "malasia", year: 2013, population_death_rate: 24, vehicle_death_rate: 29.9, distance_death_rate: 12.6, total_death: 7129, income_level: "middle", traffic_side: "left" },
                    { nation: "maldivas", year: 2013, population_death_rate: 3.5, vehicle_death_rate: 19.5, distance_death_rate: null, total_death: 12, income_level: "middle", traffic_side: "left" },
                    { nation: "mali", year: 2013, population_death_rate: 25.6, vehicle_death_rate: 1352.5, distance_death_rate: null, total_death: 3920, income_level: "low", traffic_side: "right" },
                    { nation: "malta", year: 2013, population_death_rate: 5.1, vehicle_death_rate: 6.8, distance_death_rate: null, total_death: 22, income_level: "high", traffic_side: "left" },
                    { nation: "marruecos", year: 2013, population_death_rate: 18, vehicle_death_rate: 209, distance_death_rate: null, total_death: 6870, income_level: "middle", traffic_side: "right" },
                    { nation: "islas marshall", year: 2013, population_death_rate: 5.7, vehicle_death_rate: 141.8, distance_death_rate: null, total_death: 3, income_level: "middle", traffic_side: "right" },
                    { nation: "mauritania", year: 2013, population_death_rate: 24.5, vehicle_death_rate: 228.7, distance_death_rate: null, total_death: 952, income_level: "middle", traffic_side: "right" },
                    { nation: "mauricio", year: 2013, population_death_rate: 12.2, vehicle_death_rate: 35.6, distance_death_rate: null, total_death: 158, income_level: "middle", traffic_side: "left" },
                    { nation: "mexico", year: 2019, population_death_rate: 5.7, vehicle_death_rate: 14.2, distance_death_rate: null, total_death: 4125, income_level: "middle", traffic_side: "right" },
                    { nation: "micronesia", year: 2013, population_death_rate: 1.9, vehicle_death_rate: 24, distance_death_rate: null, total_death: 2, income_level: "middle", traffic_side: "right" },
                    { nation: "moldavia", year: 2013, population_death_rate: 12.5, vehicle_death_rate: 61.8, distance_death_rate: null, total_death: 437, income_level: "middle", traffic_side: "right" },
                    { nation: "monaco", year: 2013, population_death_rate: 0, vehicle_death_rate: null, distance_death_rate: null, total_death: 0, income_level: "high", traffic_side: "right" },
                    { nation: "mongolia", year: 2013, population_death_rate: 21, vehicle_death_rate: 88.4, distance_death_rate: null, total_death: 597, income_level: "middle", traffic_side: "right" },
                    { nation: "montenegro", year: 2016, population_death_rate: 10.5, vehicle_death_rate: 31.1, distance_death_rate: null, total_death: 65, income_level: "middle", traffic_side: "right" },
                    { nation: "mozambique", year: 2013, population_death_rate: 31.6, vehicle_death_rate: 1507, distance_death_rate: null, total_death: 8173, income_level: "low", traffic_side: "left" },
                    { nation: "namibia", year: 2013, population_death_rate: 23.9, vehicle_death_rate: 196.4, distance_death_rate: null, total_death: 551, income_level: "middle", traffic_side: "left" },
                    { nation: "nepal", year: 2013, population_death_rate: 17, vehicle_death_rate: 399.8, distance_death_rate: null, total_death: 4713, income_level: "low", traffic_side: "left" },
                    { nation: "nicaragua", year: 2013, population_death_rate: 15.3, vehicle_death_rate: 164.3, distance_death_rate: null, total_death: 931, income_level: "middle", traffic_side: "right" },
                    { nation: "niger", year: 2013, population_death_rate: 26.4, vehicle_death_rate: 1491.1, distance_death_rate: null, total_death: 4706, income_level: "low", traffic_side: "right" },
                    { nation: "nigeria", year: 2013, population_death_rate: 20.5, vehicle_death_rate: 615.4, distance_death_rate: null, total_death: 35621, income_level: "middle", traffic_side: "right" },
                    { nation: "noruega", year: 2017, population_death_rate: 2.2, vehicle_death_rate: 3.1, distance_death_rate: null, total_death: 112, income_level: "high", traffic_side: "right" },
                    { nation: "nueva zelanda", year: 2017, population_death_rate: 8.5, vehicle_death_rate: 12.2, distance_death_rate: 8.7, total_death: 398, income_level: "high", traffic_side: "left" },
                    { nation: "oman", year: 2013, population_death_rate: 25.4, vehicle_death_rate: 85.3, distance_death_rate: null, total_death: 924, income_level: "high", traffic_side: "right" },
                    { nation: "paises bajos", year: 2013, population_death_rate: 3.4, vehicle_death_rate: 6, distance_death_rate: 4.5, total_death: 574, income_level: "high", traffic_side: "right" },
                    { nation: "pakistan", year: 2013, population_death_rate: 14.2, vehicle_death_rate: 283.9, distance_death_rate: null, total_death: 25781, income_level: "middle", traffic_side: "left" },
                    { nation: "palaos", year: 2013, population_death_rate: 4.8, vehicle_death_rate: 14.1, distance_death_rate: null, total_death: 1, income_level: "middle", traffic_side: "right" },
                    { nation: "panama", year: 2013, population_death_rate: 10, vehicle_death_rate: 38.4, distance_death_rate: null, total_death: 386, income_level: "middle", traffic_side: "right" },
                    { nation: "papua nueva guinea", year: 2013, population_death_rate: 16.8, vehicle_death_rate: 1306.5, distance_death_rate: null, total_death: 1232, income_level: "middle", traffic_side: "left" },
                    { nation: "paraguay", year: 2013, population_death_rate: 20.7, vehicle_death_rate: 114.7, distance_death_rate: null, total_death: 1408, income_level: "middle", traffic_side: "right" },
                    { nation: "peru", year: 2013, population_death_rate: 13.9, vehicle_death_rate: 99.3, distance_death_rate: null, total_death: 4234, income_level: "middle", traffic_side: "right" },
                    { nation: "polonia", year: 2013, population_death_rate: 10.3, vehicle_death_rate: 15.8, distance_death_rate: null, total_death: 3931, income_level: "high", traffic_side: "right" },
                    { nation: "portugal", year: 2013, population_death_rate: 7.8, vehicle_death_rate: 13.7, distance_death_rate: null, total_death: 828, income_level: "high", traffic_side: "right" },
                    { nation: "reino unido", year: 2013, population_death_rate: 2.9, vehicle_death_rate: 5.1, distance_death_rate: 3.6, total_death: 1827, income_level: "high", traffic_side: "left" },
                    { nation: "rumania", year: 2013, population_death_rate: 8.7, vehicle_death_rate: 31.4, distance_death_rate: null, total_death: 1881, income_level: "middle", traffic_side: "right" },
                    { nation: "rusia", year: 2013, population_death_rate: 18.9, vehicle_death_rate: 53.4, distance_death_rate: null, total_death: 27025, income_level: "high", traffic_side: "right" },
                    { nation: "ruanda", year: 2013, population_death_rate: 32.1, vehicle_death_rate: 3521.1, distance_death_rate: null, total_death: 3782, income_level: "low", traffic_side: "right" },
                    { nation: "santa lucia", year: 2013, population_death_rate: 18.1, vehicle_death_rate: 2103.3, distance_death_rate: null, total_death: 33, income_level: "middle", traffic_side: "left" },
                    { nation: "san vincente y las granadinas", year: 2013, population_death_rate: 8.2, vehicle_death_rate: 31.7, distance_death_rate: null, total_death: 9, income_level: "middle", traffic_side: "left" },
                    { nation: "samoa", year: 2013, population_death_rate: 15.8, vehicle_death_rate: 171.9, distance_death_rate: null, total_death: 30, income_level: "middle", traffic_side: "left" },
                    { nation: "san marino", year: 2013, population_death_rate: 3.2, vehicle_death_rate: 1.8, distance_death_rate: null, total_death: 1, income_level: "high", traffic_side: "right" },
                    { nation: "santo tome y principe", year: 2013, population_death_rate: 31.1, vehicle_death_rate: 5454.5, distance_death_rate: null, total_death: 60, income_level: "middle", traffic_side: "right" },
                    { nation: "senegal", year: 2013, population_death_rate: 27.2, vehicle_death_rate: 956.4, distance_death_rate: null, total_death: 3844, income_level: "middle", traffic_side: "right" },
                    { nation: "serbia", year: 2013, population_death_rate: 10.4, vehicle_death_rate: 34.5, distance_death_rate: null, total_death: 735, income_level: "middle", traffic_side: "right" },
                    { nation: "seychelles", year: 2013, population_death_rate: 8.6, vehicle_death_rate: 43, distance_death_rate: null, total_death: 8, income_level: "middle", traffic_side: "left" },
                    { nation: "sierra leona", year: 2013, population_death_rate: 27.3, vehicle_death_rate: 2414.2, distance_death_rate: null, total_death: 1661, income_level: "low", traffic_side: "right" },
                    { nation: "singapur", year: 2013, population_death_rate: 3.6, vehicle_death_rate: 20.2, distance_death_rate: null, total_death: 197, income_level: "high", traffic_side: "left" },
                    { nation: "islas solomon", year: 2013, population_death_rate: 19.2, vehicle_death_rate: 240, distance_death_rate: null, total_death: 108, income_level: "middle", traffic_side: "left" },
                    { nation: "somalia", year: 2013, population_death_rate: 25.4, vehicle_death_rate: 4480.5, distance_death_rate: null, total_death: 2664, income_level: "low", traffic_side: "right" },
                    { nation: "sri lanka", year: 2013, population_death_rate: 17.4, vehicle_death_rate: 70.9, distance_death_rate: null, total_death: 3691, income_level: "middle", traffic_side: "left" },
                    { nation: "sudafrica", year: 2013, population_death_rate: 25.1, vehicle_death_rate: 133.9, distance_death_rate: null, total_death: 13273, income_level: "middle", traffic_side: "left" },
                    { nation: "sudan", year: 2013, population_death_rate: 24.3, vehicle_death_rate: 2872.8, distance_death_rate: null, total_death: 9221, income_level: "middle", traffic_side: "right" },
                    { nation: "surinam", year: 2013, population_death_rate: 19.1, vehicle_death_rate: 49.7, distance_death_rate: null, total_death: 103, income_level: "middle", traffic_side: "left" },
                    { nation: "suazilandia", year: 2013, population_death_rate: 24.2, vehicle_death_rate: 1667.4, distance_death_rate: null, total_death: 303, income_level: "middle", traffic_side: "left" },
                    { nation: "suecia", year: 2013, population_death_rate: 2.8, vehicle_death_rate: 4.7, distance_death_rate: 3.5, total_death: 272, income_level: "high", traffic_side: "right" },
                    { nation: "suiza", year: 2016, population_death_rate: 2.6, vehicle_death_rate: 3.6, distance_death_rate: 3.6, total_death: 216, income_level: "high", traffic_side: "right" },
                    { nation: "taiwan", year: 2016, population_death_rate: 6.8, vehicle_death_rate: null, distance_death_rate: null, total_death: 1604, income_level: "high", traffic_side: "right" },
                    { nation: "tanzania", year: 2013, population_death_rate: 32.9, vehicle_death_rate: 1073.7, distance_death_rate: null, total_death: 16211, income_level: "low", traffic_side: "left" },
                    { nation: "tailandia", year: 2013, population_death_rate: 36.2, vehicle_death_rate: 74.6, distance_death_rate: null, total_death: 24237, income_level: "middle", traffic_side: "left" },
                    { nation: "tayikistan", year: 2013, population_death_rate: 18.8, vehicle_death_rate: 374.9, distance_death_rate: null, total_death: 1543, income_level: "low", traffic_side: "right" },
                    { nation: "timor oriental", year: 2013, population_death_rate: 16.6, vehicle_death_rate: 295.8, distance_death_rate: null, total_death: 188, income_level: "middle", traffic_side: "left" },
                    { nation: "togo", year: 2013, population_death_rate: 31.1, vehicle_death_rate: 3653.4, distance_death_rate: null, total_death: 2123, income_level: "low", traffic_side: "right" },
                    { nation: "tonga", year: 2013, population_death_rate: 7.6, vehicle_death_rate: 98.1, distance_death_rate: null, total_death: 8, income_level: "middle", traffic_side: "left" },
                    { nation: "trinidad y tobago", year: 2013, population_death_rate: 14.1, vehicle_death_rate: 58.9, distance_death_rate: null, total_death: 189, income_level: "high", traffic_side: "left" },
                    { nation: "tunez", year: 2013, population_death_rate: 24.4, vehicle_death_rate: 154.4, distance_death_rate: null, total_death: 2679, income_level: "middle", traffic_side: "right" },
                    { nation: "turquia", year: 2013, population_death_rate: 8.9, vehicle_death_rate: 37.3, distance_death_rate: null, total_death: 6687, income_level: "middle", traffic_side: "right" },
                    { nation: "turkmenistan", year: 2009, population_death_rate: 17.4, vehicle_death_rate: 107.8, distance_death_rate: null, total_death: 914, income_level: "middle", traffic_side: "right" },
                    { nation: "ucrania", year: 2012, population_death_rate: 13.5, vehicle_death_rate: 35.3, distance_death_rate: null, total_death: 5099, income_level: "middle", traffic_side: "right" },
                    { nation: "uganda", year: 2013, population_death_rate: 27.4, vehicle_death_rate: 836.8, distance_death_rate: null, total_death: 10280, income_level: "low", traffic_side: "left" },
                    { nation: "uruguay", year: 2013, population_death_rate: 16.6, vehicle_death_rate: 28.5, distance_death_rate: null, total_death: 567, income_level: "high", traffic_side: "right" },
                    { nation: "uzbekistan", year: 2013, population_death_rate: 11.2, vehicle_death_rate: null, distance_death_rate: null, total_death: 3240, income_level: "middle", traffic_side: "right" },
                    { nation: "vanuatu", year: 2013, population_death_rate: 16.6, vehicle_death_rate: 300, distance_death_rate: null, total_death: 42, income_level: "middle", traffic_side: "right" },
                    { nation: "vietnam", year: 2013, population_death_rate: 24.5, vehicle_death_rate: 55, distance_death_rate: null, total_death: 22419, income_level: "middle", traffic_side: "right" },
                    { nation: "yemen", year: 2013, population_death_rate: 21.5, vehicle_death_rate: 436.6, distance_death_rate: null, total_death: 5248, income_level: "middle", traffic_side: "right" },
                    { nation: "yibuti", year: 2013, population_death_rate: 24.7, vehicle_death_rate: null, distance_death_rate: null, total_death: 216, income_level: "middle", traffic_side: "right" },
                    { nation: "zambia", year: 2013, population_death_rate: 24.7, vehicle_death_rate: 670.9, distance_death_rate: null, total_death: 3586, income_level: "middle", traffic_side: "left" },
                    { nation: "zimbabue", year: 2013, population_death_rate: 28.2, vehicle_death_rate: 429.8, distance_death_rate: null, total_death: 3985, income_level: "low", traffic_side: "left" }
                ];

                db.insert(initialRoadFatalities, (err, newDocs) => {
                    if (err) return res.status(500).json({ error: "Error al insertar datos en v2" });
                    newDocs.forEach(d => delete d._id);
                    res.status(200).json(newDocs);
                });
            }
        });
    });


    // GET colección con Paginación y Búsquedas por TODOS los campos
    // Ej: GET /api/v2/road-fatalities
    // Ej (Búsqueda): GET /api/v2/road-fatalities?income_level=high
    // Ej (Rango de años): GET /api/v2/road-fatalities?from=2013&to=2019
    // Ej (Paginación): GET /api/v2/road-fatalities?limit=5&offset=2
    app.get(BASE_URL_API_JFM_V2, (req, res) => {
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
            if (req.query.to) query.year.$lte = parseInt(req.query.to);
        } else if (req.query.year) {
            query.year = parseInt(req.query.year);
        }

        db.find(query, { _id: 0 }).skip(offset).limit(limit).exec((err, docs) => {
            if (err) return res.status(500).json({ error: "Error interno del servidor" });
            res.status(200).json(docs);
        });
    });


    // GET colección de un país específico con opción a filtrar por año (Devuelve Array)
    // Ej (País específico): GET /api/v2/road-fatalities/italy
    // Ej (País y rango de años): GET /api/v2/road-fatalities/italy?from=2010&to=2020
    app.get(BASE_URL_API_JFM_V2 + "/:nation", (req, res) => {
        const nationParam = req.params.nation.toLowerCase();
        let query = { nation: nationParam };

        if (req.query.from || req.query.to) {
            query.year = {};
            if (req.query.from) query.year.$gte = parseInt(req.query.from);
            if (req.query.to) query.year.$lte = parseInt(req.query.to);
        } else if (req.query.year) {
            query.year = parseInt(req.query.year);
        }

        db.find(query, { _id: 0 }, (err, docs) => {
            if (err) return res.status(500).json({ error: "Error interno" });
            res.status(200).json(docs);
        });
    });


    // GET recurso concreto (País y Año) (Devuelve Objeto)
    // Ej: GET /api/v2/road-fatalities/spain/2013
    app.get(BASE_URL_API_JFM_V2 + "/:nation/:year", (req, res) => {
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
    // Ej: POST /api/v2/road-fatalities
    app.post(BASE_URL_API_JFM_V2, (req, res) => {
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
    //Ej: POST /api/v2/road-fatalities/italy/2023
    app.post(BASE_URL_API_JFM_V2 + "/:nation/:year", (req, res) => {
        res.status(405).json({ error: "Method Not Allowed" });
    });


    // PUT colección (NO PERMITIDO)
    //Ej: PUT  /api/v2/road-fatalities
    app.put(BASE_URL_API_JFM_V2, (req, res) => {
        res.status(405).json({ error: "Method Not Allowed" });
    });


    /// PUT recurso concreto (Actualiza los datos)
    // Ej: PUT /api/v2/road-fatalities/spain/2013
    app.put(BASE_URL_API_JFM_V2 + "/:nation/:year", (req, res) => {
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
    //Ej: DELETE  /api/v2/road-fatalities
    app.delete(BASE_URL_API_JFM_V2, (req, res) => {
        db.remove({}, { multi: true }, (err, numRemoved) => {
            if (err) return res.status(500).json({ error: "Error interno del servidor" });
            res.status(200).json({ message: "OK: Todos los recursos eliminados." });
        });
    });


    // DELETE a recurso concreto    
    //Ej: DELETE  /api/v2/road-fatalities/spain/2013  (borra solo un país en un año específico)
    app.delete(BASE_URL_API_JFM_V2 + "/:nation/:year", (req, res) => {
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