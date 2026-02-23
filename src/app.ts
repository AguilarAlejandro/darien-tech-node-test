import Fastify from 'fastify'
import cors from '@fastify/cors'
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { logger } from './utils/logger.js'
import { buildErrorHandler } from './utils/error-handler.js'
import { authHook } from './auth/auth.hook.js'
import { locationRoutes } from './routes/locations.routes.js'
import { spaceRoutes } from './routes/spaces.routes.js'
import { bookingRoutes } from './routes/bookings.routes.js'
import { iotRoutes } from './routes/iot.routes.js'
import { apiKeyRoutes } from './routes/api-keys.routes.js'

export async function buildApp() {
  const fastify = Fastify({ loggerInstance: logger })

  // Zod type provider
  fastify.setValidatorCompiler(validatorCompiler)
  fastify.setSerializerCompiler(serializerCompiler)

  // CORS
  await fastify.register(cors, { origin: true })

  // Global error handler
  fastify.setErrorHandler(buildErrorHandler())

  // Global auth (validates x-api-key on all routes)
  fastify.addHook('preHandler', authHook)

  // Health check — public (no auth needed, runs before authHook for this route)
  fastify.get('/health', { config: { skipAuth: true } }, async () => ({
    status: 'ok',
    ts: new Date().toISOString(),
  }))

  // API routes under /api/v1
  await fastify.register(locationRoutes, { prefix: '/api/v1/locations' })
  await fastify.register(spaceRoutes, { prefix: '/api/v1/spaces' })
  await fastify.register(bookingRoutes, { prefix: '/api/v1/bookings' })
  await fastify.register(iotRoutes, { prefix: '/api/v1/iot' })
  await fastify.register(apiKeyRoutes, { prefix: '/api/v1/api-keys' })

  return fastify
}
