import Datastore from "nedb";

// Instancias únicas por archivo de DB.
// Importar siempre desde aquí para evitar que dos módulos
// abran el mismo archivo simultáneamente y generen conflictos de escritura.

export const dbRoadFatalities = new Datastore({
  filename: "./data/road-fatalities-v2.db",
  autoload: true,
});

export const dbAlcohol = new Datastore({
  filename: "./data/alcohol-consumptions-per-capita-v2.db",
  autoload: true,
});

export const dbLiteracy = new Datastore({
  filename: "./data/literacy-rates-v2.db",
  autoload: true,
});
