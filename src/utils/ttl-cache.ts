/**
 * Simple in-memory TTL cache to avoid per-message DB lookups in hot paths
 * (e.g. MQTT subscriber pipeline).
 */
export class TtlCache<T> {
  private cache = new Map<string, { value: T; expiresAt: number }>()

  constructor(private readonly ttlMs: number) {}

  get(key: string): T | undefined {
    const entry = this.cache.get(key)
    if (!entry) return undefined
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return undefined
    }
    return entry.value
  }

  set(key: string, value: T): void {
    this.cache.set(key, { value, expiresAt: Date.now() + this.ttlMs })
  }

  invalidate(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }
}
