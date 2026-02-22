import { buildApp } from '../../src/app'

const ADMIN_KEY = 'admin-secret-key-123'
const USER_KEY = 'user-secret-key-456'
const ESPACIO_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'

let app: Awaited<ReturnType<typeof buildApp>>

beforeAll(async () => {
  app = await buildApp()
  await app.ready()
})

afterAll(async () => {
  // Restore desired config to seed values so subsequent test runs are idempotent
  await app.inject({
    method: 'PATCH',
    url: `/api/v1/iot/espacios/${ESPACIO_ID}/desired`,
    headers: { 'x-api-key': ADMIN_KEY, 'Content-Type': 'application/json' },
    payload: { samplingIntervalSec: 10, co2AlertThreshold: 1000 },
  })
  await app.close()
})

describe('IoT Endpoints', () => {
  describe('GET /api/v1/iot/espacios/:id/twin', () => {
    it('returns desired and reported objects', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/iot/espacios/${ESPACIO_ID}/twin`,
        headers: { 'x-api-key': USER_KEY },
      })
      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.body)
      expect(body).toHaveProperty('desired')
      expect(typeof body.desired.samplingIntervalSec).toBe('number')
    })
  })

  describe('PATCH /api/v1/iot/espacios/:id/desired', () => {
    it('updates desired config (admin only)', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/iot/espacios/${ESPACIO_ID}/desired`,
        headers: { 'x-api-key': ADMIN_KEY, 'Content-Type': 'application/json' },
        payload: { samplingIntervalSec: 30, co2AlertThreshold: 1200 },
      })
      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.body)
      expect(body.samplingIntervalSec).toBe(30)
      expect(body.co2AlertThreshold).toBe(1200)
    })

    it('requires admin — user gets 403', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/iot/espacios/${ESPACIO_ID}/desired`,
        headers: { 'x-api-key': USER_KEY, 'Content-Type': 'application/json' },
        payload: { samplingIntervalSec: 5 },
      })
      expect(res.statusCode).toBe(403)
    })

    it('validates co2AlertThreshold range', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/iot/espacios/${ESPACIO_ID}/desired`,
        headers: { 'x-api-key': ADMIN_KEY, 'Content-Type': 'application/json' },
        payload: { co2AlertThreshold: 99999 }, // max is 5000
      })
      expect(res.statusCode).toBe(400)
    })
  })

  describe('GET /api/v1/iot/espacios/:id/office-hours', () => {
    it('returns office hours for seeded espacio', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/iot/espacios/${ESPACIO_ID}/office-hours`,
        headers: { 'x-api-key': USER_KEY },
      })
      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.body)
      expect(body.apertura).toBeDefined()
      expect(body.cierre).toBeDefined()
    })
  })

  describe('GET /api/v1/iot/espacios/:id/telemetry', () => {
    it('returns empty array when no telemetry data exists', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/iot/espacios/${ESPACIO_ID}/telemetry?minutes=60`,
        headers: { 'x-api-key': USER_KEY },
      })
      expect(res.statusCode).toBe(200)
      expect(JSON.parse(res.body)).toEqual([])
    })
  })

  describe('GET /api/v1/iot/espacios/:id/alerts', () => {
    it('returns empty array initially', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/iot/espacios/${ESPACIO_ID}/alerts`,
        headers: { 'x-api-key': USER_KEY },
      })
      expect(res.statusCode).toBe(200)
      expect(Array.isArray(JSON.parse(res.body))).toBe(true)
    })
  })
})
