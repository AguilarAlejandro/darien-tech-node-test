# CoworkSpace API

API REST para la gestión de reservas en espacios de coworking. Construida con **Fastify**, **TypeScript**, **Prisma** y **PostgreSQL**, con soporte de telemetría IoT vía MQTT.

---

## Requisitos previos

- [Node.js](https://nodejs.org/) v20 o superior
- [Docker](https://www.docker.com/) y Docker Compose (para levantamiento con contenedores)
- Un broker MQTT accesible (solo necesario para el módulo IoT)
- `npm` instalado

---

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto basándote en el siguiente template:

```env
# Base de datos
DATABASE_URL=postgresql://cowork_user:cowork_pass@localhost:5432/cowork_db
DB_USER=cowork_user
DB_PASSWORD=cowork_pass
DB_NAME=cowork_db
DB_PORT=5432

# API
API_PORT=3000

# MQTT (para módulo IoT)
MQTT_URL=mqtt://localhost:1883
```

> Los valores por defecto ya están configurados en `docker-compose.yml` y `docker-compose.override.yml`, por lo que el archivo `.env` es **opcional** al usar Docker.

---

## Levantar con Docker (recomendado)

### Modo producción

```bash
# Construir imágenes y levantar todos los servicios (postgres + api)
docker compose up --build
```

La API estará disponible en: `http://localhost:3000`

### Modo desarrollo (hot reload)

```bash
# Usa docker-compose.override.yml automáticamente
docker compose up --build
```

Con el override, el código fuente se monta como volumen y el servidor se reinicia automáticamente al guardar cambios.

### Detener los servicios

```bash
docker compose down

# Para eliminar también el volumen de la base de datos:
docker compose down -v
```

---

## Levantar de forma local (sin Docker)

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar la base de datos

Asegúrate de tener PostgreSQL corriendo y configura `DATABASE_URL` en tu `.env`.

```bash
# Aplicar migraciones y generar el cliente Prisma
npm run prisma:migrate

# Cargar datos de ejemplo (lugares, espacios, reservas, alertas, telemetría y API keys de prueba)
npm run prisma:seed
```

### 3. Ejecutar en modo desarrollo

```bash
npm run dev
```

### 4. Compilar y ejecutar en modo producción

```bash
npm run build
npm start
```

---

## API Keys de prueba (creadas por el seed)

| Key | Rol | Permisos |
|-----|-----|----------|
| `admin-secret-key-123` | ADMIN | Lectura + escritura en todos los recursos |
| `user-secret-key-456` | USER | Solo lectura + crear/cancelar reservas propias |

Envía la key en el header de cada petición:

```
x-api-key: admin-secret-key-123
```

---

## Endpoints principales

### Locations (`/api/v1/locations`)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/locations` | List all locations |
| GET | `/api/v1/locations/:id` | Get location by ID |
| POST | `/api/v1/locations` | Create location *(ADMIN)* |
| PATCH | `/api/v1/locations/:id` | Update location *(ADMIN)* |
| DELETE | `/api/v1/locations/:id` | Delete location *(ADMIN)* |

### Spaces (`/api/v1/spaces`)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/spaces` | List spaces (filter: `locationId`) |
| GET | `/api/v1/spaces/:id` | Get space by ID |
| POST | `/api/v1/spaces` | Create space *(ADMIN)* |
| PATCH | `/api/v1/spaces/:id` | Update space *(ADMIN)* |
| DELETE | `/api/v1/spaces/:id` | Delete space *(ADMIN)* |

### Bookings (`/api/v1/bookings`)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/bookings` | Listar reservas con paginación (`page`, `pageSize`, `clientEmail` parcial, `spaceId`, `dateFrom`, `dateTo`) |
| GET | `/api/v1/bookings/:id` | Get booking by ID |
| POST | `/api/v1/bookings` | Create booking |
| PATCH | `/api/v1/bookings/:id` | Update booking *(ADMIN)* |
| DELETE | `/api/v1/bookings/:id` | Delete booking |

### IoT (`/api/v1/iot`)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/iot/spaces/:id/twin` | Get digital twin for a space |
| PATCH | `/api/v1/iot/spaces/:id/desired` | Update desired config *(ADMIN)* |
| GET | `/api/v1/iot/spaces/:id/telemetry` | Telemetry history |
| GET | `/api/v1/iot/spaces/:id/alerts` | Alerts for a space |
| GET | `/api/v1/iot/stream?key=\<api-key\>` | Stream SSE en tiempo real (autenticación por query param) |

---

## Reglas de negocio

- **Sin conflictos de horario**: no se pueden crear dos reservas que se solapen en el mismo espacio. Retorna `409 Conflict`.
- **Máximo 3 reservas por semana**: un mismo email no puede tener más de 3 reservas activas en la semana ISO actual. Retorna `400 Bad Request`.

---

## Ejecutar pruebas

```bash
# Todas las pruebas
npm test

# Solo pruebas unitarias
npm run test:unit

# Solo pruebas de integración
npm run test:integration

# Con reporte de cobertura
npm run test:coverage
```

> Las pruebas de integración requieren una base de datos PostgreSQL disponible. Configura `DATABASE_URL` en tu entorno o utiliza el contenedor Docker.

---

## Módulo IoT

El sistema incluye un consumidor MQTT que se conecta al broker configurado en `MQTT_URL` y se suscribe a los tópicos:

- `sites/{locationId}/offices/{spaceId}/telemetry` — telemetría en tiempo real
- `sites/{locationId}/offices/{spaceId}/reported` — estado reportado del dispositivo

**Funcionalidades:**
- Ingestión y agregación de telemetría por minuto (temperatura, CO₂, humedad, ocupación, potencia)
- Digital twin (estado `desired` / `reported`) con publicación de vuelta al broker
- Motor de alertas con ventanas de tiempo:
  - `CO2`: se abre si CO₂ > umbral durante 5 minutos, se cierra tras 2 minutos normal
  - `OCCUPANCY_MAX`: se abre si ocupación ≥ 100% durante 2 minutos
  - `OCCUPANCY_UNEXPECTED`: se abre si hay ocupación fuera de horario durante 10 minutos
- Stream SSE (`GET /api/v1/iot/stream?key=<api-key>`) para actualizaciones en tiempo real al frontend

### Configurar y correr el simulador IoT

El simulador requiere un broker MQTT (Mosquitto). El repositorio `iot-simulator` incluye un `docker.compose.yml` para levantarlo:

```bash
cd ../iot-simulator   # o la ruta donde esté el simulador
docker compose -f docker.compose.yml up -d
```

Luego lanza el simulador apuntando a un espacio concreto. Los argumentos son:
- `--site-id`: el UUID de la **location** (sede)
- `--office-id`: el UUID del **space** (espacio)

Estos deben coincidir con IDs existentes en la base de datos. Con los datos del seed:

```bash
# Sala Azul — Torre de Innovación Norte
node index.js --site-id 11111111-1111-1111-1111-111111111111 --office-id aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa

# Área Colaborativa Verde — Torre de Innovación Norte
node index.js --site-id 11111111-1111-1111-1111-111111111111 --office-id bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb

# Cabina Creativa A — Hub Creativo Sur
node index.js --site-id 22222222-2222-2222-2222-222222222222 --office-id cccccccc-cccc-cccc-cccc-cccccccccccc

# Sala Principal — Hub Creativo Sur
node index.js --site-id 22222222-2222-2222-2222-222222222222 --office-id dddddddd-dddd-dddd-dddd-dddddddddddd
```

Cada proceso publica una lectura cada 10 segundos (configurable con `INTERVAL_SEC` en el `.env` del simulador). Cada lectura incluye temperatura, humedad, CO₂, ocupación y potencia con jitter aleatorio alrededor de los valores base.

**Variables de entorno del simulador** (archivo `.env` en la carpeta `iot-simulator`):

```env
MQTT_URL=mqtt://localhost:1883
BASE_TEMP_C=23
BASE_HUMIDITY_PCT=48
BASE_CO2_PPM=800      # Subir a 1100 para forzar alertas de CO₂
BASE_OCCUPANCY=3
BASE_POWER_W=120
INTERVAL_SEC=10
```

> Para forzar una alerta de CO₂, setea `BASE_CO2_PPM=1100` y espera ~5 minutos.

---

## Estructura del proyecto

```
src/
├── server.ts          # Entry point
├── app.ts             # Configuración de Fastify
├── config.ts          # Variables de entorno
├── auth/              # Hooks de autenticación (API key, rol admin)
├── database/          # Singleton de Prisma
├── routes/            # HTTP handlers (locations, spaces, bookings, iot)
├── schemas/           # Esquemas Zod para validación y tipos
├── services/          # Lógica de negocio
│   └── iot/           # MQTT, digital twin, telemetría, alertas
├── types/             # Tipos TypeScript compartidos
└── utils/             # Utilidades (fechas, manejo de errores)
prisma/
├── schema/            # Esquemas Prisma separados por modelo
└── seed.ts            # Datos de prueba
__tests__/
├── unit/              # Pruebas unitarias
└── integration/       # Pruebas de integración
```