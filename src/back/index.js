import express from 'express';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// IMPORTAMOS TU API
import { loadBackendMRG } from "./api/api-MRG.js";
import { loadBackendTGG } from './api/api-TGG.js'; // Comentado por ahora
import { loadBackendJFM } from "./api/api-JFM.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

app.use('/', express.static('public'));
app.use(express.json());

// Ruta estática
app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/about.html'));
});

// =====================================
// CARGAR APIs
// =====================================

// API MRG (Miguel Ridao)
loadBackendMRG(app);

// API JFM (José Fernández Montero)
loadBackendJFM(app);

// API TGG (Tomás Gutiérrez García)
loadBackendTGG(app);


// =====================================
// ARRANQUE DEL SERVIDOR
// =====================================
app.listen(port, () => {
    console.log(`Servidor funcionando en el puerto ${port}`);
});

