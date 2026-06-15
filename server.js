const express = require('express');
const path = require('path');
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

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor de Fixture Mundial 2026 corriendo en http://localhost:${PORT}`);
});
