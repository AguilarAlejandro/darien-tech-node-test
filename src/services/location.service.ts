import { prisma } from '../database/prisma.js'
import type { CreateLocationBody, UpdateLocationBody } from '../schemas/location.schema.js'

export async function createLocation(data: CreateLocationBody) {
  return prisma.location.create({
    data,
    include: { _count: { select: { spaces: true } } },
  })
}

export async function findAllLocations() {
  return prisma.location.findMany({
    include: { _count: { select: { spaces: true } } },
    orderBy: { name: 'asc' },
  })
}

export async function findLocationById(id: string) {
  return prisma.location.findUnique({
    where: { id },
    include: {
      spaces: {
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          reference: true,
          capacity: true,
          description: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      _count: { select: { spaces: true } },
    },
  })
}

export async function updateLocation(id: string, data: UpdateLocationBody) {
  return prisma.location.update({
    where: { id },
    data,
    include: { _count: { select: { spaces: true } } },
  })
}

export async function deleteLocation(id: string) {
  return prisma.location.delete({ where: { id } })
}
