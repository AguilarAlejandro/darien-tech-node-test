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
  f.get('/espacios/:id/twin', {
    schema: { params: iotParamsSchema },
  }, async (request) => {
    return getTwinState(request.params.id)
  })

  f.patch('/espacios/:id/desired', {
    preHandler: [requireAdminHook],
    schema: { params: iotParamsSchema, body: updateDesiredSchema },
  }, async (request) => {
    const { id: espacioId } = request.params

    // Get lugarId for MQTT publish
    const espacio = await prisma.espacio.findUnique({
      where: { id: espacioId },
      select: { lugarId: true },
    })

    const desired = await updateDesired(espacioId, {
      samplingIntervalSec: request.body.samplingIntervalSec,
      co2_alert_threshold: request.body.co2AlertThreshold,
    })

    if (espacio) {
      publishDesired(espacio.lugarId, espacioId, request.body)
    }

    return desired
  })

  // Office hours
  f.get('/espacios/:id/office-hours', {
    schema: { params: iotParamsSchema },
  }, async (request, reply) => {
    const hours = await prisma.officeHours.findUnique({ where: { espacioId: request.params.id } })
    if (!hours) return reply.status(404).send({ message: 'Office hours not configured' })
    return hours
  })

  f.put('/espacios/:id/office-hours', {
    preHandler: [requireAdminHook],
    schema: { params: iotParamsSchema, body: updateOfficeHoursSchema },
  }, async (request) => {
    const { apertura, cierre, timezone, diasLaborales } = request.body
    return prisma.officeHours.upsert({
      where: { espacioId: request.params.id },
      create: {
        espacioId: request.params.id,
        apertura: apertura ?? '09:00',
        cierre: cierre ?? '18:00',
        ...(timezone ? { timezone } : {}),
        ...(diasLaborales ? { diasLaborales } : {}),
      },
      update: {
        ...(apertura ? { apertura } : {}),
        ...(cierre ? { cierre } : {}),
        ...(timezone ? { timezone } : {}),
        ...(diasLaborales ? { diasLaborales } : {}),
      },
    })
  })

  // Telemetry history
  f.get('/espacios/:id/telemetry', {
    schema: { params: iotParamsSchema, querystring: getTelemetryQuerySchema },
  }, async (request) => {
    return getTelemetryHistory(request.params.id, request.query.minutes)
  })

  // Alerts
  f.get('/espacios/:id/alerts', {
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
