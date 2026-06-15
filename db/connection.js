const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DB_PATH || path.join(__dirname, 'fixture.db');

// Inicialización de la base de datos con better-sqlite3
const db = new Database(dbPath, { verbose: console.log });

// Habilitar claves foráneas
db.pragma('foreign_keys = ON');

module.exports = db;
