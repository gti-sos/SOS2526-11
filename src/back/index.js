import express from 'express';
import cors from 'cors';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import {handler} from "../front/svelte-app/build/handler.js";

//Imports tareas extra
import jwt from 'jsonwebtoken';

// IMPORTAMOS API
import { loadBackendMRG } from "./api/api-MRG.js";
import { loadBackendTGG } from './api/api-TGG.js'; 
import { loadBackendJFM } from "./api/api-JFM.js";
import { loadBackendMRGv2 } from "./api/api-MRG-v2.js";
import { loadBackendTGGv2 } from './api/api-TGG-v2.js';
import { loadBackendJFMv2 } from './api/api-JFM-v2.js';
import { loadBackendIntegrationsJFM } from './api/integrations-JFM.js';
import { loadBackendIntegrationsMRG } from './api/integrations-MRG.js';
import { loadBackendIntegrationsTGG } from './api/integrations-TGG.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());

//app.use('/', express.static('public'));
app.use(express.json());

// Puntos extra Miguel 

//clave "Secreta" Miguel Ridao
const SECRET_KEY = "contraseñaMiguel";



// =====================================
// CARGAR APIs
// =====================================

// API MRG (Miguel Ridao)
loadBackendMRG(app);
// API MRG v2
loadBackendMRGv2(app);

// API JFM (José Fernández Montero)
loadBackendJFM(app);

// API JFM v2
loadBackendJFMv2(app);

// API TGG (Tomás Gutiérrez García)
loadBackendTGG(app);

// API TGG v2
loadBackendTGGv2(app);

// Integraciones OAuth2 (3 widgets por persona)
loadBackendIntegrationsJFM(app);
loadBackendIntegrationsMRG(app);
loadBackendIntegrationsTGG(app);

// =====================================
// CARGAR SVELTEKIT HANDLER PRIMERO
// =====================================
app.use(handler);

// =====================================
// ARRANQUE DEL SERVIDOR
// =====================================
app.listen(port, () => {
    console.log(`Servidor funcionando en el puerto ${port}`);
});

