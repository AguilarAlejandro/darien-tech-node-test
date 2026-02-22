import { prisma } from '../database/prisma.js'
import type {
  CreateReservaBody,
  UpdateReservaBody,
  FindAllReservasQuery,
} from '../schemas/reserva.schema.js'
import { checkScheduleConflict, checkWeeklyLimit } from './reserva-validation.service.js'
import type { PaginatedResponse } from '../types/pagination.types.js'

const DEFAULT_INCLUDE = {
  espacio: {
    select: { id: true, nombre: true, capacidad: true },
  },
  lugar: {
    select: { id: true, nombre: true },
  },
} as const

export async function createReserva(data: CreateReservaBody) {
  const horaInicio = new Date(data.horaInicio)
  const horaFin = new Date(data.horaFin)
  const fechaDeReserva = new Date(data.fechaDeReserva)

  // Validate espacio exists and get lugarId
  const espacio = await prisma.espacio.findUnique({
    where: { id: data.espacioId },
    select: { id: true, lugarId: true },
  })
  if (!espacio) {
    const err = new Error('Espacio not found') as Error & { statusCode: number }
    err.statusCode = 404
    throw err
  }

  // Business rule validations
  await checkScheduleConflict({ espacioId: data.espacioId, horaInicio, horaFin })
  await checkWeeklyLimit(data.emailCliente, fechaDeReserva)

  return prisma.reserva.create({
    data: {
      espacioId: data.espacioId,
      lugarId: espacio.lugarId,
      emailCliente: data.emailCliente,
      fechaDeReserva,
      horaInicio,
      horaFin,
    },
    include: DEFAULT_INCLUDE,
  })
}

export async function findAllReservas(
  query: FindAllReservasQuery,
): Promise<PaginatedResponse<unknown>> {
  const { page, pageSize, espacioId, emailCliente, fechaDesde, fechaHasta } = query
  const skip = (page - 1) * pageSize

  const where = {
    ...(espacioId ? { espacioId } : {}),
    ...(emailCliente ? { emailCliente } : {}),
    ...(fechaDesde || fechaHasta
      ? {
          fechaDeReserva: {
            ...(fechaDesde ? { gte: new Date(fechaDesde) } : {}),
            ...(fechaHasta ? { lte: new Date(fechaHasta) } : {}),
          },
        }
      : {}),
  }

  const [data, total] = await Promise.all([
    prisma.reserva.findMany({
      where,
      include: DEFAULT_INCLUDE,
      orderBy: { horaInicio: 'asc' },
      skip,
      take: pageSize,
    }),
    prisma.reserva.count({ where }),
  ])

  return {
    data,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  }
}

export async function findReservaById(id: string) {
  return prisma.reserva.findUnique({
    where: { id },
    include: DEFAULT_INCLUDE,
  })
}

export async function updateReserva(id: string, data: UpdateReservaBody) {
  // Load existing reservation for comparison
  const existing = await prisma.reserva.findUnique({ where: { id } })
  if (!existing) return null

  const horaInicio = data.horaInicio ? new Date(data.horaInicio) : existing.horaInicio
  const horaFin = data.horaFin ? new Date(data.horaFin) : existing.horaFin
  const fechaDeReserva = data.fechaDeReserva ? new Date(data.fechaDeReserva) : existing.fechaDeReserva

  await checkScheduleConflict({
    espacioId: existing.espacioId,
    horaInicio,
    horaFin,
    excludeReservaId: id,
  })

  await checkWeeklyLimit(
    data.emailCliente ?? existing.emailCliente,
    fechaDeReserva,
    id,
  )

  return prisma.reserva.update({
    where: { id },
    data: {
      ...(data.emailCliente ? { emailCliente: data.emailCliente } : {}),
      ...(data.fechaDeReserva ? { fechaDeReserva } : {}),
      ...(data.horaInicio ? { horaInicio } : {}),
      ...(data.horaFin ? { horaFin } : {}),
    },
    include: DEFAULT_INCLUDE,
  })
}

export async function deleteReserva(id: string) {
  return prisma.reserva.delete({ where: { id } })
}
