import { buildApp } from '../../src/app'

const ADMIN_KEY = 'admin-secret-key-123'
const USER_KEY = 'user-secret-key-456'

// Fixed UUIDs from seed
const SPACE_ID = 'b6194839-7438-4587-a52e-eeef27d00282'

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

describe('Bookings — Weekly limit (max 3 per client per week)', () => {
  const weeklyIds: string[] = []
  // Use a far-future week that won't conflict with seed data
  const weekDate = '2027-03-01' // Monday of ISO week 9, 2027
  const email = 'weekly-limit-test@example.com'

  afterAll(async () => {
    for (const id of weeklyIds) {
      await app.inject({
        method: 'DELETE',
        url: `/api/v1/bookings/${id}`,
        headers: { 'x-api-key': ADMIN_KEY },
      })
    }
  })

  it('allows creating 3 bookings in the same week', async () => {
    for (let i = 0; i < 3; i++) {
      const day = String(i + 1).padStart(2, '0')
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/bookings',
        headers: { 'x-api-key': USER_KEY, 'Content-Type': 'application/json' },
        payload: {
          spaceId: SPACE_ID,
          clientEmail: email,
          bookingDate: `2027-03-${day}T00:00:00.000Z`,
          startTime: `2027-03-${day}T09:00:00.000Z`,
          endTime: `2027-03-${day}T10:00:00.000Z`,
        },
      })
      expect(res.statusCode).toBe(201)
      const body = JSON.parse(res.body)
      weeklyIds.push(body.id)
    }
    expect(weeklyIds).toHaveLength(3)
  })

  it('rejects the 4th booking in the same week with 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/bookings',
      headers: { 'x-api-key': USER_KEY, 'Content-Type': 'application/json' },
      payload: {
        spaceId: SPACE_ID,
        clientEmail: email,
        bookingDate: '2027-03-04T00:00:00.000Z',
        startTime: '2027-03-04T11:00:00.000Z',
        endTime: '2027-03-04T12:00:00.000Z',
      },
    })
    expect(res.statusCode).toBe(400)
    const body = JSON.parse(res.body)
    expect(body.message).toContain('Weekly booking limit')
  })
})
