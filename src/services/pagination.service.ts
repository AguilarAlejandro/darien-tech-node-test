import type { PaginatedResponse } from '../types/pagination.types.js'

export async function paginate<T>(
  findMany: (args: { skip: number; take: number }) => Promise<T[]>,
  count: () => Promise<number>,
  page: number,
  pageSize: number,
): Promise<PaginatedResponse<T>> {
  const skip = (page - 1) * pageSize
  const [data, total] = await Promise.all([
    findMany({ skip, take: pageSize }),
    count(),
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
