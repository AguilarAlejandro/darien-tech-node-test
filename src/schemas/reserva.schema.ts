import { z } from 'zod'
import { paginationSchema } from './pagination.schema.js'

export const createReservaSchema = z
  .object({
    espacioId: z.string().uuid('espacioId must be a valid UUID'),
    emailCliente: z.string().email('Invalid email format'),
    fechaDeReserva: z.string().datetime({ message: 'fechaDeReserva must be an ISO 8601 datetime' }),
    horaInicio: z.string().datetime({ message: 'horaInicio must be an ISO 8601 datetime' }),
    horaFin: z.string().datetime({ message: 'horaFin must be an ISO 8601 datetime' }),
  })
  .refine(
    (data) => new Date(data.horaFin) > new Date(data.horaInicio),
    { message: 'horaFin must be after horaInicio', path: ['horaFin'] },
  )
  .refine(
    (data) =>
      new Date(data.horaInicio) >= new Date(new Date(data.fechaDeReserva).setHours(0, 0, 0, 0)),
    { message: 'horaInicio must be on or after fechaDeReserva', path: ['horaInicio'] },
  )

export const updateReservaSchema = z
  .object({
    emailCliente: z.string().email().optional(),
    fechaDeReserva: z.string().datetime().optional(),
    horaInicio: z.string().datetime().optional(),
    horaFin: z.string().datetime().optional(),
  })
  .refine(
    (data) => {
      if (data.horaInicio && data.horaFin) {
        return new Date(data.horaFin) > new Date(data.horaInicio)
      }
      return true
    },
    { message: 'horaFin must be after horaInicio', path: ['horaFin'] },
  )

export const reservaParamsSchema = z.object({
  id: z.string().uuid('Invalid UUID'),
})

export const findAllReservasSchema = paginationSchema.extend({
  espacioId: z.string().uuid().optional(),
  emailCliente: z.string().email().optional(),
  fechaDesde: z.string().datetime().optional(),
  fechaHasta: z.string().datetime().optional(),
})

export type CreateReservaBody = z.infer<typeof createReservaSchema>
export type UpdateReservaBody = z.infer<typeof updateReservaSchema>
export type ReservaParams = z.infer<typeof reservaParamsSchema>
export type FindAllReservasQuery = z.infer<typeof findAllReservasSchema>
