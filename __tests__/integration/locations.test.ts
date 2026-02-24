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

describe('Locations CRUD', () => {
  let createdId: string

  it('GET /api/v1/locations returns paginated response', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/locations',
      headers: { 'x-api-key': USER_KEY },
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body).toHaveProperty('data')
    expect(body).toHaveProperty('meta')
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data.length).toBeGreaterThanOrEqual(2)
    expect(body.meta).toMatchObject({ page: 1, pageSize: 10 })
    expect(typeof body.meta.total).toBe('number')
    expect(typeof body.meta.totalPages).toBe('number')
  })

  it('POST /api/v1/locations creates a new location (admin only)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/locations',
      headers: { 'x-api-key': ADMIN_KEY, 'Content-Type': 'application/json' },
      payload: { name: 'Test Location Integration', latitude: 19.4, longitude: -99.1 },
    })
    expect(res.statusCode).toBe(201)
    const body = JSON.parse(res.body)
    expect(body.name).toBe('Test Location Integration')
    createdId = body.id
  })

  it('GET /api/v1/locations/:id returns the created location', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${createdId}`,
      headers: { 'x-api-key': USER_KEY },
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.id).toBe(createdId)
  })

  it('PATCH /api/v1/locations/:id updates the location', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/locations/${createdId}`,
      headers: { 'x-api-key': ADMIN_KEY, 'Content-Type': 'application/json' },
      payload: { name: 'Test Location Updated' },
    })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body).name).toBe('Test Location Updated')
  })

  it('DELETE /api/v1/locations/:id removes the location', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/locations/${createdId}`,
      headers: { 'x-api-key': ADMIN_KEY },
    })
    expect(res.statusCode).toBe(204)
  })

  it('GET /api/v1/locations/:id returns 404 after deletion', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${createdId}`,
      headers: { 'x-api-key': USER_KEY },
    })
    expect(res.statusCode).toBe(404)
  })

  it('POST requires admin — user gets 403', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/locations',
      headers: { 'x-api-key': USER_KEY, 'Content-Type': 'application/json' },
      payload: { name: 'Test', latitude: 0, longitude: 0 },
    })
    expect(res.statusCode).toBe(403)
  })
})
