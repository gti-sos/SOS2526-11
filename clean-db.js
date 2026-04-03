import fs from 'fs';

// Limpiar base de datos de literacy rates
const dbPath = './data/literacy-rates-v2.db';
if (fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, '');
    console.log('Base de datos literacy-rates-v2.db limpiada correctamente');
} else {
    console.log('Archivo no encontrado, creando archivo vacío');
    fs.writeFileSync(dbPath, '');
}
