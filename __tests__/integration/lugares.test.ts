import { buildApp } from '../../src/app'

const ADMIN_KEY = 'admin-secret-key-123'
const USER_KEY = 'user-secret-key-456'

let app: Awaited<ReturnType<typeof buildApp>>

beforeAll(async () => {
  app = await buildApp()
  await app.ready()
})

afterAll(async () => {
  await app.close()
})

describe('Lugares CRUD', () => {
  let createdId: string

  it('GET /api/v1/lugares returns array', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/lugares',
      headers: { 'x-api-key': USER_KEY },
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(Array.isArray(body)).toBe(true)
    expect(body.length).toBeGreaterThanOrEqual(2)
  })

  it('POST /api/v1/lugares creates a new lugar (admin only)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/lugares',
      headers: { 'x-api-key': ADMIN_KEY, 'Content-Type': 'application/json' },
      payload: { nombre: 'Test Lugar Integration', latitud: 19.4, longitud: -99.1 },
    })
    expect(res.statusCode).toBe(201)
    const body = JSON.parse(res.body)
    expect(body.nombre).toBe('Test Lugar Integration')
    createdId = body.id
  })

  it('GET /api/v1/lugares/:id returns the created lugar', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/lugares/${createdId}`,
      headers: { 'x-api-key': USER_KEY },
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.id).toBe(createdId)
  })

  it('PATCH /api/v1/lugares/:id updates the lugar', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/lugares/${createdId}`,
      headers: { 'x-api-key': ADMIN_KEY, 'Content-Type': 'application/json' },
      payload: { nombre: 'Test Lugar Updated' },
    })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body).nombre).toBe('Test Lugar Updated')
  })

  it('DELETE /api/v1/lugares/:id removes the lugar', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/lugares/${createdId}`,
      headers: { 'x-api-key': ADMIN_KEY },
    })
    expect(res.statusCode).toBe(204)
  })

  it('GET /api/v1/lugares/:id returns 404 after deletion', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/lugares/${createdId}`,
      headers: { 'x-api-key': USER_KEY },
    })
    expect(res.statusCode).toBe(404)
  })

  it('POST requires admin — user gets 403', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/lugares',
      headers: { 'x-api-key': USER_KEY, 'Content-Type': 'application/json' },
      payload: { nombre: 'Test', latitud: 0, longitud: 0 },
    })
    expect(res.statusCode).toBe(403)
  })
})
