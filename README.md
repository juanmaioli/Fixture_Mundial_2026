# 🏆 Fixture Mundial 2026

Aplicación web interactiva desarrollada con **Node.js**, **Express**, **EJS** y **SQLite** (`better-sqlite3`) para realizar el seguimiento en vivo y simulación de la Copa del Mundo de la FIFA 2026.

---

## 🚀 Características Principales

- 🌐 **Sincronización en Vivo:** Conexión directa con la API Scoreboard de ESPN para descargar los resultados reales del torneo.
- ✏️ **Carga Manual de Goles:** Interfaz interactiva de edición rápida mediante un modal para ingresar resultados de forma manual.
- 📊 **Cálculo de Posiciones Oficial:** Sistema dinámico que calcula los puntos (3 por ganar, 1 por empatar), la diferencia de gol y los goles a favor de forma idéntica al reglamento de la FIFA.
- 🎨 **Estilo Premium Oscuro:** Interfaz optimizada con Bootstrap 5.3 oscuro y hojas de estilo a medida.
- 🏁 **Mapeo de Banderas Oficiales:** Visualización de las banderas locales de todas las selecciones participantes.

---

## 🛠️ Tecnologías Utilizadas

- **Servidor:** Node.js, Express.js
- **Motor de Plantillas:** EJS (Embedded JavaScript)
- **Base de Datos:** SQLite con el paquete síncrono `better-sqlite3`
- **Peticiones HTTP:** Axios
- **Estilos:** Bootstrap 5.3 (tema oscuro nativo)

---

## 📦 Instalación y Uso

1. **Instalar Dependencias:**
   ```bash
   npm install
   ```

2. **Inicializar Base de Datos Real:**
   Poblar SQLite con los 48 equipos y fixtures reales del Mundial 2026:
   ```bash
   node db/init.js
   ```

3. **Iniciar en Desarrollo:**
   Correr la aplicación con nodemon:
   ```bash
   npm run dev
   ```

4. **Acceder a la Aplicación:**
   Abrir en el navegador: **http://localhost:3000**
