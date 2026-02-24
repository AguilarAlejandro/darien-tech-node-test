import { prisma } from '../database/prisma.js'
import type { CreateSpaceBody, UpdateSpaceBody, FindAllSpacesQuery } from '../schemas/space.schema.js'
import { paginate } from './pagination.service.js'

const DEFAULT_INCLUDE = {
  location: {
    select: { id: true, name: true, latitude: true, longitude: true },
  },
  _count: { select: { bookings: true } },
} as const

export async function createSpace(data: CreateSpaceBody) {
  const location = await prisma.location.findUnique({ where: { id: data.locationId } })
  if (!location) {
    const err = new Error('Location not found') as Error & { statusCode: number }
    err.statusCode = 404
    throw err
  }
  return prisma.space.create({ data, include: DEFAULT_INCLUDE })
}

export async function findAllSpaces(query: FindAllSpacesQuery) {
  const { page, pageSize, locationId } = query
  const where = locationId ? { locationId } : undefined
  return paginate(
    ({ skip, take }) =>
      prisma.space.findMany({
        where,
        include: DEFAULT_INCLUDE,
        orderBy: { name: 'asc' },
        skip,
        take,
      }),
    () => prisma.space.count({ where }),
    page,
    pageSize,
  )
}

export async function findSpaceById(id: string) {
  return prisma.space.findUnique({
    where: { id },
    include: {
      location: true,
      officeHours: true,
      deviceDesired: true,
      deviceReported: true,
      _count: { select: { bookings: true } },
    },
  })
}

export async function updateSpace(id: string, data: UpdateSpaceBody) {
  if (data.locationId) {
    const location = await prisma.location.findUnique({ where: { id: data.locationId } })
    if (!location) {
      const err = new Error('Location not found') as Error & { statusCode: number }
      err.statusCode = 404
      throw err
    }
  }
  return prisma.space.update({ where: { id }, data, include: DEFAULT_INCLUDE })
}

export async function deleteSpace(id: string) {
  return prisma.space.delete({ where: { id } })
}
