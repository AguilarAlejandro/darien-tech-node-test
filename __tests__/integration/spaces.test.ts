import { buildApp } from '../../src/app'

const ADMIN_KEY = 'admin-secret-key-123'
const USER_KEY = 'user-secret-key-456'

// Fixed UUIDs from seed
const LOCATION_ID = 'cfaa672e-cf6e-4192-8736-254ca954928c'

let app: Awaited<ReturnType<typeof buildApp>>

beforeAll(async () => {
  app = await buildApp()
  await app.ready()
})

afterAll(async () => {
  await app.close()
})

describe('Spaces CRUD', () => {
  let createdId: string

  it('GET /api/v1/spaces returns paginated response', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/spaces',
      headers: { 'x-api-key': USER_KEY },
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body).toHaveProperty('data')
    expect(body).toHaveProperty('meta')
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data.length).toBeGreaterThanOrEqual(1)
    expect(body.meta).toMatchObject({ page: 1, pageSize: 10 })
  })

  it('GET /api/v1/spaces supports filtering by locationId', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/spaces?locationId=${LOCATION_ID}`,
      headers: { 'x-api-key': USER_KEY },
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(Array.isArray(body.data)).toBe(true)
    for (const space of body.data) {
      expect(space.location.id).toBe(LOCATION_ID)
    }
  })

  it('POST /api/v1/spaces creates a new space (admin only)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/spaces',
      headers: { 'x-api-key': ADMIN_KEY, 'Content-Type': 'application/json' },
      payload: {
        locationId: LOCATION_ID,
        name: 'Integration Test Space',
        capacity: 10,
        reference: 'Floor 3, Room B',
        description: 'Created by integration test',
      },
    })
    expect(res.statusCode).toBe(201)
    const body = JSON.parse(res.body)
    expect(body.name).toBe('Integration Test Space')
    expect(body.capacity).toBe(10)
    expect(body.location.id).toBe(LOCATION_ID)
    createdId = body.id
  })

  it('POST /api/v1/spaces requires admin — user gets 403', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/spaces',
      headers: { 'x-api-key': USER_KEY, 'Content-Type': 'application/json' },
      payload: {
        locationId: LOCATION_ID,
        name: 'Should Fail',
        capacity: 5,
      },
    })
    expect(res.statusCode).toBe(403)
  })

  it('POST /api/v1/spaces returns 400 for invalid payload', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/spaces',
      headers: { 'x-api-key': ADMIN_KEY, 'Content-Type': 'application/json' },
      payload: { name: '', capacity: -1 },
    })
    expect(res.statusCode).toBe(400)
  })

  it('GET /api/v1/spaces/:id returns the created space', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/spaces/${createdId}`,
      headers: { 'x-api-key': USER_KEY },
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.id).toBe(createdId)
    expect(body.name).toBe('Integration Test Space')
  })

  it('GET /api/v1/spaces/:id returns 404 for nonexistent', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/spaces/00000000-0000-0000-0000-000000000000',
      headers: { 'x-api-key': USER_KEY },
    })
    expect(res.statusCode).toBe(404)
  })

  it('PATCH /api/v1/spaces/:id updates the space', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/spaces/${createdId}`,
      headers: { 'x-api-key': ADMIN_KEY, 'Content-Type': 'application/json' },
      payload: { name: 'Updated Test Space', capacity: 20 },
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.name).toBe('Updated Test Space')
    expect(body.capacity).toBe(20)
  })

  it('DELETE /api/v1/spaces/:id removes the space', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/spaces/${createdId}`,
      headers: { 'x-api-key': ADMIN_KEY },
    })
    expect(res.statusCode).toBe(204)
  })

  it('GET /api/v1/spaces/:id returns 404 after deletion', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/spaces/${createdId}`,
      headers: { 'x-api-key': USER_KEY },
    })
    expect(res.statusCode).toBe(404)
  })
})
