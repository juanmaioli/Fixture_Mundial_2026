# 🏆 Fixture Mundial 2026

Aplicación web interactiva desarrollada con **Node.js**, **Express**, **EJS** y **SQLite** (`better-sqlite3`) para realizar el seguimiento en vivo, simulación y carga de resultados de la Copa del Mundo de la FIFA 2026.

---

## 🚀 Características Principales

- 🌐 **Sincronización en Vivo:** Conexión directa con la API de Scoreboard de ESPN. Cuenta con un sistema de traducción y normalización Unicode nativa de diacríticos para garantizar la coincidencia y actualización precisa de todas las selecciones participantes.
- ✏️ **Carga Manual de Goles:** Interfaz interactiva de edición rápida mediante un modal para ingresar resultados de forma manual.
- 📊 **Cálculo de Posiciones y Play-offs:** Sistema dinámico que calcula las tablas de posiciones e inicia de manera progresiva los cruces de 16avos de final a medida que culmina cada grupo individual, resolviendo al instante los emparejamientos directos.
- 🎨 **Estilo Premium Oscuro:** Interfaz optimizada con Bootstrap 5.3 oscuro y hojas de estilo a medida.
- 🏁 **Mapeo de Banderas Oficiales:** Visualización de las banderas locales de todas las selecciones participantes.
- 🔒 **Conexión HTTPS Segura:** Soporte nativo para HTTPS mediante certificados locales ubicados en `./ssl` (`apache.crt` y `apache.key`).
- 🐳 **Soporte para Docker:** Listo para levantar con un solo comando en contenedores persistiendo la base de datos y cargando certificados SSL de forma segura.

---

## 🛠️ Tecnologías Utilizadas

- **Servidor:** Node.js, Express.js (HTTP / HTTPS)
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

3. **Configurar certificados (Opcional):**
   Ubicá tus certificados SSL en una carpeta `./ssl` en la raíz con los nombres `apache.key` y `apache.crt` si deseás usar HTTPS.

4. **Iniciar en desarrollo:**
   Correr la aplicación con nodemon para cambios en tiempo real:
   ```bash
   npm run dev
   ```

5. **Acceder a la aplicación:**
   Abrir en el navegador: **https://localhost:3000** (o **http://localhost:3000** si no usás certificados).

---

### Opción 2: Ejecución con Docker (Recomendado)

La aplicación está contenerizada con soporte de persistencia de datos (volumen Docker para la base de datos de SQLite) y control inteligente de arranque:

1. **Construir y levantar el contenedor:**
   ```bash
   docker compose up -d --build
   ```

2. **Acceder a la aplicación:**
   Abrir en el navegador: **https://localhost:3000** (los certificados de `./ssl` se montan automáticamente en modo lectura).

3. **Detener el contenedor:**
   ```bash
   docker compose down
   ```

---

## 📜 Historial de Cambios Recientes

### v1.4.0
- 🚀 **Pre-llenado progresivo de play-offs:** Se modificó la lógica en el servicio de fixture para ubicar a las selecciones en la ronda de 16avos de final de forma incremental e inmediata apenas termina cada grupo, sin tener que esperar a que finalicen los 12 grupos. Los mejores terceros se siguen asignando al completarse la fase de grupos.

### v1.3.1
- 🐛 **Corrección en package.json:** Se actualizó el punto de entrada principal (`main`) a `server.js` solucionando fallos al iniciar la aplicación con `nodemon`.
- 🐛 **Soporte de traducción y diacríticos:** Se completaron las traducciones de selecciones en inglés a español en el scraper y se implementó una normalización Unicode robusta para caracteres especiales (`ü`, `ç`, tildes), logrando que partidos como los de España, Alemania, Corea del Sur y México se sincronicen correctamente.

