import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { requireAdminHook } from '../auth/require-admin.hook.js'
import * as espacioService from '../services/espacio.service.js'
import {
  createEspacioSchema,
  updateEspacioSchema,
  espacioParamsSchema,
  findAllEspaciosSchema,
} from '../schemas/espacio.schema.js'

export async function espacioRoutes(fastify: FastifyInstance): Promise<void> {
  const f = fastify.withTypeProvider<ZodTypeProvider>()

  f.get('/', {
    schema: { querystring: findAllEspaciosSchema },
  }, async (request) => {
    return espacioService.findAllEspacios(request.query.lugarId)
  })

  f.get('/:id', {
    schema: { params: espacioParamsSchema },
  }, async (request, reply) => {
    const espacio = await espacioService.findEspacioById(request.params.id)
    if (!espacio) return reply.status(404).send({ message: 'Espacio not found' })
    return espacio
  })

  f.post('/', {
    preHandler: [requireAdminHook],
    schema: { body: createEspacioSchema },
  }, async (request, reply) => {
    const espacio = await espacioService.createEspacio(request.body)
    return reply.status(201).send(espacio)
  })

  f.patch('/:id', {
    preHandler: [requireAdminHook],
    schema: { params: espacioParamsSchema, body: updateEspacioSchema },
  }, async (request) => {
    return espacioService.updateEspacio(request.params.id, request.body)
  })

  f.delete('/:id', {
    preHandler: [requireAdminHook],
    schema: { params: espacioParamsSchema },
  }, async (request, reply) => {
    await espacioService.deleteEspacio(request.params.id)
    return reply.status(204).send()
  })
}
