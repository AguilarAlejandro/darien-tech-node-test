import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { requireAdminHook } from '../auth/require-admin.hook.js'
import { prisma } from '../database/prisma.js'
import { invalidateApiKeyCache } from '../services/api-key.service.js'
const createApiKeySchema = z.object({
  key: z.string().min(16),
  role: z.enum(['ADMIN', 'USER']),
  label: z.string().optional(),
})

export async function apiKeyRoutes(fastify: FastifyInstance): Promise<void> {
  const f = fastify.withTypeProvider<ZodTypeProvider>()

  f.get('/', {
    preHandler: [requireAdminHook],
    schema: {},
  }, async () => {
    return prisma.apiKey.findMany({
      select: { id: true, label: true, role: true, createdAt: true, updatedAt: true },
    })
  })

  f.post('/', {
    preHandler: [requireAdminHook],
    schema: { body: createApiKeySchema },
  }, async (request, reply) => {
    const apiKey = await prisma.apiKey.create({
      data: request.body,
      select: { id: true, label: true, role: true, createdAt: true },
    })
    return reply.status(201).send(apiKey)
  })

  f.delete('/:id', {
    preHandler: [requireAdminHook],
    schema: { params: z.object({ id: z.string().uuid() }) },
  }, async (request, reply) => {
    const apiKey = await prisma.apiKey.findUnique({
      where: { id: request.params.id },
      select: { key: true },
    })
    if (!apiKey) return reply.status(404).send({ message: 'API key not found' })
    await prisma.apiKey.delete({ where: { id: request.params.id } })
    invalidateApiKeyCache(apiKey.key)
    return reply.status(204).send()
  })
}
