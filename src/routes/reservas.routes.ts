import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import * as reservaService from '../services/reserva.service.js'
import {
  createReservaSchema,
  updateReservaSchema,
  reservaParamsSchema,
  findAllReservasSchema,
} from '../schemas/reserva.schema.js'

export async function reservaRoutes(fastify: FastifyInstance): Promise<void> {
  const f = fastify.withTypeProvider<ZodTypeProvider>()

  f.get('/', {
    schema: { querystring: findAllReservasSchema },
  }, async (request) => {
    return reservaService.findAllReservas(request.query)
  })

  f.get('/:id', {
    schema: { params: reservaParamsSchema },
  }, async (request, reply) => {
    const reserva = await reservaService.findReservaById(request.params.id)
    if (!reserva) return reply.status(404).send({ message: 'Reserva not found' })
    return reserva
  })

  f.post('/', {
    schema: { body: createReservaSchema },
  }, async (request, reply) => {
    const reserva = await reservaService.createReserva(request.body)
    return reply.status(201).send(reserva)
  })

  f.patch('/:id', {
    schema: { params: reservaParamsSchema, body: updateReservaSchema },
  }, async (request, reply) => {
    const reserva = await reservaService.updateReserva(request.params.id, request.body)
    if (!reserva) return reply.status(404).send({ message: 'Reserva not found' })
    return reserva
  })

  f.delete('/:id', {
    schema: { params: reservaParamsSchema },
  }, async (request, reply) => {
    await reservaService.deleteReserva(request.params.id)
    return reply.status(204).send()
  })
}
