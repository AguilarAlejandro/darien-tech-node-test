import { buildApp } from '../../src/app'

const ADMIN_KEY = 'admin-secret-key-123'
const USER_KEY = 'user-secret-key-456'

// Fixed UUIDs from seed
const SPACE_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'

let app: Awaited<ReturnType<typeof buildApp>>
const createdIds: string[] = []

beforeAll(async () => {
  app = await buildApp()
  await app.ready()
})

afterAll(async () => {
  // Clean up test bookings
  for (const id of createdIds) {
    await app.inject({
      method: 'DELETE',
      url: `/api/v1/bookings/${id}`,
      headers: { 'x-api-key': ADMIN_KEY },
    })
  }
  await app.close()
})

describe('Bookings CRUD & Business Rules', () => {
  it('GET /api/v1/bookings returns paginated result', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/bookings?page=1&pageSize=5',
      headers: { 'x-api-key': USER_KEY },
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.meta).toBeDefined()
    expect(typeof body.meta.total).toBe('number')
    expect(Array.isArray(body.data)).toBe(true)
  })

  it('POST creates a booking successfully', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/bookings',
      headers: { 'x-api-key': USER_KEY, 'Content-Type': 'application/json' },
      payload: {
        spaceId: SPACE_ID,
        clientEmail: 'inttest@example.com',
        bookingDate: '2026-06-01T00:00:00.000Z',
        startTime: '2026-06-01T14:00:00.000Z',
        endTime: '2026-06-01T15:00:00.000Z',
      },
    })
    expect(res.statusCode).toBe(201)
    const body = JSON.parse(res.body)
    expect(body.id).toBeDefined()
    expect(body.space.id).toBe(SPACE_ID)
    createdIds.push(body.id)
  })

  it('POST returns 409 for a conflicting time slot', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/bookings',
      headers: { 'x-api-key': USER_KEY, 'Content-Type': 'application/json' },
      payload: {
        spaceId: SPACE_ID,
        clientEmail: 'other@example.com',
        bookingDate: '2026-06-01T00:00:00.000Z',
        startTime: '2026-06-01T14:30:00.000Z',
        endTime: '2026-06-01T15:30:00.000Z',
      },
    })
    expect(res.statusCode).toBe(409)
  })

  it('POST returns 400 when endTime <= startTime', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/bookings',
      headers: { 'x-api-key': USER_KEY, 'Content-Type': 'application/json' },
      payload: {
        spaceId: SPACE_ID,
        clientEmail: 'badtime@example.com',
        bookingDate: '2026-06-01T00:00:00.000Z',
        startTime: '2026-06-01T16:00:00.000Z',
        endTime: '2026-06-01T15:00:00.000Z',
      },
    })
    expect(res.statusCode).toBe(400)
  })

  it('POST returns 400 for invalid email format', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/bookings',
      headers: { 'x-api-key': USER_KEY, 'Content-Type': 'application/json' },
      payload: {
        spaceId: SPACE_ID,
        clientEmail: 'not-an-email',
        bookingDate: '2026-07-01T00:00:00.000Z',
        startTime: '2026-07-01T09:00:00.000Z',
        endTime: '2026-07-01T10:00:00.000Z',
      },
    })
    expect(res.statusCode).toBe(400)
  })

  it('GET /api/v1/bookings/:id returns 404 for nonexistent', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/bookings/00000000-0000-0000-0000-000000000000',
      headers: { 'x-api-key': USER_KEY },
    })
    expect(res.statusCode).toBe(404)
  })
})
