import 'fastify'

declare module 'fastify' {
  interface FastifyRequest {
    apiKeyRole?: 'ADMIN' | 'USER'
    apiKeyId?: string
  }
}
