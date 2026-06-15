# 🏆 Fixture Mundial 2026

Aplicación web interactiva desarrollada con **Node.js**, **Express**, **EJS** y **SQLite** (`better-sqlite3`) para realizar el seguimiento en vivo, simulación y carga de resultados de la Copa del Mundo de la FIFA 2026.

---

## 🚀 Características Principales

- 🌐 **Sincronización en Vivo:** Conexión directa con la API de Scoreboard de ESPN para descargar los resultados reales del torneo.
- ✏️ **Carga Manual de Goles:** Interfaz interactiva de edición rápida mediante un modal para ingresar resultados de forma manual.
- 📊 **Cálculo de Posiciones Oficial:** Sistema dinámico que calcula los puntos (3 por ganar, 1 por empatar), la diferencia de gol y los goles a favor de forma idéntica al reglamento de la FIFA.
- 🎨 **Estilo Premium Oscuro:** Interfaz optimizada con Bootstrap 5.3 oscuro y hojas de estilo a medida.
- 🏁 **Mapeo de Banderas Oficiales:** Visualización de las banderas locales de todas las selecciones participantes.
- 🐳 **Soporte para Docker:** Listo para levantar con un solo comando en contenedores persistiendo la base de datos de SQLite.

---

## 🛠️ Tecnologías Utilizadas

- **Servidor:** Node.js, Express.js
- **Motor de Plantillas:** EJS (Embedded JavaScript)
- **Base de Datos:** SQLite con el paquete síncrono `better-sqlite3`
- **Peticiones HTTP:** Axios
- **Estilos:** Bootstrap 5.3 (tema oscuro nativo)
- **Despliegue/Contenerización:** Docker & Docker Compose

---

## 📦 Instalación y Uso

### Opción 1: Ejecución Local Nativa

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Inicializar base de datos:**
   Poblar SQLite con las 48 selecciones y fixtures reales del Mundial:
   ```bash
   node db/init.js
   ```

3. **Iniciar en desarrollo:**
   Correr la aplicación con nodemon para cambios en tiempo real:
   ```bash
   npm run dev
   ```

4. **Acceder a la aplicación:**
   Abrir en el navegador: **http://localhost:3000**

---

### Opción 2: Ejecución con Docker (Recomendado para producción)

La aplicación está contenerizada con soporte de persistencia de datos (volumen Docker para la base de datos de SQLite) y control inteligente de arranque:

1. **Construir y levantar el contenedor:**
   ```bash
   docker compose up -d --build
   ```

2. **Acceder a la aplicación:**
   Abrir en el navegador: **http://localhost:3000**

3. **Detener el contenedor:**
   ```bash
   docker compose down
   ```
