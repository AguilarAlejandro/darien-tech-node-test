import { prisma } from '../../database/prisma.js'
import type { DesiredPayload, ReportedPayload } from '../../types/iot.types.js'
import { broadcast } from './sse-manager.service.js'

export async function processReported(
  spaceId: string,
  payload: ReportedPayload,
): Promise<void> {
  const reportedAt = payload.ts ? new Date(payload.ts) : new Date()

  await prisma.deviceReported.upsert({
    where: { spaceId },
    create: {
      spaceId,
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

  broadcast('twin_update', { spaceId, kind: 'reported', payload, ts: reportedAt.toISOString() })
}

export async function updateDesired(
  spaceId: string,
  data: DesiredPayload,
): Promise<unknown> {
  // Ensure DeviceDesired record exists first
  const existing = await prisma.deviceDesired.findUnique({ where: { spaceId } })
  const desired = existing
    ? await prisma.deviceDesired.update({
        where: { spaceId },
        data: {
          ...(data.samplingIntervalSec != null ? { samplingIntervalSec: data.samplingIntervalSec } : {}),
          ...(data.co2_alert_threshold != null ? { co2AlertThreshold: data.co2_alert_threshold } : {}),
        },
      })
    : await prisma.deviceDesired.create({
        data: {
          spaceId,
          samplingIntervalSec: data.samplingIntervalSec ?? 10,
          co2AlertThreshold: data.co2_alert_threshold ?? 1000,
        },
      })

  broadcast('twin_update', {
    spaceId,
    kind: 'desired',
    payload: desired,
    ts: new Date().toISOString(),
  })

  return desired
}

export async function getTwinState(spaceId: string) {
  const [desired, reported] = await Promise.all([
    prisma.deviceDesired.findUnique({ where: { spaceId } }),
    prisma.deviceReported.findUnique({ where: { spaceId } }),
  ])
  return { desired, reported }
}
