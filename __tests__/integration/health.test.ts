import { buildApp } from '../../src/app'

let app: Awaited<ReturnType<typeof buildApp>>

beforeAll(async () => {
  app = await buildApp()
  await app.ready()
})

afterAll(async () => {
  await app.close()
})

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.status).toBe('ok')
    expect(typeof body.ts).toBe('string')
  })
})

describe('Auth middleware', () => {
  it('returns 401 when x-api-key header is missing', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/lugares' })
    expect(res.statusCode).toBe(401)
  })

  it('returns 401 for invalid api key', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/lugares',
      headers: { 'x-api-key': 'invalid-bad-key' },
    })
    expect(res.statusCode).toBe(401)
  })

  it('returns 200 for valid user api key', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/lugares',
      headers: { 'x-api-key': 'user-secret-key-456' },
    })
    expect(res.statusCode).toBe(200)
  })
})
