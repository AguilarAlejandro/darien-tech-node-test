import { prisma } from '../../database/prisma.js'
import { config } from '../../config.js'
import type { TelemetryPayload, AlertKind, AlertState } from '../../types/iot.types.js'
import { broadcast } from './sse-manager.service.js'
import { logger } from '../../utils/logger.js'
import { TtlCache } from '../../utils/ttl-cache.js'
import type { DeviceDesired } from '@prisma/client'

// In-memory state keyed by `${spaceId}:${alertKind}`
const alertStates = new Map<string, AlertState>()

// Cache deviceDesired for 60 s — avoids a DB hit on every MQTT message
const desiredCache = new TtlCache<DeviceDesired | null>(60_000)

function getKey(spaceId: string, kind: AlertKind): string {
  return `${spaceId}:${kind}`
}

function getOrCreateState(spaceId: string, kind: AlertKind): AlertState {
  const key = getKey(spaceId, kind)
  if (!alertStates.has(key)) {
    alertStates.set(key, {
      spaceId,
      kind,
      conditionStartedAt: null,
      alertOpenedAt: null,
      resolutionStartedAt: null,
      isOpen: false,
    })
  }
  return alertStates.get(key)!
}

interface AlertRule {
  kind: AlertKind
  isTriggering: (payload: TelemetryPayload, desired: { co2AlertThreshold: number; samplingIntervalSec: number } | null) => boolean
  isResolved: (payload: TelemetryPayload, desired: { co2AlertThreshold: number; samplingIntervalSec: number } | null) => boolean
  openWindowMs: number
  resolveWindowMs: number
  buildMeta: (payload: TelemetryPayload) => Record<string, unknown>
}

const RULES: AlertRule[] = [
  {
    kind: 'CO2',
    isTriggering: (payload, desired) => {
      const threshold = desired?.co2AlertThreshold ?? 1000
      return payload.co2_ppm > threshold
    },
    isResolved: (payload, desired) => {
      const threshold = desired?.co2AlertThreshold ?? 1000
      return payload.co2_ppm <= threshold
    },
    openWindowMs: config.alerts.co2.openWindowMs,
    resolveWindowMs: config.alerts.co2.resolveWindowMs,
    buildMeta: (p) => ({ co2_ppm: p.co2_ppm }),
  },
  {
    kind: 'OCCUPANCY_MAX',
    isTriggering: (payload) => payload.occupancy > 0 && payload.occupancy >= 1.0,
    isResolved: (payload) => payload.occupancy < 1.0,
    openWindowMs: config.alerts.occupancyMax.openWindowMs,
    resolveWindowMs: config.alerts.occupancyMax.resolveWindowMs,
    buildMeta: (p) => ({ occupancy: p.occupancy }),
  },
  {
    kind: 'OCCUPANCY_UNEXPECTED',
    // Triggers when occupancy > 0 outside of any scheduled hours (evaluated externally)
    // We use a simple heuristic here: payload carries an `outOfHours` flag if set by subscriber
    isTriggering: (payload) => !!(payload as unknown as Record<string, unknown>)['outOfHours'] && payload.occupancy > 0,
    isResolved: (payload) => payload.occupancy === 0,
    openWindowMs: config.alerts.occupancyUnexpected.openWindowMs,
    resolveWindowMs: config.alerts.occupancyUnexpected.resolveWindowMs,
    buildMeta: (p) => ({ occupancy: p.occupancy }),
  },
]

async function openAlert(spaceId: string, rule: AlertRule, payload: TelemetryPayload): Promise<void> {
  const state = getOrCreateState(spaceId, rule.kind)
  if (state.isOpen) return

  const now = new Date()
  const alert = await prisma.alert.create({
    data: {
      spaceId,
      kind: rule.kind,
      startedAt: now,
      metaJson: rule.buildMeta(payload) as object,
    },
  })

  state.isOpen = true
  state.alertOpenedAt = now
  state.conditionStartedAt = null
  state.resolutionStartedAt = null

  logger.warn({ alertId: alert.id, spaceId, kind: rule.kind }, 'Alert opened')
  broadcast('alert', { type: 'opened', alert })
}

async function resolveAlert(spaceId: string, rule: AlertRule): Promise<void> {
  const state = getOrCreateState(spaceId, rule.kind)
  if (!state.isOpen) return

  const now = new Date()
  const openAlert = await prisma.alert.findFirst({
    where: { spaceId, kind: rule.kind, resolvedAt: null },
    orderBy: { startedAt: 'desc' },
  })

  if (!openAlert) {
    state.isOpen = false
    return
  }

  const resolved = await prisma.alert.update({
    where: { id: openAlert.id },
    data: { resolvedAt: now },
  })

  state.isOpen = false
  state.alertOpenedAt = null
  state.conditionStartedAt = null
  state.resolutionStartedAt = null

  logger.info({ alertId: resolved.id, spaceId, kind: rule.kind }, 'Alert resolved')
  broadcast('alert', { type: 'resolved', alert: resolved })
}

export async function evaluateAlerts(
  spaceId: string,
  payload: TelemetryPayload,
): Promise<void> {
  // Use cached desired config to avoid a DB query per MQTT message
  let desired = desiredCache.get(spaceId)
  if (desired === undefined) {
    desired = await prisma.deviceDesired.findUnique({ where: { spaceId } })
    desiredCache.set(spaceId, desired)
  }

  const now = Date.now()

  for (const rule of RULES) {
    const state = getOrCreateState(spaceId, rule.kind)

    if (!state.isOpen) {
      // Check if condition is continuously triggering
      if (rule.isTriggering(payload, desired)) {
        if (!state.conditionStartedAt) {
          state.conditionStartedAt = new Date(now)
        } else if (now - state.conditionStartedAt.getTime() >= rule.openWindowMs) {
          await openAlert(spaceId, rule, payload)
        }
      } else {
        state.conditionStartedAt = null
      }
    } else {
      // Alert is open — check if it has been resolved
      if (rule.isResolved(payload, desired)) {
        if (!state.resolutionStartedAt) {
          state.resolutionStartedAt = new Date(now)
        } else if (now - state.resolutionStartedAt.getTime() >= rule.resolveWindowMs) {
          await resolveAlert(spaceId, rule)
        }
      } else {
        state.resolutionStartedAt = null
      }
    }
  }
}

export async function getAlerts(
  spaceId: string,
  activeOnly: boolean,
  kind?: AlertKind,
  limit = 50,
) {
  return prisma.alert.findMany({
    where: {
      spaceId,
      ...(activeOnly ? { resolvedAt: null } : {}),
      ...(kind ? { kind } : {}),
    },
    orderBy: { startedAt: 'desc' },
    take: limit,
  })
}
