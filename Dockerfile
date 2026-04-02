# FASE 1: Etapa de construcción

# Usa imagen oficial de Node basada ena distribución Linux ligera
# A esta etapa de construcción la llamamos "builder" (esto permitirá copiar archivos desde esta etapa a la siguiente)
FROM node:20-alpine AS builder

# Establece el directorio de trabajo dentro del contenedor
# A partir de aquí, los comandos se ejecutan dentro de /app
WORKDIR /app

# Copia los archivos de configuración de npm (package.json y package-lock.json) al contenedor dentro de /app
COPY package*.json ./
# Instala dependencias del proyecto usando "npm ci" y no "npm install" para asegurar que se instalen exactamente las versiones especificadas en package-lock.json
RUN npm ci

# Copia la carpeta Prisma (schema y migraciones) al contenedor dentro de /app
COPY prisma ./prisma
# Ejecuta ese comando para generar el cliente de Prisma a partir del esquema definido en el directorio "prisma"
# El cliente generado luego se usa en el código con "import { PrismaClient } from '@prisma/client';"
RUN npx prisma generate

# Copia el resto de los archivos del proyecto al contenedor dentro de /app
COPY . .
# Compilamos la aplicación: convertimos proyecto TypeScript a JavaScript para que pueda ser ejecutado por Node.js
RUN npm run build


# FASE 2: Etapa de producción

# Partimos de otra imagen limpia de node:20-alpine para la etapa de producción, 
# lo que reduce el tamaño final de la imagen al no incluir herramientas de construcción
FROM node:20-alpine

# Definimos un nuevo /app como directorio de trabajo para esta etapa, donde se ejecutará la aplicación ya compilada
WORKDIR /app

# Copia el código compilado desde la fase builder
COPY --from=builder /app/dist ./dist
# Copia las dependencias instaladas desde la fase builder
COPY --from=builder /app/node_modules ./node_modules
# Copia package.json y package-lock.json
COPY --from=builder /app/package*.json ./
# Copia la carpeta prisma para poder aplicar migraciones en el arranque
COPY --from=builder /app/prisma ./prisma



# Indica que la aplicación escucha en el puerto 3000
EXPOSE 3000

# Al iniciar el contenedor:
# 1) aplica migraciones pendientes en la base de datos
# 2) arranca la aplicación compilada
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]