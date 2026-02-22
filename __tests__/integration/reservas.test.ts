import { buildApp } from '../../src/app'

const ADMIN_KEY = 'admin-secret-key-123'
const USER_KEY = 'user-secret-key-456'

// Fixed UUIDs from seed
const ESPACIO_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'

let app: Awaited<ReturnType<typeof buildApp>>
const createdIds: string[] = []

beforeAll(async () => {
  app = await buildApp()
  await app.ready()
})

afterAll(async () => {
  // Clean up test reservations
  for (const id of createdIds) {
    await app.inject({
      method: 'DELETE',
      url: `/api/v1/reservas/${id}`,
      headers: { 'x-api-key': ADMIN_KEY },
    })
  }
  await app.close()
})

describe('Reservas CRUD & Business Rules', () => {
  it('GET /api/v1/reservas returns paginated result', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/reservas?page=1&pageSize=5',
      headers: { 'x-api-key': USER_KEY },
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.meta).toBeDefined()
    expect(typeof body.meta.total).toBe('number')
    expect(Array.isArray(body.data)).toBe(true)
  })

  it('POST creates a reservation successfully', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/reservas',
      headers: { 'x-api-key': USER_KEY, 'Content-Type': 'application/json' },
      payload: {
        espacioId: ESPACIO_ID,
        emailCliente: 'inttest@example.com',
        fechaDeReserva: '2026-06-01T00:00:00.000Z',
        horaInicio: '2026-06-01T14:00:00.000Z',
        horaFin: '2026-06-01T15:00:00.000Z',
      },
    })
    expect(res.statusCode).toBe(201)
    const body = JSON.parse(res.body)
    expect(body.id).toBeDefined()
    expect(body.espacio.id).toBe(ESPACIO_ID)
    createdIds.push(body.id)
  })

  it('POST returns 409 for a conflicting time slot', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/reservas',
      headers: { 'x-api-key': USER_KEY, 'Content-Type': 'application/json' },
      payload: {
        espacioId: ESPACIO_ID,
        emailCliente: 'other@example.com',
        fechaDeReserva: '2026-06-01T00:00:00.000Z',
        horaInicio: '2026-06-01T14:30:00.000Z',
        horaFin: '2026-06-01T15:30:00.000Z',
      },
    })
    expect(res.statusCode).toBe(409)
  })

  it('POST returns 400 when horaFin <= horaInicio', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/reservas',
      headers: { 'x-api-key': USER_KEY, 'Content-Type': 'application/json' },
      payload: {
        espacioId: ESPACIO_ID,
        emailCliente: 'badtime@example.com',
        fechaDeReserva: '2026-06-01T00:00:00.000Z',
        horaInicio: '2026-06-01T16:00:00.000Z',
        horaFin: '2026-06-01T15:00:00.000Z',
      },
    })
    expect(res.statusCode).toBe(400)
  })

  it('POST returns 400 for invalid email format', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/reservas',
      headers: { 'x-api-key': USER_KEY, 'Content-Type': 'application/json' },
      payload: {
        espacioId: ESPACIO_ID,
        emailCliente: 'not-an-email',
        fechaDeReserva: '2026-07-01T00:00:00.000Z',
        horaInicio: '2026-07-01T09:00:00.000Z',
        horaFin: '2026-07-01T10:00:00.000Z',
      },
    })
    expect(res.statusCode).toBe(400)
  })

  it('GET /api/v1/reservas/:id returns 404 for nonexistent', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/reservas/00000000-0000-0000-0000-000000000000',
      headers: { 'x-api-key': USER_KEY },
    })
    expect(res.statusCode).toBe(404)
  })
})
