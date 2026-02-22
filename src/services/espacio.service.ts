import { prisma } from '../database/prisma.js'
import type { CreateEspacioBody, UpdateEspacioBody } from '../schemas/espacio.schema.js'

const DEFAULT_INCLUDE = {
  lugar: {
    select: { id: true, nombre: true, latitud: true, longitud: true },
  },
  _count: { select: { reservas: true } },
} as const

export async function createEspacio(data: CreateEspacioBody) {
  // Ensure the lugar exists before creating
  const lugar = await prisma.lugar.findUnique({ where: { id: data.lugarId } })
  if (!lugar) {
    const err = new Error('Lugar not found') as Error & { statusCode: number }
    err.statusCode = 404
    throw err
  }
  return prisma.espacio.create({ data, include: DEFAULT_INCLUDE })
}

export async function findAllEspacios(lugarId?: string) {
  return prisma.espacio.findMany({
    where: lugarId ? { lugarId } : undefined,
    include: DEFAULT_INCLUDE,
    orderBy: { nombre: 'asc' },
  })
}

export async function findEspacioById(id: string) {
  return prisma.espacio.findUnique({
    where: { id },
    include: {
      lugar: true,
      officeHours: true,
      deviceDesired: true,
      deviceReported: true,
      _count: { select: { reservas: true } },
    },
  })
}

export async function updateEspacio(id: string, data: UpdateEspacioBody) {
  if (data.lugarId) {
    const lugar = await prisma.lugar.findUnique({ where: { id: data.lugarId } })
    if (!lugar) {
      const err = new Error('Lugar not found') as Error & { statusCode: number }
      err.statusCode = 404
      throw err
    }
  }
  return prisma.espacio.update({ where: { id }, data, include: DEFAULT_INCLUDE })
}

export async function deleteEspacio(id: string) {
  return prisma.espacio.delete({ where: { id } })
}
