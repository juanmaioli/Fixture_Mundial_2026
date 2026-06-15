# Usar la imagen base oficial de Node.js Alpine
FROM node:20-alpine

# Instalar dependencias del sistema necesarias para compilar better-sqlite3
RUN apk add --no-cache python3 make g++

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de definición de dependencias
COPY package*.json ./

# Instalar dependencias del proyecto omitiendo devDependencies y compilando los módulos nativos
RUN npm install --omit=dev

# Copiar el resto del código de la aplicación
COPY . .

# Exponer el puerto en el que corre la aplicación
EXPOSE 3000

# Variables de entorno por defecto
ENV PORT=3000
ENV NODE_ENV=production
ENV DB_PATH=/app/data/fixture.db

# Iniciar la aplicación (start.js comprobará e inicializará la BD si no existe)
CMD ["npm", "start"]
