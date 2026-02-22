import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'
import { logger } from './logger.js'

export interface ApiErrorResponse {
  statusCode: number
  error: string
  message: string
  details?: unknown
}

export function buildErrorHandler() {
  return function errorHandler(
    error: FastifyError,
    _request: FastifyRequest,
    reply: FastifyReply,
  ): void {
    // Zod validation errors
    if (error instanceof ZodError) {
      const response: ApiErrorResponse = {
        statusCode: 400,
        error: 'Bad Request',
        message: 'Validation failed',
        details: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      }
      reply.status(400).send(response)
      return
    }

    // Prisma unique constraint violation
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        reply.status(409).send({
          statusCode: 409,
          error: 'Conflict',
          message: 'A record with this value already exists',
        })
        return
      }
      if (error.code === 'P2025') {
        reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Record not found',
        })
        return
      }
      if (error.code === 'P2003') {
        reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Referenced record does not exist',
        })
        return
      }
    }

    // HTTP errors set by application code (e.g. reply.status(401) + throw)
    if (error.statusCode && error.statusCode < 500) {
      reply.status(error.statusCode).send({
        statusCode: error.statusCode,
        error: error.name ?? 'Error',
        message: error.message,
      })
      return
    }

    // Generic server errors
    logger.error({ err: error }, 'Unhandled error')
    reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
    })
  }
}
