// Unit tests for the reserva validation service (mocking Prisma)
import { checkScheduleConflict, checkWeeklyLimit } from '../../src/services/reserva-validation.service'

// Mock the prisma singleton
jest.mock('../../src/database/prisma', () => ({
  prisma: {
    reserva: {
      findFirst: jest.fn(),
      count: jest.fn(),
    },
  },
}))

import { prisma } from '../../src/database/prisma'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('checkScheduleConflict', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('does not throw when no conflict exists', async () => {
    ;(mockPrisma.reserva.findFirst as jest.Mock).mockResolvedValue(null)
    await expect(
      checkScheduleConflict({
        espacioId: 'space-1',
        horaInicio: new Date('2024-03-01T10:00:00Z'),
        horaFin: new Date('2024-03-01T11:00:00Z'),
      }),
    ).resolves.toBeUndefined()
  })

  it('throws 409 when a conflicting reservation exists', async () => {
    ;(mockPrisma.reserva.findFirst as jest.Mock).mockResolvedValue({
      id: 'conflict-id',
      horaInicio: new Date('2024-03-01T10:30:00Z'),
      horaFin: new Date('2024-03-01T12:00:00Z'),
    })
    const error = await checkScheduleConflict({
      espacioId: 'space-1',
      horaInicio: new Date('2024-03-01T10:00:00Z'),
      horaFin: new Date('2024-03-01T11:00:00Z'),
    }).catch((e) => e)
    expect(error).toBeDefined()
    expect(error.statusCode).toBe(409)
    expect(error.message).toMatch(/conflict/)
  })
})

describe('checkWeeklyLimit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('does not throw when under the limit', async () => {
    ;(mockPrisma.reserva.count as jest.Mock).mockResolvedValue(2)
    await expect(
      checkWeeklyLimit('user@example.com', new Date('2024-03-01T00:00:00Z')),
    ).resolves.toBeUndefined()
  })

  it('throws 400 when at or over the weekly limit', async () => {
    ;(mockPrisma.reserva.count as jest.Mock).mockResolvedValue(3)
    const error = await checkWeeklyLimit(
      'user@example.com',
      new Date('2024-03-01T00:00:00Z'),
    ).catch((e) => e)
    expect(error).toBeDefined()
    expect(error.statusCode).toBe(400)
    expect(error.message).toMatch(/weekly/i)
  })
})
