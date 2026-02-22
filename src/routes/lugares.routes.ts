import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { requireAdminHook } from '../auth/require-admin.hook.js'
import * as lugarService from '../services/lugar.service.js'
import { createLugarSchema, updateLugarSchema, lugarParamsSchema } from '../schemas/lugar.schema.js'

export async function lugarRoutes(fastify: FastifyInstance): Promise<void> {
  const f = fastify.withTypeProvider<ZodTypeProvider>()

  f.get('/', { schema: {} }, async () => {
    return lugarService.findAllLugares()
  })

  f.get('/:id', { schema: { params: lugarParamsSchema } }, async (request, reply) => {
    const lugar = await lugarService.findLugarById(request.params.id)
    if (!lugar) return reply.status(404).send({ message: 'Lugar not found' })
    return lugar
  })

  f.post('/', {
    preHandler: [requireAdminHook],
    schema: { body: createLugarSchema },
  }, async (request, reply) => {
    const lugar = await lugarService.createLugar(request.body)
    return reply.status(201).send(lugar)
  })

  f.patch('/:id', {
    preHandler: [requireAdminHook],
    schema: { params: lugarParamsSchema, body: updateLugarSchema },
  }, async (request) => {
    return lugarService.updateLugar(request.params.id, request.body)
  })

  f.delete('/:id', {
    preHandler: [requireAdminHook],
    schema: { params: lugarParamsSchema },
  }, async (request, reply) => {
    await lugarService.deleteLugar(request.params.id)
    return reply.status(204).send()
  })
}
