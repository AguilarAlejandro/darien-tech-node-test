import { prisma } from '../database/prisma.js'
import { getISOWeekRange } from '../utils/date.utils.js'

interface ConflictCheckParams {
  espacioId: string
  horaInicio: Date
  horaFin: Date
  excludeReservaId?: string
}

/**
 * Throws 409 if there is a time overlap for the given espacio.
 * Two reservations overlap when:  start1 < end2 AND end1 > start2
 */
export async function checkScheduleConflict(params: ConflictCheckParams): Promise<void> {
  const { espacioId, horaInicio, horaFin, excludeReservaId } = params

  const conflict = await prisma.reserva.findFirst({
    where: {
      espacioId,
      id: excludeReservaId ? { not: excludeReservaId } : undefined,
      AND: [
        { horaInicio: { lt: horaFin } },
        { horaFin: { gt: horaInicio } },
      ],
    },
    select: { id: true, horaInicio: true, horaFin: true },
  })

  if (conflict) {
    const err = new Error(
      `Schedule conflict: the space is already booked from ${conflict.horaInicio.toISOString()} to ${conflict.horaFin.toISOString()}`,
    ) as Error & { statusCode: number }
    err.statusCode = 409
    throw err
  }
}

const MAX_RESERVATIONS_PER_WEEK = 3

/**
 * Throws 400 if the client has reached the weekly reservation limit.
 */
export async function checkWeeklyLimit(
  emailCliente: string,
  referenceDate: Date,
  excludeReservaId?: string,
): Promise<void> {
  const { start, end } = getISOWeekRange(referenceDate)

  const count = await prisma.reserva.count({
    where: {
      emailCliente,
      id: excludeReservaId ? { not: excludeReservaId } : undefined,
      fechaDeReserva: { gte: start, lte: end },
    },
  })

  if (count >= MAX_RESERVATIONS_PER_WEEK) {
    const err = new Error(
      `Weekly reservation limit reached: a client may have at most ${MAX_RESERVATIONS_PER_WEEK} reservations per week`,
    ) as Error & { statusCode: number }
    err.statusCode = 400
    throw err
  }
}
