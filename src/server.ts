import { buildApp } from './app.js'
import { config } from './config.js'
import { connectDatabase, disconnectDatabase } from './database/prisma.js'
import { startMqttSubscriber, stopMqttSubscriber } from './services/iot/mqtt-subscriber.service.js'
import { logger } from './utils/logger.js'

async function main() {
  await connectDatabase()

  const app = await buildApp()

  // Start MQTT subscriber (no-op in test env)
  startMqttSubscriber()

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down…')
    await app.close()
    await stopMqttSubscriber()
    await disconnectDatabase()
    process.exit(0)
  }

  process.on('SIGTERM', () => void shutdown('SIGTERM'))
  process.on('SIGINT', () => void shutdown('SIGINT'))

  try {
    await app.listen({ port: config.port, host: '0.0.0.0' })
    logger.info({ port: config.port }, 'Server listening')
  } catch (err) {
    logger.error(err, 'Failed to start server')
    process.exit(1)
  }
}

void main()
