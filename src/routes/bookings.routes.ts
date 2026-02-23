import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import * as bookingService from '../services/booking.service.js'
import {
  createBookingSchema,
  updateBookingSchema,
  bookingParamsSchema,
  findAllBookingsSchema,
} from '../schemas/booking.schema.js'

export async function bookingRoutes(fastify: FastifyInstance): Promise<void> {
  const f = fastify.withTypeProvider<ZodTypeProvider>()

  f.get('/', {
    schema: { querystring: findAllBookingsSchema },
  }, async (request) => {
    return bookingService.findAllBookings(request.query)
  })

  f.get('/:id', {
    schema: { params: bookingParamsSchema },
  }, async (request, reply) => {
    const booking = await bookingService.findBookingById(request.params.id)
    if (!booking) return reply.status(404).send({ message: 'Booking not found' })
    return booking
  })

  f.post('/', {
    schema: { body: createBookingSchema },
  }, async (request, reply) => {
    const booking = await bookingService.createBooking(request.body)
    return reply.status(201).send(booking)
  })

  f.patch('/:id', {
    schema: { params: bookingParamsSchema, body: updateBookingSchema },
  }, async (request, reply) => {
    const booking = await bookingService.updateBooking(request.params.id, request.body)
    if (!booking) return reply.status(404).send({ message: 'Booking not found' })
    return booking
  })

  f.delete('/:id', {
    schema: { params: bookingParamsSchema },
  }, async (request, reply) => {
    await bookingService.deleteBooking(request.params.id)
    return reply.status(204).send()
  })
}
