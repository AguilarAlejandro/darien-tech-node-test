import type { FastifyReply, FastifyRequest } from 'fastify'
import { validateApiKey } from '../services/api-key.service.js'

const PUBLIC_PATHS = new Set(['/health'])

export async function authHook(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  // Allow public endpoints
  if (PUBLIC_PATHS.has(request.routeOptions.url ?? '')) return

  // SSE EventSource cannot send custom headers — accept ?key= query param as fallback
  const queryKey = (request.query as Record<string, string>)?.key
  const apiKey = request.headers['x-api-key'] ?? queryKey

  if (!apiKey || typeof apiKey !== 'string') {
    reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Missing x-api-key header',
    })
    return
  }

  const result = await validateApiKey(apiKey)

  if (!result) {
    reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Invalid API key',
    })
    return
  }

  request.apiKeyRole = result.role
  request.apiKeyId = result.apiKeyId
}
