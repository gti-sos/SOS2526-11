import Datastore from "nedb";

export const BASE_URL_API_MRG = "/api/v1/alcohol-consumptions-per-capita";

export function loadBackendMRG(app) {
    // Inicializamos NeDB con persistencia en archivo
    const db = new Datastore({ filename: './data/alcohol-consumptions-per-capita.db', autoload: false });
    db.loadDatabase();

    // Función auxiliar estricta para validar JSON
    function isValidAlcoholStats(body) {
        const expectedKeys = ["nation", "date_year", "alcohol_litre", "recorded_consumption", "unrecorded_consumption"];
        const bodyKeys = Object.keys(body);
        if (bodyKeys.length !== expectedKeys.length) return false;
        for (let key of expectedKeys) {
            if (!bodyKeys.includes(key)) return false;
        }
        return true;
    }

    // GET /api/v1/alcohol-consumptions-per-capita/docs
    app.get(BASE_URL_API_MRG + "/docs", (req, res) => {
        res.redirect("https://documenter.getpostman.com/view/52276603/2sBXigNZJ5");
    });

    // GET /api/v1/alcohol-consumptions-per-capita
    app.get(BASE_URL_API_MRG, (req, res) => {
        let query = {};
        let offset = 0;
        let limit = 0;

        // Búsquedas adaptadas a tus campos
        if (req.query.nation) query.nation = req.query.nation;
        if (req.query.date_year) query.date_year = parseInt(req.query.date_year);
        if (req.query.alcohol_litre) query.alcohol_litre = parseFloat(req.query.alcohol_litre);
        if (req.query.recorded_consumption) query.recorded_consumption = parseFloat(req.query.recorded_consumption);
        if (req.query.unrecorded_consumption) query.unrecorded_consumption = parseFloat(req.query.unrecorded_consumption);

        // Paginación
        if (req.query.offset) offset = parseInt(req.query.offset);
        if (req.query.limit) limit = parseInt(req.query.limit);

        // Búsqueda en NeDB
        db.find(query, { _id: 0 }).skip(offset).limit(limit).exec((err, docs) => {
            if (err) return res.status(500).json({ error: "Error interno del servidor" });
            res.status(200).json(docs);
        });
    });
    // GET /api/v1/alcohol-consumptions-per-capita/loadInitialData
    app.get(BASE_URL_API_MRG + "/loadInitialData", (req, res) => {
        db.find({}, (err, docs) => {
            if (err) return res.status(500).json({ error: "Error interno del servidor" });

            if (docs.length > 0) {
                return res.status(400).json({ error: "Bad Request: Data already exists" });
            } else {
                const initialData = [
                    // Spain
                    { nation: "Spain", date_year: 2019, alcohol_litre: 11.2, recorded_consumption: 10.7, unrecorded_consumption: 0.5 },
                    { nation: "Spain", date_year: 2017, alcohol_litre: 10.8, recorded_consumption: 10.3, unrecorded_consumption: 0.5 },
                    { nation: "Spain", date_year: 2016, alcohol_litre: 10.4, recorded_consumption: 9.9, unrecorded_consumption: 0.5 },

                    // Afghanistan
                    { nation: "Afghanistan", date_year: 2019, alcohol_litre: 0.2, recorded_consumption: 0.0, unrecorded_consumption: 0.2 },
                    { nation: "Afghanistan", date_year: 2017, alcohol_litre: 0.2, recorded_consumption: 0.0, unrecorded_consumption: 0.2 },
                    { nation: "Afghanistan", date_year: 2016, alcohol_litre: 0.2, recorded_consumption: 0.0, unrecorded_consumption: 0.2 },

                    // Albania
                    { nation: "Albania", date_year: 2019, alcohol_litre: 5.1, recorded_consumption: 4.4, unrecorded_consumption: 0.7 },
                    { nation: "Albania", date_year: 2017, alcohol_litre: 5.5, recorded_consumption: 4.8, unrecorded_consumption: 0.7 },
                    { nation: "Albania", date_year: 2016, alcohol_litre: 5.7, recorded_consumption: 5.0, unrecorded_consumption: 0.7 },

                    // Algeria
                    { nation: "Algeria", date_year: 2019, alcohol_litre: 0.9, recorded_consumption: 0.6, unrecorded_consumption: 0.3 },
                    { nation: "Algeria", date_year: 2017, alcohol_litre: 1.1, recorded_consumption: 0.8, unrecorded_consumption: 0.3 },
                    { nation: "Algeria", date_year: 2016, alcohol_litre: 1.2, recorded_consumption: 0.9, unrecorded_consumption: 0.3 },

                    // Andorra
                    { nation: "Andorra", date_year: 2019, alcohol_litre: 11.5, recorded_consumption: 11.1, unrecorded_consumption: 0.4 },
                    { nation: "Andorra", date_year: 2017, alcohol_litre: 11.8, recorded_consumption: 11.4, unrecorded_consumption: 0.4 },
                    { nation: "Andorra", date_year: 2016, alcohol_litre: 12.0, recorded_consumption: 11.6, unrecorded_consumption: 0.4 },

                    // Angola
                    { nation: "Angola", date_year: 2019, alcohol_litre: 6.2, recorded_consumption: 5.3, unrecorded_consumption: 0.9 },
                    { nation: "Angola", date_year: 2017, alcohol_litre: 6.6, recorded_consumption: 5.7, unrecorded_consumption: 0.9 },
                    { nation: "Angola", date_year: 2016, alcohol_litre: 7.0, recorded_consumption: 6.1, unrecorded_consumption: 0.9 },

                    // Argentina
                    { nation: "Argentina", date_year: 2019, alcohol_litre: 8.0, recorded_consumption: 7.6, unrecorded_consumption: 0.4 },
                    { nation: "Argentina", date_year: 2017, alcohol_litre: 8.3, recorded_consumption: 7.9, unrecorded_consumption: 0.4 },
                    { nation: "Argentina", date_year: 2016, alcohol_litre: 8.7, recorded_consumption: 8.3, unrecorded_consumption: 0.4 },

                    // Bangladesh
                    { nation: "Bangladesh", date_year: 2019, alcohol_litre: 0.0, recorded_consumption: 0.0, unrecorded_consumption: 0.0 },
                    { nation: "Bangladesh", date_year: 2017, alcohol_litre: 0.0, recorded_consumption: 0.0, unrecorded_consumption: 0.0 },
                    { nation: "Bangladesh", date_year: 2016, alcohol_litre: 0.0, recorded_consumption: 0.0, unrecorded_consumption: 0.0 },

                    // Brazil
                    { nation: "Brazil", date_year: 2019, alcohol_litre: 7.7, recorded_consumption: 6.3, unrecorded_consumption: 1.4 },
                    { nation: "Brazil", date_year: 2017, alcohol_litre: 8.1, recorded_consumption: 6.7, unrecorded_consumption: 1.4 },
                    { nation: "Brazil", date_year: 2016, alcohol_litre: 8.5, recorded_consumption: 7.1, unrecorded_consumption: 1.4 },

                    // Bulgaria
                    { nation: "Bulgaria", date_year: 2019, alcohol_litre: 12.0, recorded_consumption: 11.4, unrecorded_consumption: 0.6 },
                    { nation: "Bulgaria", date_year: 2017, alcohol_litre: 12.3, recorded_consumption: 11.7, unrecorded_consumption: 0.6 },
                    { nation: "Bulgaria", date_year: 2016, alcohol_litre: 12.6, recorded_consumption: 12.0, unrecorded_consumption: 0.6 },

                    // Cameroon
                    { nation: "Cameroon", date_year: 2019, alcohol_litre: 10.1, recorded_consumption: 4.0, unrecorded_consumption: 6.1 },
                    { nation: "Cameroon", date_year: 2017, alcohol_litre: 10.5, recorded_consumption: 4.4, unrecorded_consumption: 6.1 },
                    { nation: "Cameroon", date_year: 2016, alcohol_litre: 10.8, recorded_consumption: 4.7, unrecorded_consumption: 6.1 },

                    // Chile
                    { nation: "Chile", date_year: 2019, alcohol_litre: 6.8, recorded_consumption: 6.4, unrecorded_consumption: 0.4 },
                    { nation: "Chile", date_year: 2017, alcohol_litre: 7.2, recorded_consumption: 6.8, unrecorded_consumption: 0.4 },
                    { nation: "Chile", date_year: 2016, alcohol_litre: 7.6, recorded_consumption: 7.2, unrecorded_consumption: 0.4 },

                    // China
                    { nation: "China", date_year: 2019, alcohol_litre: 5.7, recorded_consumption: 4.8, unrecorded_consumption: 0.9 },
                    { nation: "China", date_year: 2017, alcohol_litre: 5.5, recorded_consumption: 4.6, unrecorded_consumption: 0.9 },
                    { nation: "China", date_year: 2016, alcohol_litre: 5.2, recorded_consumption: 4.3, unrecorded_consumption: 0.9 },

                    // Colombia
                    { nation: "Colombia", date_year: 2019, alcohol_litre: 4.9, recorded_consumption: 4.2, unrecorded_consumption: 0.7 },
                    { nation: "Colombia", date_year: 2017, alcohol_litre: 5.3, recorded_consumption: 4.6, unrecorded_consumption: 0.7 },
                    { nation: "Colombia", date_year: 2016, alcohol_litre: 5.6, recorded_consumption: 4.9, unrecorded_consumption: 0.7 },

                    // Costa Rica
                    { nation: "Costa Rica", date_year: 2019, alcohol_litre: 4.8, recorded_consumption: 4.4, unrecorded_consumption: 0.4 },
                    { nation: "Costa Rica", date_year: 2017, alcohol_litre: 5.1, recorded_consumption: 4.7, unrecorded_consumption: 0.4 },
                    { nation: "Costa Rica", date_year: 2016, alcohol_litre: 5.4, recorded_consumption: 5.0, unrecorded_consumption: 0.4 },

                    // Cuba
                    { nation: "Cuba", date_year: 2019, alcohol_litre: 6.0, recorded_consumption: 4.7, unrecorded_consumption: 1.3 },
                    { nation: "Cuba", date_year: 2017, alcohol_litre: 6.3, recorded_consumption: 5.0, unrecorded_consumption: 1.3 },
                    { nation: "Cuba", date_year: 2016, alcohol_litre: 6.7, recorded_consumption: 5.4, unrecorded_consumption: 1.3 },

                    // Czech Republic
                    { nation: "Czech Republic", date_year: 2019, alcohol_litre: 13.3, recorded_consumption: 12.9, unrecorded_consumption: 0.4 },
                    { nation: "Czech Republic", date_year: 2017, alcohol_litre: 13.7, recorded_consumption: 13.3, unrecorded_consumption: 0.4 },
                    { nation: "Czech Republic", date_year: 2016, alcohol_litre: 14.1, recorded_consumption: 13.7, unrecorded_consumption: 0.4 },

                    // DR Congo
                    { nation: "DR Congo", date_year: 2019, alcohol_litre: 2.5, recorded_consumption: 1.5, unrecorded_consumption: 1.0 },
                    { nation: "DR Congo", date_year: 2017, alcohol_litre: 2.8, recorded_consumption: 1.8, unrecorded_consumption: 1.0 },
                    { nation: "DR Congo", date_year: 2016, alcohol_litre: 3.1, recorded_consumption: 2.1, unrecorded_consumption: 1.0 },

                    // Ecuador
                    { nation: "Ecuador", date_year: 2019, alcohol_litre: 4.4, recorded_consumption: 3.8, unrecorded_consumption: 0.6 },
                    { nation: "Ecuador", date_year: 2017, alcohol_litre: 4.8, recorded_consumption: 4.2, unrecorded_consumption: 0.6 },
                    { nation: "Ecuador", date_year: 2016, alcohol_litre: 5.1, recorded_consumption: 4.5, unrecorded_consumption: 0.6 },

                    // Egypt
                    { nation: "Egypt", date_year: 2019, alcohol_litre: 0.2, recorded_consumption: 0.1, unrecorded_consumption: 0.1 },
                    { nation: "Egypt", date_year: 2017, alcohol_litre: 0.2, recorded_consumption: 0.1, unrecorded_consumption: 0.1 },
                    { nation: "Egypt", date_year: 2016, alcohol_litre: 0.2, recorded_consumption: 0.1, unrecorded_consumption: 0.1 },

                    // El Salvador
                    { nation: "El Salvador", date_year: 2019, alcohol_litre: 3.2, recorded_consumption: 2.6, unrecorded_consumption: 0.6 },
                    { nation: "El Salvador", date_year: 2017, alcohol_litre: 3.6, recorded_consumption: 3.0, unrecorded_consumption: 0.6 },
                    { nation: "El Salvador", date_year: 2016, alcohol_litre: 3.9, recorded_consumption: 3.3, unrecorded_consumption: 0.6 },

                    // Estonia
                    { nation: "Estonia", date_year: 2019, alcohol_litre: 12.9, recorded_consumption: 11.8, unrecorded_consumption: 1.1 },
                    { nation: "Estonia", date_year: 2017, alcohol_litre: 13.3, recorded_consumption: 12.2, unrecorded_consumption: 1.1 },
                    { nation: "Estonia", date_year: 2016, alcohol_litre: 13.8, recorded_consumption: 12.7, unrecorded_consumption: 1.1 },

                    // India
                    { nation: "India", date_year: 2019, alcohol_litre: 5.5, recorded_consumption: 2.9, unrecorded_consumption: 2.6 },
                    { nation: "India", date_year: 2017, alcohol_litre: 5.2, recorded_consumption: 2.6, unrecorded_consumption: 2.6 },
                    { nation: "India", date_year: 2016, alcohol_litre: 4.9, recorded_consumption: 2.3, unrecorded_consumption: 2.6 },

                    // Indonesia
                    { nation: "Indonesia", date_year: 2019, alcohol_litre: 0.3, recorded_consumption: 0.2, unrecorded_consumption: 0.1 },
                    { nation: "Indonesia", date_year: 2017, alcohol_litre: 0.3, recorded_consumption: 0.2, unrecorded_consumption: 0.1 },
                    { nation: "Indonesia", date_year: 2016, alcohol_litre: 0.4, recorded_consumption: 0.3, unrecorded_consumption: 0.1 },

                    // Iran
                    { nation: "Iran", date_year: 2019, alcohol_litre: 1.0, recorded_consumption: 0.0, unrecorded_consumption: 1.0 },
                    { nation: "Iran", date_year: 2017, alcohol_litre: 1.0, recorded_consumption: 0.0, unrecorded_consumption: 1.0 },
                    { nation: "Iran", date_year: 2016, alcohol_litre: 1.0, recorded_consumption: 0.0, unrecorded_consumption: 1.0 },

                    // Israel
                    { nation: "Israel", date_year: 2019, alcohol_litre: 3.2, recorded_consumption: 2.9, unrecorded_consumption: 0.3 },
                    { nation: "Israel", date_year: 2017, alcohol_litre: 3.4, recorded_consumption: 3.1, unrecorded_consumption: 0.3 },
                    { nation: "Israel", date_year: 2016, alcohol_litre: 3.6, recorded_consumption: 3.3, unrecorded_consumption: 0.3 },

                    // Italy
                    { nation: "Italy", date_year: 2019, alcohol_litre: 8.1, recorded_consumption: 7.6, unrecorded_consumption: 0.5 },
                    { nation: "Italy", date_year: 2017, alcohol_litre: 8.4, recorded_consumption: 7.9, unrecorded_consumption: 0.5 },
                    { nation: "Italy", date_year: 2016, alcohol_litre: 8.8, recorded_consumption: 8.3, unrecorded_consumption: 0.5 },

                    // Ivory Coast
                    { nation: "Ivory Coast", date_year: 2019, alcohol_litre: 2.8, recorded_consumption: 1.9, unrecorded_consumption: 0.9 },
                    { nation: "Ivory Coast", date_year: 2017, alcohol_litre: 3.1, recorded_consumption: 2.2, unrecorded_consumption: 0.9 },
                    { nation: "Ivory Coast", date_year: 2016, alcohol_litre: 3.4, recorded_consumption: 2.5, unrecorded_consumption: 0.9 },

                    // Kenya
                    { nation: "Kenya", date_year: 2019, alcohol_litre: 2.8, recorded_consumption: 1.8, unrecorded_consumption: 1.0 },
                    { nation: "Kenya", date_year: 2017, alcohol_litre: 3.2, recorded_consumption: 2.2, unrecorded_consumption: 1.0 },
                    { nation: "Kenya", date_year: 2016, alcohol_litre: 3.6, recorded_consumption: 2.6, unrecorded_consumption: 1.0 },

                    // Mexico
                    { nation: "Mexico", date_year: 2019, alcohol_litre: 6.0, recorded_consumption: 4.8, unrecorded_consumption: 1.2 },
                    { nation: "Mexico", date_year: 2017, alcohol_litre: 6.4, recorded_consumption: 5.2, unrecorded_consumption: 1.2 },
                    { nation: "Mexico", date_year: 2016, alcohol_litre: 6.8, recorded_consumption: 5.6, unrecorded_consumption: 1.2 },

                    // Morocco
                    { nation: "Morocco", date_year: 2019, alcohol_litre: 0.6, recorded_consumption: 0.4, unrecorded_consumption: 0.2 },
                    { nation: "Morocco", date_year: 2017, alcohol_litre: 0.7, recorded_consumption: 0.5, unrecorded_consumption: 0.2 },
                    { nation: "Morocco", date_year: 2016, alcohol_litre: 0.8, recorded_consumption: 0.6, unrecorded_consumption: 0.2 },

                    // Nigeria
                    { nation: "Nigeria", date_year: 2019, alcohol_litre: 4.2, recorded_consumption: 2.9, unrecorded_consumption: 1.3 },
                    { nation: "Nigeria", date_year: 2017, alcohol_litre: 4.6, recorded_consumption: 3.3, unrecorded_consumption: 1.3 },
                    { nation: "Nigeria", date_year: 2016, alcohol_litre: 5.0, recorded_consumption: 3.7, unrecorded_consumption: 1.3 },

                    // Pakistan
                    { nation: "Pakistan", date_year: 2019, alcohol_litre: 0.3, recorded_consumption: 0.0, unrecorded_consumption: 0.3 },
                    { nation: "Pakistan", date_year: 2017, alcohol_litre: 0.3, recorded_consumption: 0.0, unrecorded_consumption: 0.3 },
                    { nation: "Pakistan", date_year: 2016, alcohol_litre: 0.3, recorded_consumption: 0.0, unrecorded_consumption: 0.3 },

                    // Panama
                    { nation: "Panama", date_year: 2019, alcohol_litre: 6.7, recorded_consumption: 6.3, unrecorded_consumption: 0.4 },
                    { nation: "Panama", date_year: 2017, alcohol_litre: 7.1, recorded_consumption: 6.7, unrecorded_consumption: 0.4 },
                    { nation: "Panama", date_year: 2016, alcohol_litre: 7.5, recorded_consumption: 7.1, unrecorded_consumption: 0.4 },

                    // Paraguay
                    { nation: "Paraguay", date_year: 2019, alcohol_litre: 5.8, recorded_consumption: 5.3, unrecorded_consumption: 0.5 },
                    { nation: "Paraguay", date_year: 2017, alcohol_litre: 6.2, recorded_consumption: 5.7, unrecorded_consumption: 0.5 },
                    { nation: "Paraguay", date_year: 2016, alcohol_litre: 6.6, recorded_consumption: 6.1, unrecorded_consumption: 0.5 },

                    // Peru
                    { nation: "Peru", date_year: 2019, alcohol_litre: 7.5, recorded_consumption: 5.7, unrecorded_consumption: 1.8 },
                    { nation: "Peru", date_year: 2017, alcohol_litre: 7.9, recorded_consumption: 6.1, unrecorded_consumption: 1.8 },
                    { nation: "Peru", date_year: 2016, alcohol_litre: 8.3, recorded_consumption: 6.5, unrecorded_consumption: 1.8 },

                    // Philippines
                    { nation: "Philippines", date_year: 2019, alcohol_litre: 6.2, recorded_consumption: 5.0, unrecorded_consumption: 1.2 },
                    { nation: "Philippines", date_year: 2017, alcohol_litre: 6.6, recorded_consumption: 5.4, unrecorded_consumption: 1.2 },
                    { nation: "Philippines", date_year: 2016, alcohol_litre: 7.0, recorded_consumption: 5.8, unrecorded_consumption: 1.2 },

                    // Poland
                    { nation: "Poland", date_year: 2019, alcohol_litre: 12.1, recorded_consumption: 10.7, unrecorded_consumption: 1.4 },
                    { nation: "Poland", date_year: 2017, alcohol_litre: 12.5, recorded_consumption: 11.1, unrecorded_consumption: 1.4 },
                    { nation: "Poland", date_year: 2016, alcohol_litre: 12.9, recorded_consumption: 11.5, unrecorded_consumption: 1.4 },

                    // Portugal
                    { nation: "Portugal", date_year: 2019, alcohol_litre: 10.8, recorded_consumption: 10.2, unrecorded_consumption: 0.6 },
                    { nation: "Portugal", date_year: 2017, alcohol_litre: 11.2, recorded_consumption: 10.6, unrecorded_consumption: 0.6 },
                    { nation: "Portugal", date_year: 2016, alcohol_litre: 11.6, recorded_consumption: 11.0, unrecorded_consumption: 0.6 },

                    // Romania
                    { nation: "Romania", date_year: 2019, alcohol_litre: 16.9, recorded_consumption: 10.7, unrecorded_consumption: 6.2 },
                    { nation: "Romania", date_year: 2017, alcohol_litre: 17.3, recorded_consumption: 11.1, unrecorded_consumption: 6.2 },
                    { nation: "Romania", date_year: 2016, alcohol_litre: 17.7, recorded_consumption: 11.5, unrecorded_consumption: 6.2 },

                    // Russia
                    { nation: "Russia", date_year: 2019, alcohol_litre: 10.4, recorded_consumption: 7.1, unrecorded_consumption: 3.3 },
                    { nation: "Russia", date_year: 2017, alcohol_litre: 11.0, recorded_consumption: 7.7, unrecorded_consumption: 3.3 },
                    { nation: "Russia", date_year: 2016, alcohol_litre: 11.6, recorded_consumption: 8.3, unrecorded_consumption: 3.3 },

                    // Saudi Arabia
                    { nation: "Saudi Arabia", date_year: 2019, alcohol_litre: 0.2, recorded_consumption: 0.0, unrecorded_consumption: 0.2 },
                    { nation: "Saudi Arabia", date_year: 2017, alcohol_litre: 0.2, recorded_consumption: 0.0, unrecorded_consumption: 0.2 },
                    { nation: "Saudi Arabia", date_year: 2016, alcohol_litre: 0.2, recorded_consumption: 0.0, unrecorded_consumption: 0.2 },

                    // Serbia
                    { nation: "Serbia", date_year: 2019, alcohol_litre: 7.7, recorded_consumption: 6.9, unrecorded_consumption: 0.8 },
                    { nation: "Serbia", date_year: 2017, alcohol_litre: 8.1, recorded_consumption: 7.3, unrecorded_consumption: 0.8 },
                    { nation: "Serbia", date_year: 2016, alcohol_litre: 8.5, recorded_consumption: 7.7, unrecorded_consumption: 0.8 },

                    // South Africa
                    { nation: "South Africa", date_year: 2019, alcohol_litre: 8.8, recorded_consumption: 7.4, unrecorded_consumption: 1.4 },
                    { nation: "South Africa", date_year: 2017, alcohol_litre: 9.3, recorded_consumption: 7.9, unrecorded_consumption: 1.4 },
                    { nation: "South Africa", date_year: 2016, alcohol_litre: 9.7, recorded_consumption: 8.3, unrecorded_consumption: 1.4 },

                    // Sri Lanka
                    { nation: "Sri Lanka", date_year: 2019, alcohol_litre: 3.0, recorded_consumption: 1.5, unrecorded_consumption: 1.5 },
                    { nation: "Sri Lanka", date_year: 2017, alcohol_litre: 3.4, recorded_consumption: 1.9, unrecorded_consumption: 1.5 },
                    { nation: "Sri Lanka", date_year: 2016, alcohol_litre: 3.8, recorded_consumption: 2.3, unrecorded_consumption: 1.5 },

                    // Turkey
                    { nation: "Turkey", date_year: 2019, alcohol_litre: 2.0, recorded_consumption: 1.3, unrecorded_consumption: 0.7 },
                    { nation: "Turkey", date_year: 2017, alcohol_litre: 2.2, recorded_consumption: 1.5, unrecorded_consumption: 0.7 },
                    { nation: "Turkey", date_year: 2016, alcohol_litre: 2.4, recorded_consumption: 1.7, unrecorded_consumption: 0.7 },

                    // Ukraine
                    { nation: "Ukraine", date_year: 2019, alcohol_litre: 8.7, recorded_consumption: 5.5, unrecorded_consumption: 3.2 },
                    { nation: "Ukraine", date_year: 2017, alcohol_litre: 9.3, recorded_consumption: 6.1, unrecorded_consumption: 3.2 },
                    { nation: "Ukraine", date_year: 2016, alcohol_litre: 9.8, recorded_consumption: 6.6, unrecorded_consumption: 3.2 },

                    // United Arab Emirates
                    { nation: "United Arab Emirates", date_year: 2019, alcohol_litre: 3.8, recorded_consumption: 3.0, unrecorded_consumption: 0.8 },
                    { nation: "United Arab Emirates", date_year: 2017, alcohol_litre: 4.1, recorded_consumption: 3.3, unrecorded_consumption: 0.8 },
                    { nation: "United Arab Emirates", date_year: 2016, alcohol_litre: 4.4, recorded_consumption: 3.6, unrecorded_consumption: 0.8 },

                    // Uruguay
                    { nation: "Uruguay", date_year: 2019, alcohol_litre: 5.6, recorded_consumption: 5.2, unrecorded_consumption: 0.4 },
                    { nation: "Uruguay", date_year: 2017, alcohol_litre: 5.9, recorded_consumption: 5.5, unrecorded_consumption: 0.4 },
                    { nation: "Uruguay", date_year: 2016, alcohol_litre: 6.3, recorded_consumption: 5.9, unrecorded_consumption: 0.4 },

                    // Vietnam
                    { nation: "Vietnam", date_year: 2019, alcohol_litre: 9.3, recorded_consumption: 3.4, unrecorded_consumption: 5.9 },
                    { nation: "Vietnam", date_year: 2017, alcohol_litre: 9.7, recorded_consumption: 3.8, unrecorded_consumption: 5.9 },
                    { nation: "Vietnam", date_year: 2016, alcohol_litre: 10.1, recorded_consumption: 4.2, unrecorded_consumption: 5.9 }
                ];

                db.insert(initialData, (err, newDocs) => {
                    if (err) return res.status(500).json({ error: "Error al insertar datos" });
                    newDocs.forEach(d => delete d._id);
                    res.status(200).json(newDocs);
                });
            }
        });
    });

    // GET /api/v1/alcohol-consumptions-per-capita
    app.get(BASE_URL_API_MRG, (req, res) => {
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

    // GET /api/v1/alcohol-consumptions-per-capita/:nation/:year
    app.get(BASE_URL_API_MRG + "/:nation/:date_year", (req, res) => {
        const nationParam = req.params.nation;
        const yearParam = parseInt(req.params.date_year);

        db.findOne({ nation: nationParam, date_year: yearParam }, { _id: 0 }, (err, doc) => {
            if (err) return res.status(500).json({ error: "Error interno del servidor" });
            doc ? res.status(200).json(doc) : res.status(404).json({ error: "Not Found: Recurso no encontrado" });
        });
    });

    // POST /api/v1/alcohol-consumptions-per-capita
    app.post(BASE_URL_API_MRG, (req, res) => {
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

    // PUT /api/v1/alcohol-consumptions-per-capita
    app.put(BASE_URL_API_MRG, (req, res) => {
        res.status(405).json({ error: "Method Not Allowed: No se puede actualizar la lista completa" });
    });

    // DELETE /api/v1/alcohol-consumptions-per-capita
    app.delete(BASE_URL_API_MRG, (req, res) => {
        db.remove({}, { multi: true }, (err, numRemoved) => {
            if (err) return res.status(500).json({ error: "Error interno del servidor" });
            res.status(200).json({ message: "OK: Todos los recursos han sido eliminados." });
        });
    });

    // POST /api/v1/alcohol-consumptions-per-capita/:nation/:year
    app.post(BASE_URL_API_MRG + "/:nation/:date_year", (req, res) => {
        res.status(405).json({ error: "Method Not Allowed: No se puede hacer POST a un recurso concreto." });
    });

    // PUT /api/v1/alcohol-consumptions-per-capita/:nation/:year
    app.put(BASE_URL_API_MRG + "/:nation/:date_year", (req, res) => {
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

    // DELETE /api/v1/alcohol-consumptions-per-capita/:nation/:year
    app.delete(BASE_URL_API_MRG + "/:nation/:date_year", (req, res) => {
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