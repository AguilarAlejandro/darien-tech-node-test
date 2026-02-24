import { prisma } from '../database/prisma.js'
import type {
  CreateBookingBody,
  UpdateBookingBody,
  FindAllBookingsQuery,
} from '../schemas/booking.schema.js'
import { checkScheduleConflict, checkWeeklyLimit } from './booking-validation.service.js'
import { paginate } from './pagination.service.js'
import type { PaginatedResponse } from '../types/pagination.types.js'

const DEFAULT_INCLUDE = {
  space: {
    select: { id: true, name: true, capacity: true },
  },
  location: {
    select: { id: true, name: true },
  },
} as const

export async function createBooking(data: CreateBookingBody) {
  const startTime = new Date(data.startTime)
  const endTime = new Date(data.endTime)
  const bookingDate = new Date(data.bookingDate)

  // Validate space exists and get locationId
  const space = await prisma.space.findUnique({
    where: { id: data.spaceId },
    select: { id: true, locationId: true },
  })
  if (!space) {
    const err = new Error('Space not found') as Error & { statusCode: number }
    err.statusCode = 404
    throw err
  }

  // Business rule validations
  await checkScheduleConflict({ spaceId: data.spaceId, startTime, endTime })
  await checkWeeklyLimit(data.clientEmail, bookingDate)

  return prisma.booking.create({
    data: {
      spaceId: data.spaceId,
      locationId: space.locationId,
      clientEmail: data.clientEmail,
      bookingDate,
      startTime,
      endTime,
    },
    include: DEFAULT_INCLUDE,
  })
}

export async function findAllBookings(
  query: FindAllBookingsQuery,
): Promise<PaginatedResponse<unknown>> {
  const { page, pageSize, spaceId, clientEmail, dateFrom, dateTo } = query

  const where = {
    ...(spaceId ? { spaceId } : {}),
    ...(clientEmail ? { clientEmail: { contains: clientEmail, mode: 'insensitive' as const } } : {}),
    ...(dateFrom || dateTo
      ? {
          bookingDate: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo) } : {}),
          },
        }
      : {}),
  }

  return paginate(
    ({ skip, take }) =>
      prisma.booking.findMany({
        where,
        include: DEFAULT_INCLUDE,
        orderBy: { startTime: 'asc' },
        skip,
        take,
      }),
    () => prisma.booking.count({ where }),
    page,
    pageSize,
  )
}

export async function findBookingById(id: string) {
  return prisma.booking.findUnique({
    where: { id },
    include: DEFAULT_INCLUDE,
  })
}

export async function updateBooking(id: string, data: UpdateBookingBody) {
  const existing = await prisma.booking.findUnique({ where: { id } })
  if (!existing) return null

  const startTime = data.startTime ? new Date(data.startTime) : existing.startTime
  const endTime = data.endTime ? new Date(data.endTime) : existing.endTime
  const bookingDate = data.bookingDate ? new Date(data.bookingDate) : existing.bookingDate

  await checkScheduleConflict({
    spaceId: existing.spaceId,
    startTime,
    endTime,
    excludeBookingId: id,
  })

  await checkWeeklyLimit(
    data.clientEmail ?? existing.clientEmail,
    bookingDate,
    id,
  )

  return prisma.booking.update({
    where: { id },
    data: {
      ...(data.clientEmail ? { clientEmail: data.clientEmail } : {}),
      ...(data.bookingDate ? { bookingDate } : {}),
      ...(data.startTime ? { startTime } : {}),
      ...(data.endTime ? { endTime } : {}),
    },
    include: DEFAULT_INCLUDE,
  })
}

export async function deleteBooking(id: string) {
  return prisma.booking.delete({ where: { id } })
}
