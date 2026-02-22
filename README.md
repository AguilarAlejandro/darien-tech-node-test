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

# Cargar datos de ejemplo (lugares, espacios y API keys de prueba)
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

La documentación completa está disponible en **Swagger UI**: `http://localhost:3000/docs`

### Lugares (`/api/v1/lugares`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/lugares` | Listar todos los lugares |
| GET | `/api/v1/lugares/:id` | Obtener un lugar por ID |
| POST | `/api/v1/lugares` | Crear lugar *(ADMIN)* |
| PATCH | `/api/v1/lugares/:id` | Actualizar lugar *(ADMIN)* |
| DELETE | `/api/v1/lugares/:id` | Eliminar lugar *(ADMIN)* |

### Espacios (`/api/v1/espacios`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/espacios` | Listar espacios (filtros: `lugarId`, `tipo`, `activo`) |
| GET | `/api/v1/espacios/:id` | Obtener espacio por ID |
| POST | `/api/v1/espacios` | Crear espacio *(ADMIN)* |
| PATCH | `/api/v1/espacios/:id` | Actualizar espacio *(ADMIN)* |
| DELETE | `/api/v1/espacios/:id` | Eliminar espacio *(ADMIN)* |

### Reservas (`/api/v1/reservas`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/reservas` | Listar reservas con paginación (`page`, `pageSize`) |
| GET | `/api/v1/reservas/:id` | Obtener reserva por ID |
| POST | `/api/v1/reservas` | Crear reserva |
| PATCH | `/api/v1/reservas/:id` | Actualizar reserva *(ADMIN)* |
| DELETE | `/api/v1/reservas/:id` | Eliminar reserva |

### IoT (`/api/v1/iot`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/iot/espacios/:id/twin` | Obtener digital twin del espacio |
| PATCH | `/api/v1/iot/espacios/:id/desired` | Actualizar configuración deseada *(ADMIN)* |
| GET | `/api/v1/iot/espacios/:id/telemetry` | Historial de telemetría |
| GET | `/api/v1/iot/espacios/:id/alerts` | Alertas del espacio |
| GET | `/api/v1/iot/stream` | Stream SSE en tiempo real |

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

## Módulo IoT (Bonus)

El sistema incluye un consumidor MQTT que se conecta al broker configurado en `MQTT_URL` y se suscribe a los tópicos:

- `sites/+/offices/+/telemetry` — telemetría en tiempo real
- `sites/+/offices/+/reported` — estado reportado del dispositivo

**Funcionalidades implementadas:**
- Ingestión y agregación de telemetría por minuto (temperatura, CO₂, humedad, ocupación, batería)
- Digital twin (estado `desired` / `reported`) con publicación de vuelta al broker
- Motor de alertas: CO₂ elevado, ocupación máxima y ocupación fuera de horario
- Marcado de telemetría fuera de horario de oficina
- Stream SSE (`/api/v1/iot/stream`) para actualizaciones en tiempo real al frontend

Para correr el simulador IoT, consulta el repositorio [`iot-simulator`](https://github.com/.../iot-simulator) y su guía de uso.

---

## Estructura del proyecto

```
src/
├── server.ts          # Entry point
├── app.ts             # Configuración de Fastify
├── config.ts          # Variables de entorno
├── auth/              # Hooks de autenticación (API key, rol admin)
├── database/          # Singleton de Prisma
├── routes/            # Handlers HTTP (lugares, espacios, reservas, iot)
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