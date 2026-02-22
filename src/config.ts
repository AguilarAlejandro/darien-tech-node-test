import 'dotenv/config'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export const config = {
  nodeEnv: (process.env.NODE_ENV ?? 'development') as 'development' | 'production' | 'test',
  port: parseInt(process.env.API_PORT ?? '3000', 10),
  databaseUrl: requireEnv('DATABASE_URL'),
  mqttUrl: process.env.MQTT_URL ?? 'mqtt://localhost:1883',

  // IoT alert thresholds expressed as time windows (in ms)
  alerts: {
    co2: {
      openWindowMs: 5 * 60 * 1000,       // 5 minutes of high CO2 to open
      resolveWindowMs: 2 * 60 * 1000,    // 2 minutes of normal to resolve
    },
    occupancyMax: {
      openWindowMs: 2 * 60 * 1000,       // 2 minutes over capacity to open
      resolveWindowMs: 1 * 60 * 1000,    // 1 minute at/under capacity to resolve
    },
    occupancyUnexpected: {
      openWindowMs: 10 * 60 * 1000,      // 10 minutes of occupancy to open
      resolveWindowMs: 5 * 60 * 1000,    // 5 minutes empty to resolve
    },
  },

  // API key cache TTL (ms)
  apiKeyCacheTtlMs: 5 * 60 * 1000, // 5 minutes
} as const

export type Config = typeof config
