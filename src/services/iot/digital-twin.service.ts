import { prisma } from '../../database/prisma.js'
import type { DesiredPayload, ReportedPayload } from '../../types/iot.types.js'
import { broadcast } from './sse-manager.service.js'

export async function processReported(
  espacioId: string,
  payload: ReportedPayload,
): Promise<void> {
  const reportedAt = payload.ts ? new Date(payload.ts) : new Date()

  await prisma.deviceReported.upsert({
    where: { espacioId },
    create: {
      espacioId,
      samplingIntervalSec: payload.samplingIntervalSec,
      co2AlertThreshold: payload.co2_alert_threshold,
      firmwareVersion: payload.firmwareVersion,
      reportedAt,
    },
    update: {
      samplingIntervalSec: payload.samplingIntervalSec,
      co2AlertThreshold: payload.co2_alert_threshold,
      ...(payload.firmwareVersion ? { firmwareVersion: payload.firmwareVersion } : {}),
      reportedAt,
    },
  })

  broadcast('twin_update', { espacioId, kind: 'reported', payload, ts: reportedAt.toISOString() })
}

export async function updateDesired(
  espacioId: string,
  data: DesiredPayload,
): Promise<unknown> {
  // Ensure DeviceDesired record exists first
  const existing = await prisma.deviceDesired.findUnique({ where: { espacioId } })
  const desired = existing
    ? await prisma.deviceDesired.update({
        where: { espacioId },
        data: {
          ...(data.samplingIntervalSec != null ? { samplingIntervalSec: data.samplingIntervalSec } : {}),
          ...(data.co2_alert_threshold != null ? { co2AlertThreshold: data.co2_alert_threshold } : {}),
        },
      })
    : await prisma.deviceDesired.create({
        data: {
          espacioId,
          samplingIntervalSec: data.samplingIntervalSec ?? 10,
          co2AlertThreshold: data.co2_alert_threshold ?? 1000,
        },
      })

  broadcast('twin_update', {
    espacioId,
    kind: 'desired',
    payload: desired,
    ts: new Date().toISOString(),
  })

  return desired
}

export async function getTwinState(espacioId: string) {
  const [desired, reported] = await Promise.all([
    prisma.deviceDesired.findUnique({ where: { espacioId } }),
    prisma.deviceReported.findUnique({ where: { espacioId } }),
  ])
  return { desired, reported }
}
