const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config();

// Obtener la ruta de la base de datos desde el entorno
const dbPath = process.env.DB_PATH || path.join(__dirname, 'db', 'fixture.db');
const dbDir = path.dirname(dbPath);

console.log(`Verificando base de datos en: ${dbPath}`);

// Asegurar que exista la carpeta contenedora
if (!fs.existsSync(dbDir)) {
  console.log(`Creando directorio para la base de datos: ${dbDir}`);
  fs.mkdirSync(dbDir, { recursive: true });
}

// Si el archivo no existe o está vacío (0 bytes), se inicializa
const dbExists = fs.existsSync(dbPath);
const dbEmpty = dbExists ? fs.statSync(dbPath).size === 0 : true;

if (!dbExists || dbEmpty) {
  console.log('Base de datos no encontrada o vacía. Iniciando carga inicial de datos...');
  try {
    execSync('node db/init.js', { stdio: 'inherit' });
    console.log('Base de datos inicializada con éxito.');
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error.message);
    process.exit(1);
  }
} else {
  console.log('Base de datos existente encontrada. Omitiendo inicialización.');
}

// Iniciar el servidor Express
console.log('Iniciando el servidor de la aplicación...');
require('./server.js');
