import { prisma } from '../database/prisma.js'
import { config } from '../config.js'

interface CacheEntry {
  apiKeyId: string
  role: 'ADMIN' | 'USER'
  expiresAt: number
}

// Simple in-memory TTL cache to avoid DB hit on every request
const cache = new Map<string, CacheEntry>()

export async function validateApiKey(
  key: string,
): Promise<{ apiKeyId: string; role: 'ADMIN' | 'USER' } | null> {
  const now = Date.now()

  // Check cache first
  const cached = cache.get(key)
  if (cached && cached.expiresAt > now) {
    return { apiKeyId: cached.apiKeyId, role: cached.role }
  }

  // Query DB
  const apiKey = await prisma.apiKey.findUnique({
    where: { key },
    select: { id: true, role: true },
  })

  if (!apiKey) {
    cache.delete(key)
    return null
  }

  const entry: CacheEntry = {
    apiKeyId: apiKey.id,
    role: apiKey.role as 'ADMIN' | 'USER',
    expiresAt: now + config.apiKeyCacheTtlMs,
  }
  cache.set(key, entry)

  return { apiKeyId: entry.apiKeyId, role: entry.role }
}

/** Invalidate a specific key from the cache (e.g. after deletion) */
export function invalidateApiKeyCache(key: string): void {
  cache.delete(key)
}
