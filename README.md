<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:5865F2,100:23272A&height=200&section=header&text=Discord%20Server%20API&fontSize=40&fontColor=ffffff" />
</p>

# Discord Server API

<p align="left">
  <img src="https://img.shields.io/badge/Node.js-20-green?logo=node.js" />
  <img src="https://img.shields.io/badge/NestJS-red?logo=nestjs" />
  <img src="https://img.shields.io/badge/TypeScript-blue?logo=typescript" />
  <img src="https://img.shields.io/badge/PostgreSQL-blue?logo=postgresql" />
  <img src="https://img.shields.io/badge/Prisma-black?logo=prisma" />
  <img src="https://img.shields.io/badge/Docker-blue?logo=docker" />
  <img src="https://img.shields.io/badge/Auth-JWT-orange" />
  <img src="https://img.shields.io/badge/Docs-Swagger-green?logo=swagger" />
  <img src="https://img.shields.io/badge/Test-Jest-red?logo=jest" />
  <img src="https://img.shields.io/badge/License-Educational-lightgrey" />
</p>

API REST desarrollada con **NestJS** que simula el funcionamiento básico de un sistema tipo Discord, incluyendo gestión de usuarios, servidores (guilds), canales y mensajería con control de roles y cifrado de mensajes.


## Características principales

*  Autenticación con JWT
*  Gestión de usuarios
*  Gestión de servidores (guilds)
*  Gestión de canales
*  Envío y lectura de mensajes
*  Sistema de roles (`OWNER`, `ADMIN`, `MEMBER`)
*  Cifrado de mensajes por canal
*  Documentación automática con Swagger
*  Tests unitarios con Jest
*  Contenerización completa con Docker
*  Sistema de logs para monitorización y depuración de la aplicación


## Arquitectura

La aplicación está estructurada en módulos de NestJS:

* `Auth` → autenticación y generación de tokens
* `Users` → gestión de usuarios
* `Guilds` → servidores y membresías
* `Channels` → canales dentro de cada guild
* `Messages` → mensajería entre usuarios
* `Common` → guards, decorators y servicios compartidos
* `Prisma` → acceso a base de datos


##  Sistema de roles

Se implementa control de acceso basado en roles:

* `OWNER` → control total del servidor
* `ADMIN` → gestión parcial (extensible)
* `MEMBER` → uso básico

### Restricciones clave

* Solo el `OWNER` puede:

  * añadir miembros
  * modificar roles
  * eliminar canales
* No se puede:

  * asignar el rol `OWNER` mediante endpoints
  * modificar el rol del `OWNER`
* Solo miembros del guild pueden:

  * enviar mensajes
  * leer mensajes
  * crear canales


##  Cifrado de mensajes

Cada canal tiene su propia clave de cifrado:

* Se genera una clave por canal
* Se cifra con una `MASTER_KEY`
* Los mensajes se almacenan cifrados en base de datos
* Se descifran automáticamente al recuperarlos


##  Base de datos

Se utiliza **PostgreSQL** junto con **Prisma ORM**.

### Migraciones

Las migraciones permiten versionar la base de datos:

```bash
npx prisma migrate deploy
```

En Docker, se ejecutan automáticamente al iniciar la aplicación.


##  Docker

La aplicación está completamente contenerizada.

### Servicios

* `postgres` → base de datos
* `app` → backend NestJS

### Levantar el proyecto

```bash
docker compose up --build
```

## Modo desarrollo

Para trabajar en local sin levantar el contenedor de la API, se puede arrancar solo PostgreSQL con Docker:

```bash
docker compose up -d postgres
```

En este modo, la API se ejecuta en local con:

```bash
npm run start:dev
```

Por eso, en el archivo `.env`, la conexión debe apuntar a `localhost`:

```env
DATABASE_URL="postgresql://discord:discord@localhost:5432/discord?schema=public"
```

Si la base de datos está recién creada o vacía, hay que aplicar las migraciones de Prisma para crear las tablas:

```bash
npx prisma migrate deploy
```

Si ya estaban aplicadas, Prisma indicará que no hay migraciones pendientes.

##  Acceso

* API → http://localhost:3000
* Swagger → http://localhost:3000/api/docs


##  Variables de entorno

Ejemplo (`.env`):

```env
POSTGRES_USER=discord
POSTGRES_PASSWORD=discord
POSTGRES_DB=discord
DATABASE_URL=postgresql://discord:discord@postgres:5432/discord?schema=public
JWT_SECRET=your-secret
JWT_EXPIRES_IN=24h
MASTER_KEY=your-64-char-hex-key
```

### Nota importante

* En Docker → usar `postgres` como host
* En local (Prisma Studio) → usar `localhost`


## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm install` | Instala las dependencias del proyecto |
| `npm run build` | Compila el proyecto y comprueba errores de build |
| `npm run start:dev` | Levanta la aplicación en modo desarrollo |
| `npm test` | Ejecuta los tests automatizados |


## Tests

Se han implementado tests unitarios con Jest:

```bash
npm test
```

Cobertura sobre:

* AuthService
* UsersService
* GuildsService
* MessagesService



##  Swagger

La API está documentada con Swagger:

* Descripción de endpoints
* Restricciones de acceso
* Ejemplos de uso



##  Decisiones de diseño

* Uso de `RolesGuard` para control de permisos
* Separación de responsabilidades por módulos
* Cifrado de mensajes dentro de la propia aplicación, para que no puedan leerse en la Base de Datos
* Uso de migraciones para consistencia de Base de Datos
* Docker para reproducibilidad del entorno

##  Conclusión

Este proyecto implementa una API completa, segura y estructurada, aplicando buenas prácticas de desarrollo backend:

* arquitectura modular
* control de acceso
* cifrado de datos
* testing
* documentación
* contenerización


##  Autora

**Natalia Garré Ramo** 

Proyecto desarrollado como parte de la asignatura de **Servicios y Procesos** del Grado Superior de Desarrollo de Aplicaciones Multiplataforma.





