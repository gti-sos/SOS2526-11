import fs from 'fs';

const databases = [
    './data/literacy-rates-v2.db',
    './data/literacy-rates.db',
    './data/alcohol-consumptions-per-capita-v2.db',
    './data/alcohol-consumptions-per-capita.db',
    './data/road-fatalities-v2.db',
    './data/road-fatalities.db'
];

databases.forEach(dbPath => {
    try {
        if (fs.existsSync(dbPath)) {
            fs.unlinkSync(dbPath);
        }
        // Crear archivo vacío
        fs.writeFileSync(dbPath, '');
        console.log(`Base de datos ${dbPath} reiniciada correctamente`);
    } catch (err) {
        console.error(`Error limpiando ${dbPath}:`, err.message);
    }
});
