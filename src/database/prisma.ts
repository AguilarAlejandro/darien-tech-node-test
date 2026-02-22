import { PrismaClient } from '@prisma/client'

declare global {
  // Prevent multiple PrismaClient instances in development (due to hot reload)
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['warn', 'error'],
  })
}

export const prisma: PrismaClient =
  globalThis.__prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}

export async function connectDatabase(): Promise<void> {
  await prisma.$connect()
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect()
}
