import { z } from 'zod'
import { paginationSchema } from './pagination.schema.js'

export const createBookingSchema = z
  .object({
    spaceId: z.string().uuid('spaceId must be a valid UUID'),
    clientEmail: z.string().email('Invalid email format'),
    bookingDate: z.string().datetime({ message: 'bookingDate must be an ISO 8601 datetime' }),
    startTime: z.string().datetime({ message: 'startTime must be an ISO 8601 datetime' }),
    endTime: z.string().datetime({ message: 'endTime must be an ISO 8601 datetime' }),
  })
  .refine(
    (data) => new Date(data.endTime) > new Date(data.startTime),
    { message: 'endTime must be after startTime', path: ['endTime'] },
  )
  .refine(
    (data) =>
      new Date(data.startTime) >= new Date(new Date(data.bookingDate).setHours(0, 0, 0, 0)),
    { message: 'startTime must be on or after bookingDate', path: ['startTime'] },
  )

export const updateBookingSchema = z
  .object({
    clientEmail: z.string().email().optional(),
    bookingDate: z.string().datetime().optional(),
    startTime: z.string().datetime().optional(),
    endTime: z.string().datetime().optional(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return new Date(data.endTime) > new Date(data.startTime)
      }
      return true
    },
    { message: 'endTime must be after startTime', path: ['endTime'] },
  )

export const bookingParamsSchema = z.object({
  id: z.string().uuid('Invalid UUID'),
})

export const findAllBookingsSchema = paginationSchema.extend({
  spaceId: z.string().uuid().optional(),
  clientEmail: z.string().email().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
})

export type CreateBookingBody = z.infer<typeof createBookingSchema>
export type UpdateBookingBody = z.infer<typeof updateBookingSchema>
export type BookingParams = z.infer<typeof bookingParamsSchema>
export type FindAllBookingsQuery = z.infer<typeof findAllBookingsSchema>
