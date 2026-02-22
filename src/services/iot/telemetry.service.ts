import { prisma } from '../../database/prisma.js'
import type { TelemetryPayload } from '../../types/iot.types.js'
import { getMinuteWindowStart, getMinuteWindowEnd } from '../../utils/date.utils.js'
import { broadcast } from './sse-manager.service.js'

/**
 * Process an incoming telemetry payload: upsert the 1-minute aggregation window
 * and broadcast the update over SSE.
 */
export async function processTelemetry(
  espacioId: string,
  payload: TelemetryPayload,
): Promise<void> {
  const ts = payload.ts ? new Date(payload.ts) : new Date()
  const windowStart = getMinuteWindowStart(ts)
  const windowEnd = getMinuteWindowEnd(windowStart)

  // Upsert: if a row already exists for this window, compute running avg/min/max
  const existing = await prisma.telemetryAggregation.findUnique({
    where: { espacioId_windowStart: { espacioId, windowStart } },
  })

  if (!existing) {
    await prisma.telemetryAggregation.create({
      data: {
        espacioId,
        windowStart,
        windowEnd,
        tempCAvg: payload.temp_c,
        tempCMin: payload.temp_c,
        tempCMax: payload.temp_c,
        humidityPctAvg: payload.humidity_pct,
        humidityPctMin: payload.humidity_pct,
        humidityPctMax: payload.humidity_pct,
        co2PpmAvg: payload.co2_ppm,
        co2PpmMin: payload.co2_ppm,
        co2PpmMax: payload.co2_ppm,
        occupancyAvg: payload.occupancy,
        occupancyMin: payload.occupancy,
        occupancyMax: payload.occupancy,
        powerWAvg: payload.power_w,
        powerWMin: payload.power_w,
        powerWMax: payload.power_w,
        sampleCount: 1,
      },
    })
  } else {
    const n = existing.sampleCount
    const safeAvg = (prevAvg: number, newVal: number) => (prevAvg * n + newVal) / (n + 1)

    await prisma.telemetryAggregation.update({
      where: { espacioId_windowStart: { espacioId, windowStart } },
      data: {
        tempCAvg: safeAvg(existing.tempCAvg, payload.temp_c),
        tempCMin: Math.min(existing.tempCMin, payload.temp_c),
        tempCMax: Math.max(existing.tempCMax, payload.temp_c),
        humidityPctAvg: safeAvg(existing.humidityPctAvg, payload.humidity_pct),
        humidityPctMin: Math.min(existing.humidityPctMin, payload.humidity_pct),
        humidityPctMax: Math.max(existing.humidityPctMax, payload.humidity_pct),
        co2PpmAvg: safeAvg(existing.co2PpmAvg, payload.co2_ppm),
        co2PpmMin: Math.min(existing.co2PpmMin, payload.co2_ppm),
        co2PpmMax: Math.max(existing.co2PpmMax, payload.co2_ppm),
        occupancyAvg: safeAvg(existing.occupancyAvg, payload.occupancy),
        occupancyMin: Math.min(existing.occupancyMin, payload.occupancy),
        occupancyMax: Math.max(existing.occupancyMax, payload.occupancy),
        powerWAvg: safeAvg(existing.powerWAvg, payload.power_w),
        powerWMin: Math.min(existing.powerWMin, payload.power_w),
        powerWMax: Math.max(existing.powerWMax, payload.power_w),
        sampleCount: { increment: 1 },
      },
    })
  }

  broadcast('telemetry', { espacioId, payload, ts: ts.toISOString() })
}

export async function getTelemetryHistory(espacioId: string, minutes: number) {
  const since = new Date(Date.now() - minutes * 60 * 1000)
  return prisma.telemetryAggregation.findMany({
    where: { espacioId, windowStart: { gte: since } },
    orderBy: { windowStart: 'asc' },
  })
}
