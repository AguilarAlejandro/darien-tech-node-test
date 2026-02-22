import { z } from 'zod'

export const createLugarSchema = z.object({
  nombre: z.string().min(1).max(200),
  latitud: z.number().min(-90).max(90),
  longitud: z.number().min(-180).max(180),
})

export const updateLugarSchema = createLugarSchema.partial()

export const lugarParamsSchema = z.object({
  id: z.string().uuid('Invalid UUID'),
})

export type CreateLugarBody = z.infer<typeof createLugarSchema>
export type UpdateLugarBody = z.infer<typeof updateLugarSchema>
export type LugarParams = z.infer<typeof lugarParamsSchema>
