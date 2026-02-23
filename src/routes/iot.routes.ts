import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { randomUUID } from 'node:crypto'
import { addClient, removeClient } from '../services/iot/sse-manager.service.js'
import { getTwinState, updateDesired } from '../services/iot/digital-twin.service.js'
import { getTelemetryHistory } from '../services/iot/telemetry.service.js'
import { getAlerts } from '../services/iot/alert-engine.service.js'
import { requireAdminHook } from '../auth/require-admin.hook.js'
import { prisma } from '../database/prisma.js'
import {
  iotParamsSchema,
  updateDesiredSchema,
  updateOfficeHoursSchema,
  getTelemetryQuerySchema,
  getAlertsQuerySchema,
} from '../schemas/iot.schema.js'
import { publishDesired } from '../services/iot/mqtt-subscriber.service.js'

export async function iotRoutes(fastify: FastifyInstance): Promise<void> {
  const f = fastify.withTypeProvider<ZodTypeProvider>()

  // SSE stream
  f.get('/stream', {
    schema: {},
  }, async (request, reply) => {
    const clientId = randomUUID()
    const req = request.raw
    const res = reply.raw

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    res.flushHeaders()

    addClient(clientId, res)

    // Keep-alive ping every 25 seconds
    const keepAlive = setInterval(() => {
      try {
        res.write(': ping\n\n')
      } catch {
        clearInterval(keepAlive)
      }
    }, 25000)

    req.on('close', () => {
      clearInterval(keepAlive)
      removeClient(clientId)
    })

    // Don't call reply.send()
    return await new Promise<void>((resolve) => req.on('close', resolve))
  })

  // Digital twin
  f.get('/spaces/:id/twin', {
    schema: { params: iotParamsSchema },
  }, async (request) => {
    return getTwinState(request.params.id)
  })

  f.patch('/spaces/:id/desired', {
    preHandler: [requireAdminHook],
    schema: { params: iotParamsSchema, body: updateDesiredSchema },
  }, async (request) => {
    const { id: spaceId } = request.params

    // Get locationId for MQTT publish
    const space = await prisma.space.findUnique({
      where: { id: spaceId },
      select: { locationId: true },
    })

    const desired = await updateDesired(spaceId, {
      samplingIntervalSec: request.body.samplingIntervalSec,
      co2_alert_threshold: request.body.co2AlertThreshold,
    })

    if (space) {
      publishDesired(space.locationId, spaceId, request.body)
    }

    return desired
  })

  // Office hours
  f.get('/spaces/:id/office-hours', {
    schema: { params: iotParamsSchema },
  }, async (request, reply) => {
    const hours = await prisma.officeHours.findUnique({ where: { spaceId: request.params.id } })
    if (!hours) return reply.status(404).send({ message: 'Office hours not configured' })
    return hours
  })

  f.put('/spaces/:id/office-hours', {
    preHandler: [requireAdminHook],
    schema: { params: iotParamsSchema, body: updateOfficeHoursSchema },
  }, async (request) => {
    const { openTime, closeTime, timezone, workDays } = request.body
    return prisma.officeHours.upsert({
      where: { spaceId: request.params.id },
      create: {
        spaceId: request.params.id,
        openTime: openTime ?? '09:00',
        closeTime: closeTime ?? '18:00',
        ...(timezone ? { timezone } : {}),
        ...(workDays ? { workDays } : {}),
      },
      update: {
        ...(openTime ? { openTime } : {}),
        ...(closeTime ? { closeTime } : {}),
        ...(timezone ? { timezone } : {}),
        ...(workDays ? { workDays } : {}),
      },
    })
  })

  // Telemetry history
  f.get('/spaces/:id/telemetry', {
    schema: { params: iotParamsSchema, querystring: getTelemetryQuerySchema },
  }, async (request) => {
    return getTelemetryHistory(request.params.id, request.query.minutes)
  })

  // Alerts
  f.get('/spaces/:id/alerts', {
    schema: { params: iotParamsSchema, querystring: getAlertsQuerySchema },
  }, async (request) => {
    const { active, kind, limit } = request.query
    return getAlerts(
      request.params.id,
      active === true,
      kind,
      limit,
    )
  })
}
