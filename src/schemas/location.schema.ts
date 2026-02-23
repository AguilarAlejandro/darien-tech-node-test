import { z } from 'zod'

export const createLocationSchema = z.object({
  name: z.string().min(1).max(200),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
})

export const updateLocationSchema = createLocationSchema.partial()

export const locationParamsSchema = z.object({
  id: z.string().uuid('Invalid UUID'),
})

export type CreateLocationBody = z.infer<typeof createLocationSchema>
export type UpdateLocationBody = z.infer<typeof updateLocationSchema>
export type LocationParams = z.infer<typeof locationParamsSchema>
