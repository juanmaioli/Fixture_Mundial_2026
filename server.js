const express = require('express');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de Express para procesar formularios y JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Definir EJS como motor de vistas principal
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Cargar rutas
const routes = require('./routes/index');
app.use('/', routes);

// Rutas de certificados SSL (por defecto en ./ssl)
const sslKeyPath = process.env.SSL_KEY_PATH || path.join(__dirname, 'ssl', 'apache.key');
const sslCertPath = process.env.SSL_CERT_PATH || path.join(__dirname, 'ssl', 'apache.crt');

let server;
const useHttps = fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath);

if (useHttps) {
  try {
    const options = {
      key: fs.readFileSync(sslKeyPath),
      cert: fs.readFileSync(sslCertPath)
    };
    server = https.createServer(options, app);
    console.log(`Certificados SSL cargados con éxito desde: ${sslKeyPath} y ${sslCertPath}`);
  } catch (error) {
    console.error('Error al cargar los certificados SSL:', error.message);
    process.exit(1);
  }
} else {
  console.log('No se encontraron certificados SSL válidos. Iniciando servidor HTTP sin seguridad...');
  server = http.createServer(app);
}

// Iniciar servidor
server.listen(PORT, () => {
  const protocol = useHttps ? 'https' : 'http';
  console.log(`Servidor de Fixture Mundial 2026 corriendo en ${protocol}://localhost:${PORT}`);
});
