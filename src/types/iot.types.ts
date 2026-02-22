export interface TelemetryPayload {
  ts: string
  temp_c: number
  humidity_pct: number
  co2_ppm: number
  occupancy: number
  power_w: number
}

export interface DesiredPayload {
  samplingIntervalSec?: number
  co2_alert_threshold?: number
}

export interface ReportedPayload {
  ts: string
  samplingIntervalSec: number
  co2_alert_threshold: number
  firmwareVersion?: string
}

export interface SSEEvent {
  type: 'telemetry' | 'alert' | 'twin_update'
  espacioId: string
  data: unknown
  timestamp: string
}

export type AlertKind = 'CO2' | 'OCCUPANCY_MAX' | 'OCCUPANCY_UNEXPECTED'

export interface AlertState {
  espacioId: string
  kind: AlertKind
  conditionStartedAt: Date | null  // When the triggering condition first started
  alertOpenedAt: Date | null       // When the DB alert was created (condition met window)
  resolutionStartedAt: Date | null // When the resolution condition first started
  isOpen: boolean
}

export interface TelemetryWindow {
  tempCAvg: number
  tempCMin: number
  tempCMax: number
  humidityPctAvg: number
  humidityPctMin: number
  humidityPctMax: number
  co2PpmAvg: number
  co2PpmMin: number
  co2PpmMax: number
  occupancyAvg: number
  occupancyMin: number
  occupancyMax: number
  powerWAvg: number
  powerWMin: number
  powerWMax: number
  sampleCount: number
}
