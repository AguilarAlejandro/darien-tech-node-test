import mqtt from 'mqtt'
import { config } from '../../config.js'
import { logger } from '../../utils/logger.js'
import { processTelemetry } from './telemetry.service.js'
import { processReported } from './digital-twin.service.js'
import { evaluateAlerts } from './alert-engine.service.js'
import { prisma } from '../../database/prisma.js'
import type {
  TelemetryPayload,
  ReportedPayload,
} from '../../types/iot.types.js'

let client: mqtt.MqttClient | null = null

// sites/{lugarId}/offices/{espacioId}/telemetry
// sites/{lugarId}/offices/{espacioId}/reported
const TELEMETRY_TOPIC = 'sites/+/offices/+/telemetry'
const REPORTED_TOPIC = 'sites/+/offices/+/reported'
const DESIRED_TOPIC_PREFIX = 'sites'

function extractIds(topic: string): { lugarId: string; espacioId: string } | null {
  // sites/{lugarId}/offices/{espacioId}/{suffix}
  const parts = topic.split('/')
  if (parts.length < 5) return null
  const lugarId = parts[1]
  const espacioId = parts[3]
  if (!lugarId || !espacioId) return null
  return { lugarId, espacioId }
}

async function enrichWithOutOfHoursFlag(
  espacioId: string,
  payload: TelemetryPayload,
): Promise<TelemetryPayload & { outOfHours?: boolean }> {
  // Check if current time is outside office hours
  const officeHours = await prisma.officeHours.findUnique({ where: { espacioId } })
  if (!officeHours) return payload

  const { isWithinOfficeHours } = await import('../../utils/date.utils.js')
  const now = new Date()
  const withinHours = isWithinOfficeHours(officeHours, now)

  return { ...payload, outOfHours: !withinHours }
}

export function startMqttSubscriber(): void {
  const mqttUrl = config.mqttUrl

  if (config.nodeEnv === 'test') {
    logger.info('Skipping MQTT subscriber in test environment')
    return
  }

  client = mqtt.connect(mqttUrl, {
    clientId: `cowork-api-${Date.now()}`,
    reconnectPeriod: 5000,
  })

  client.on('connect', () => {
    logger.info({ mqttUrl }, 'MQTT connected')
    client!.subscribe([TELEMETRY_TOPIC, REPORTED_TOPIC], { qos: 1 }, (err) => {
      if (err) {
        logger.error({ err }, 'Failed to subscribe to MQTT topics')
      } else {
        logger.info({ topics: [TELEMETRY_TOPIC, REPORTED_TOPIC] }, 'Subscribed to MQTT topics')
      }
    })
  })

  client.on('error', (err) => {
    logger.error({ err }, 'MQTT error')
  })

  client.on('offline', () => {
    logger.warn('MQTT client offline')
  })

  client.on('message', async (topic: string, message: Buffer) => {
    const ids = extractIds(topic)
    if (!ids) {
      logger.warn({ topic }, 'Could not extract IDs from MQTT topic')
      return
    }

    const { espacioId } = ids
    let parsed: unknown

    try {
      parsed = JSON.parse(message.toString())
    } catch {
      logger.warn({ topic }, 'Failed to parse MQTT message as JSON')
      return
    }

    try {
      if (topic.endsWith('/telemetry')) {
        const payload = parsed as TelemetryPayload
        const enriched = await enrichWithOutOfHoursFlag(espacioId, payload)
        await Promise.all([
          processTelemetry(espacioId, enriched),
          evaluateAlerts(espacioId, enriched),
        ])
      } else if (topic.endsWith('/reported')) {
        await processReported(espacioId, parsed as ReportedPayload)
      }
    } catch (err) {
      logger.error({ err, topic, espacioId }, 'Error processing MQTT message')
    }
  })
}

export function stopMqttSubscriber(): Promise<void> {
  return new Promise((resolve) => {
    if (!client) return resolve()
    client.end(false, {}, () => resolve())
  })
}

/**
 * Publish a desired-state update to the office device.
 */
export function publishDesired(lugarId: string, espacioId: string, payload: object): void {
  if (!client?.connected) {
    logger.warn({ lugarId, espacioId }, 'MQTT client not connected; cannot publish desired')
    return
  }
  const topic = `${DESIRED_TOPIC_PREFIX}/${lugarId}/offices/${espacioId}/desired`
  client.publish(topic, JSON.stringify(payload), { qos: 1 }, (err) => {
    if (err) logger.error({ err, topic }, 'Failed to publish desired')
    else logger.debug({ topic }, 'Published desired')
  })
}
