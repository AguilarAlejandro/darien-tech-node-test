import Fastify from 'fastify'
import cors from '@fastify/cors'
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { logger } from './utils/logger.js'
import { buildErrorHandler } from './utils/error-handler.js'
import { authHook } from './auth/auth.hook.js'
import { lugarRoutes } from './routes/lugares.routes.js'
import { espacioRoutes } from './routes/espacios.routes.js'
import { reservaRoutes } from './routes/reservas.routes.js'
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
  await fastify.register(lugarRoutes, { prefix: '/api/v1/lugares' })
  await fastify.register(espacioRoutes, { prefix: '/api/v1/espacios' })
  await fastify.register(reservaRoutes, { prefix: '/api/v1/reservas' })
  await fastify.register(iotRoutes, { prefix: '/api/v1/iot' })
  await fastify.register(apiKeyRoutes, { prefix: '/api/v1/api-keys' })

  return fastify
}
