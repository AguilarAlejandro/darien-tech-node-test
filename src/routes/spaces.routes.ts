import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { requireAdminHook } from '../auth/require-admin.hook.js'
import * as spaceService from '../services/space.service.js'
import {
  createSpaceSchema,
  updateSpaceSchema,
  spaceParamsSchema,
  findAllSpacesSchema,
} from '../schemas/space.schema.js'

export async function spaceRoutes(fastify: FastifyInstance): Promise<void> {
  const f = fastify.withTypeProvider<ZodTypeProvider>()

  f.get('/', {
    schema: { querystring: findAllSpacesSchema },
  }, async (request) => {
    return spaceService.findAllSpaces(request.query.locationId)
  })

  f.get('/:id', {
    schema: { params: spaceParamsSchema },
  }, async (request, reply) => {
    const space = await spaceService.findSpaceById(request.params.id)
    if (!space) return reply.status(404).send({ message: 'Space not found' })
    return space
  })

  f.post('/', {
    preHandler: [requireAdminHook],
    schema: { body: createSpaceSchema },
  }, async (request, reply) => {
    const space = await spaceService.createSpace(request.body)
    return reply.status(201).send(space)
  })

  f.patch('/:id', {
    preHandler: [requireAdminHook],
    schema: { params: spaceParamsSchema, body: updateSpaceSchema },
  }, async (request) => {
    return spaceService.updateSpace(request.params.id, request.body)
  })

  f.delete('/:id', {
    preHandler: [requireAdminHook],
    schema: { params: spaceParamsSchema },
  }, async (request, reply) => {
    await spaceService.deleteSpace(request.params.id)
    return reply.status(204).send()
  })
}
