# Backend Implementation Plan — Coworking Reservation System

> Status legend: ⬜ Not started | 🔄 In progress | ✅ Done

---

## Overview

Fastify 5 + TypeScript + Prisma + PostgreSQL + Jest + mqtt.js + SSE.
Follows patterns from `XXX` (Fastify routes, Zod validation) and `XXX` (Prisma multi-file schemas, Docker, DatabaseService).

---

## Key Decisions

| Decision | Choice |
|---|---|
| **Auth** | API key table in DB with `role` column (`ADMIN` \| `USER`). Validated via `x-api-key` header. |
| **Validation** | Zod schemas for all request bodies/params/query strings. |
| **MQTT broker** | External (iot-simulator's Mosquitto on port 1883). Backend connects as subscriber. |
| **Telemetry aggregation** | 1-minute windows storing `avg`, `min`, `max` for all metrics. |
| **Real-time** | SSE endpoint (`GET /api/iot/sse`) pushing live telemetry + alert events. |
| **Testing** | Jest + ts-jest. Unit tests for services, integration tests via `fastify.inject()`. |

---

## Project Structure

```
darien-tech-node-test/
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── jest.config.ts
├── README.md
├── IA.md
├── prisma/
│   └── schema/
│       ├── schema.prisma          # generator + datasource only
│       ├── api-key.prisma
│       ├── lugar.prisma           # Place/Site
│       ├── espacio.prisma         # Space/Office
│       ├── reserva.prisma         # Reservation
│       ├── office-hours.prisma
│       ├── device-desired.prisma
│       ├── device-reported.prisma
│       ├── telemetry-aggregation.prisma
│       └── alert.prisma
├── src/
│   ├── app.ts                     # Fastify instance creation + plugin/hook registration
│   ├── server.ts                  # Entry point: starts server + MQTT subscriber
│   ├── config.ts                  # Env var parsing + typed config object
│   ├── database/
│   │   └── prisma.ts              # PrismaClient singleton
│   ├── auth/
│   │   ├── auth.hook.ts           # preHandler: validates x-api-key, attaches role
│   │   └── require-admin.hook.ts  # preHandler: requires ADMIN role
│   ├── routes/
│   │   ├── router.ts              # Central route registration
│   │   ├── status.route.ts        # GET /api/status
│   │   ├── lugares/
│   │   │   ├── index.ts
│   │   │   ├── create-lugar.route.ts
│   │   │   ├── find-all-lugares.route.ts
│   │   │   ├── find-lugar-by-id.route.ts
│   │   │   ├── update-lugar.route.ts
│   │   │   └── delete-lugar.route.ts
│   │   ├── espacios/
│   │   │   ├── index.ts
│   │   │   ├── create-espacio.route.ts
│   │   │   ├── find-all-espacios.route.ts
│   │   │   ├── find-espacio-by-id.route.ts
│   │   │   ├── update-espacio.route.ts
│   │   │   └── delete-espacio.route.ts
│   │   ├── reservas/
│   │   │   ├── index.ts
│   │   │   ├── create-reserva.route.ts
│   │   │   ├── find-all-reservas.route.ts
│   │   │   ├── find-reserva-by-id.route.ts
│   │   │   ├── update-reserva.route.ts
│   │   │   └── delete-reserva.route.ts
│   │   ├── iot/
│   │   │   ├── index.ts
│   │   │   ├── get-telemetry.route.ts
│   │   │   ├── get-alerts.route.ts
│   │   │   ├── get-digital-twin.route.ts
│   │   │   ├── update-desired.route.ts
│   │   │   ├── get-office-hours.route.ts
│   │   │   ├── update-office-hours.route.ts
│   │   │   └── sse-telemetry.route.ts
│   │   └── api-keys/
│   │       ├── index.ts
│   │       └── validate-key.route.ts
│   ├── services/
│   │   ├── lugar.service.ts
│   │   ├── espacio.service.ts
│   │   ├── reserva.service.ts
│   │   ├── reserva-validation.service.ts
│   │   ├── api-key.service.ts
│   │   ├── pagination.service.ts
│   │   └── iot/
│   │       ├── mqtt-subscriber.service.ts
│   │       ├── telemetry.service.ts
│   │       ├── digital-twin.service.ts
│   │       ├── alert-engine.service.ts
│   │       └── sse-manager.service.ts
│   ├── schemas/
│   │   ├── lugar.schema.ts
│   │   ├── espacio.schema.ts
│   │   ├── reserva.schema.ts
│   │   ├── pagination.schema.ts
│   │   └── iot.schema.ts
│   ├── types/
│   │   ├── fastify.d.ts           # Extend FastifyRequest with apiKeyRole/apiKeyId
│   │   ├── lugar.types.ts
│   │   ├── espacio.types.ts
│   │   ├── reserva.types.ts
│   │   ├── iot.types.ts
│   │   └── pagination.types.ts
│   └── utils/
│       ├── error-handler.ts
│       ├── logger.ts
│       └── date.utils.ts
├── __tests__/
│   ├── unit/
│   │   ├── reserva-validation.service.test.ts
│   │   ├── alert-engine.service.test.ts
│   │   ├── telemetry.service.test.ts
│   │   ├── pagination.service.test.ts
│   │   └── date.utils.test.ts
│   ├── integration/
│   │   ├── setup.ts
│   │   ├── teardown.ts
│   │   ├── lugares.test.ts
│   │   ├── espacios.test.ts
│   │   ├── reservas.test.ts
│   │   └── iot.test.ts
│   └── helpers/
│       ├── fixtures.ts
│       └── test-client.ts
```

---

## Phase 1: Project Scaffolding ⬜

- [x] **1.1** Initialize `package.json` with all dependencies and scripts
- [x] **1.2** Create `tsconfig.json`
- [x] **1.3** Create `jest.config.ts`
- [x] **1.4** Create `.env.example`
- [x] **1.5** Create `.gitignore`
- [x] **1.6** Create `Dockerfile`
- [x] **1.7** Create `docker-compose.yml`
- [x] **1.8** Create initial `README.md`

## Phase 2: Database Schema (Prisma) ✅

- [x] **2.1** `prisma/schema/schema.prisma` — generator + datasource (prismaSchemaFolder)
- [x] **2.2** `prisma/schema/api-key.prisma` — ApiKey model + ApiKeyRole enum
- [x] **2.3** `prisma/schema/lugar.prisma` — Lugar model
- [x] **2.4** `prisma/schema/espacio.prisma` — Espacio model
- [x] **2.5** `prisma/schema/reserva.prisma` — Reserva model
- [x] **2.6** `prisma/schema/office-hours.prisma` — OfficeHours model
- [x] **2.7** `prisma/schema/device-desired.prisma` — DeviceDesired model
- [x] **2.8** `prisma/schema/device-reported.prisma` — DeviceReported model
- [x] **2.9** `prisma/schema/telemetry-aggregation.prisma` — TelemetryAggregation model
- [x] **2.10** `prisma/schema/alert.prisma` — Alert model + AlertKind enum
- [x] **2.11** Run initial migration: `npx prisma migrate dev --name initial_schema`
- [x] **2.12** Create `prisma/seed.ts` — seeds API keys, lugares, espacios, office hours, sample reservations

## Phase 3: App Foundation ✅

- [x] **3.1** `src/config.ts` — typed env var config
- [x] **3.2** `src/database/prisma.ts` — PrismaClient singleton with lifecycle hooks
- [x] **3.3** `src/utils/logger.ts` — Pino logger
- [x] **3.4** `src/utils/error-handler.ts` — Fastify error handler (Zod, Prisma, generic)
- [x] **3.5** `src/types/fastify.d.ts` — FastifyRequest extension
- [x] **3.6** `src/app.ts` — `buildApp()` function (Fastify + plugins + hooks + routes)
- [x] **3.7** `src/server.ts` — entry point, starts app + MQTT subscriber

## Phase 4: Authentication ✅

- [x] **4.1** `src/services/api-key.service.ts` — validateApiKey with in-memory TTL cache
- [x] **4.2** `src/auth/auth.hook.ts` — preHandler: reads x-api-key, validates, attaches role
- [x] **4.3** `src/auth/require-admin.hook.ts` — preHandler: checks ADMIN role
- [x] **4.4** `src/routes/api-keys/validate-key.route.ts` — POST /api/auth/validate

## Phase 5: CRUD — Locations ✅

- [x] **5.1** `src/schemas/location.schema.ts` — Zod schemas
- [x] **5.2** `src/types/location.types.ts`
- [x] **5.3** `src/services/location.service.ts` — CRUD functions
- [x] **5.4** Route files in `src/routes/locations/` (5 routes)
- [x] **5.5** `src/routes/locations/index.ts` — registerLocationRoutes()

## Phase 6: CRUD — Spaces ✅

- [x] **6.1** `src/schemas/space.schema.ts`
- [x] **6.2** `src/types/space.types.ts`
- [x] **6.3** `src/services/space.service.ts` — CRUD + filter by locationId
- [x] **6.4** Route files in `src/routes/spaces/` (5 routes)
- [x] **6.5** `src/routes/spaces/index.ts`

## Phase 7: CRUD — Bookings ✅

- [x] **7.1** `src/schemas/booking.schema.ts`
- [x] **7.2** `src/schemas/pagination.schema.ts`
- [x] **7.3** `src/types/booking.types.ts` and `src/types/pagination.types.ts`
- [x] **7.4** Pagination implemented inline in booking service
- [x] **7.5** `src/services/booking-validation.service.ts` — conflict + weekly limit checks
- [x] **7.6** `src/services/booking.service.ts` — CRUD with business rules
- [x] **7.7** Route files in `src/routes/bookings/` (5 routes)
- [x] **7.8** `src/routes/bookings/index.ts`

## Phase 8: IoT — MQTT & Processing ✅

- [x] **8.1** `src/types/iot.types.ts`
- [x] **8.2** `src/schemas/iot.schema.ts`
- [x] **8.3** `src/utils/date.utils.ts` — office hours, window, week helpers
- [x] **8.4** `src/services/iot/mqtt-subscriber.service.ts` — connects, subscribes, dispatches
- [x] **8.5** `src/services/iot/telemetry.service.ts` — aggregation upsert + SSE broadcast
- [x] **8.6** `src/services/iot/digital-twin.service.ts` — persist desired/reported, detect divergence
- [x] **8.7** `src/services/iot/alert-engine.service.ts` — CO2, OCCUPANCY_MAX, OCCUPANCY_UNEXPECTED rules
- [x] **8.8** `src/services/iot/sse-manager.service.ts` — SSE client registry + broadcast

## Phase 9: IoT Routes ✅

- [x] **9.1** `get-telemetry.route.ts` — GET /api/v1/iot/spaces/:id/telemetry
- [x] **9.2** `get-alerts.route.ts` — GET /api/v1/iot/spaces/:id/alerts
- [x] **9.3** `get-digital-twin.route.ts` — GET /api/v1/iot/spaces/:id/twin
- [x] **9.4** `update-desired.route.ts` — PATCH /api/v1/iot/spaces/:id/desired (admin)
- [x] **9.5** `get-office-hours.route.ts` — GET /api/v1/iot/spaces/:id/office-hours
- [x] **9.6** `update-office-hours.route.ts` — PUT /api/v1/iot/spaces/:id/office-hours (admin)
- [x] **9.7** `sse-telemetry.route.ts` — GET /api/v1/iot/stream (SSE)
- [x] **9.8** `src/routes/iot/index.ts`

## Phase 10: Central Route Registration ✅

- [x] **10.1** `src/routes/router.ts` — imports and registers all route groups
- [x] **10.2** `src/routes/health.route.ts`
- [x] **10.3** Wire up routes in `src/app.ts`

## Phase 11: Testing ✅

- [x] **11.1** `__tests__/setup.ts` — test setup
- [x] **11.2** Unit tests:
  - `booking-validation.test.ts`
  - `api-key.service.test.ts`
  - `date.utils.test.ts`
- [x] **11.3** Integration tests:
  - `health.test.ts` (includes auth 401/403 scenarios)
  - `locations.test.ts`
  - `spaces.test.ts`
  - `bookings.test.ts` (includes weekly limit test)
  - `iot.test.ts`

## Phase 12: Docker & Documentation ✅

- [x] **12.1** Finalize `docker-compose.yml` (postgres + api)
- [x] **12.2** Add `docker-compose.override.yml` for development
- [x] **12.3** Complete `README.md` with setup, API reference, IoT testing guide
- [x] **12.4** Update `IA.md` with AI usage notes

---

## API Reference

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/validate` | None | Validate API key, returns role |

### Lugares
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/lugares` | User+ | List all places |
| POST | `/api/lugares` | Admin | Create place |
| GET | `/api/lugares/:id` | User+ | Get place + spaces |
| PUT | `/api/lugares/:id` | Admin | Update place |
| DELETE | `/api/lugares/:id` | Admin | Delete place |

### Espacios
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/espacios?lugarId=` | User+ | List spaces (filter by lugar) |
| POST | `/api/espacios` | Admin | Create space |
| GET | `/api/espacios/:id` | User+ | Get space detail |
| PUT | `/api/espacios/:id` | Admin | Update space |
| DELETE | `/api/espacios/:id` | Admin | Delete space |

### Reservas
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/reservas?page=&pageSize=` | User+ | Paginated list |
| POST | `/api/reservas` | User+ | Create reservation |
| GET | `/api/reservas/:id` | User+ | Get one |
| PUT | `/api/reservas/:id` | User+ | Update |
| DELETE | `/api/reservas/:id` | User+ | Delete |

### IoT (Admin only)
| Method | Path | Description |
|---|---|---|
| GET | `/api/iot/espacios/:id/telemetry?minutes=60` | Aggregation history |
| GET | `/api/iot/espacios/:id/alerts?active=` | Alerts list |
| GET | `/api/iot/espacios/:id/twin` | Digital twin state |
| PUT | `/api/iot/espacios/:id/desired` | Update + publish desired config |
| GET | `/api/iot/espacios/:id/office-hours` | Office hours |
| PUT | `/api/iot/espacios/:id/office-hours` | Update office hours |
| GET | `/api/iot/sse` | SSE stream (telemetry + alerts) |

### Status
| Method | Path | Description |
|---|---|---|
| GET | `/api/status` | Health check |
