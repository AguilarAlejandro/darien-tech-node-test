import { z } from 'zod'

export const uuidParam = z.object({
  id: z.string().uuid({ message: 'Invalid UUID format' }),
})

export type UuidParam = z.infer<typeof uuidParam>
