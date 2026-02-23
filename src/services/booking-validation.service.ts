import { prisma } from '../database/prisma.js'
import { getISOWeekRange } from '../utils/date.utils.js'

interface ConflictCheckParams {
  spaceId: string
  startTime: Date
  endTime: Date
  excludeBookingId?: string
}

/**
 * Throws 409 if there is a time overlap for the given space.
 * Two bookings overlap when:  start1 < end2 AND end1 > start2
 */
export async function checkScheduleConflict(params: ConflictCheckParams): Promise<void> {
  const { spaceId, startTime, endTime, excludeBookingId } = params

  const conflict = await prisma.booking.findFirst({
    where: {
      spaceId,
      id: excludeBookingId ? { not: excludeBookingId } : undefined,
      AND: [
        { startTime: { lt: endTime } },
        { endTime: { gt: startTime } },
      ],
    },
    select: { id: true, startTime: true, endTime: true },
  })

  if (conflict) {
    const err = new Error(
      `Schedule conflict: the space is already booked from ${conflict.startTime.toISOString()} to ${conflict.endTime.toISOString()}`,
    ) as Error & { statusCode: number }
    err.statusCode = 409
    throw err
  }
}

const MAX_BOOKINGS_PER_WEEK = 3

/**
 * Throws 400 if the client has reached the weekly booking limit.
 */
export async function checkWeeklyLimit(
  clientEmail: string,
  referenceDate: Date,
  excludeBookingId?: string,
): Promise<void> {
  const { start, end } = getISOWeekRange(referenceDate)

  const count = await prisma.booking.count({
    where: {
      clientEmail,
      id: excludeBookingId ? { not: excludeBookingId } : undefined,
      bookingDate: { gte: start, lte: end },
    },
  })

  if (count >= MAX_BOOKINGS_PER_WEEK) {
    const err = new Error(
      `Weekly booking limit reached: a client may have at most ${MAX_BOOKINGS_PER_WEEK} bookings per week`,
    ) as Error & { statusCode: number }
    err.statusCode = 400
    throw err
  }
}
