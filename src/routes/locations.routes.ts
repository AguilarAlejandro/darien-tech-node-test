import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { requireAdminHook } from '../auth/require-admin.hook.js'
import * as locationService from '../services/location.service.js'
import { createLocationSchema, updateLocationSchema, locationParamsSchema, findAllLocationsSchema } from '../schemas/location.schema.js'

export async function locationRoutes(fastify: FastifyInstance): Promise<void> {
  const f = fastify.withTypeProvider<ZodTypeProvider>()

  f.get('/', { schema: { querystring: findAllLocationsSchema } }, async (request) => {
    return locationService.findAllLocations(request.query)
  })

  f.get('/:id', { schema: { params: locationParamsSchema } }, async (request, reply) => {
    const location = await locationService.findLocationById(request.params.id)
    if (!location) return reply.status(404).send({ message: 'Location not found' })
    return location
  })

  f.post('/', {
    preHandler: [requireAdminHook],
    schema: { body: createLocationSchema },
  }, async (request, reply) => {
    const location = await locationService.createLocation(request.body)
    return reply.status(201).send(location)
  })

  f.patch('/:id', {
    preHandler: [requireAdminHook],
    schema: { params: locationParamsSchema, body: updateLocationSchema },
  }, async (request) => {
    return locationService.updateLocation(request.params.id, request.body)
  })

  f.delete('/:id', {
    preHandler: [requireAdminHook],
    schema: { params: locationParamsSchema },
  }, async (request, reply) => {
    await locationService.deleteLocation(request.params.id)
    return reply.status(204).send()
  })
}
