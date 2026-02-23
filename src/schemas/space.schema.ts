import { z } from 'zod'

export const createSpaceSchema = z.object({
  locationId: z.string().uuid('locationId must be a valid UUID'),
  name: z.string().min(1).max(200),
  reference: z.string().max(500).optional(),
  capacity: z.number().int().min(1),
  description: z.string().max(2000).optional(),
})

export const updateSpaceSchema = createSpaceSchema.partial()

export const spaceParamsSchema = z.object({
  id: z.string().uuid('Invalid UUID'),
})

export const findAllSpacesSchema = z.object({
  locationId: z.string().uuid('locationId must be a valid UUID').optional(),
})

export type CreateSpaceBody = z.infer<typeof createSpaceSchema>
export type UpdateSpaceBody = z.infer<typeof updateSpaceSchema>
export type SpaceParams = z.infer<typeof spaceParamsSchema>
export type FindAllSpacesQuery = z.infer<typeof findAllSpacesSchema>
