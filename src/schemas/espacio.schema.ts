import { z } from 'zod'

export const createEspacioSchema = z.object({
  lugarId: z.string().uuid('lugarId must be a valid UUID'),
  nombre: z.string().min(1).max(200),
  referencia: z.string().max(500).optional(),
  capacidad: z.number().int().min(1),
  descripcion: z.string().max(2000).optional(),
})

export const updateEspacioSchema = createEspacioSchema.partial()

export const espacioParamsSchema = z.object({
  id: z.string().uuid('Invalid UUID'),
})

export const findAllEspaciosSchema = z.object({
  lugarId: z.string().uuid('lugarId must be a valid UUID').optional(),
})

export type CreateEspacioBody = z.infer<typeof createEspacioSchema>
export type UpdateEspacioBody = z.infer<typeof updateEspacioSchema>
export type EspacioParams = z.infer<typeof espacioParamsSchema>
export type FindAllEspaciosQuery = z.infer<typeof findAllEspaciosSchema>
