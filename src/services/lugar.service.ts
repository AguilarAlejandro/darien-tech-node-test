import { prisma } from '../database/prisma.js'
import type { CreateLugarBody, UpdateLugarBody } from '../schemas/lugar.schema.js'

export async function createLugar(data: CreateLugarBody) {
  return prisma.lugar.create({
    data,
    include: { _count: { select: { espacios: true } } },
  })
}

export async function findAllLugares() {
  return prisma.lugar.findMany({
    include: { _count: { select: { espacios: true } } },
    orderBy: { nombre: 'asc' },
  })
}

export async function findLugarById(id: string) {
  return prisma.lugar.findUnique({
    where: { id },
    include: {
      espacios: {
        orderBy: { nombre: 'asc' },
        select: {
          id: true,
          nombre: true,
          referencia: true,
          capacidad: true,
          descripcion: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      _count: { select: { espacios: true } },
    },
  })
}

export async function updateLugar(id: string, data: UpdateLugarBody) {
  return prisma.lugar.update({
    where: { id },
    data,
    include: { _count: { select: { espacios: true } } },
  })
}

export async function deleteLugar(id: string) {
  return prisma.lugar.delete({ where: { id } })
}
