import type { FastifyReply, FastifyRequest } from 'fastify'

export async function requireAdminHook(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (request.apiKeyRole !== 'ADMIN') {
    reply.status(403).send({
      statusCode: 403,
      error: 'Forbidden',
      message: 'This endpoint requires admin access',
    })
  }
}
