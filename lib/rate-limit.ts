interface RateLimitEntry {
  timestamps: number[]
}

const store = new Map<string, RateLimitEntry>()

// Cleanup entries older than 10 minutes to prevent unbounded memory growth
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000
let lastCleanup = Date.now()

function cleanup(windowMs: number): void {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now
  for (const [key, entry] of store.entries()) {
    entry.timestamps = entry.timestamps.filter((ts) => now - ts < windowMs)
    if (entry.timestamps.length === 0) store.delete(key)
  }
}

/**
 * Sliding-window in-memory rate limiter.
 * Returns true if the request is allowed, false if rate limited.
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  cleanup(windowMs)

  const entry = store.get(key) ?? { timestamps: [] }
  entry.timestamps = entry.timestamps.filter((ts) => now - ts < windowMs)

  if (entry.timestamps.length >= limit) {
    store.set(key, entry)
    return false
  }

  entry.timestamps.push(now)
  store.set(key, entry)
  return true
}

/**
 * Pre-configured limiter: 5 checkout requests per 60 seconds per IP.
 */
export function checkoutLimiter(ip: string): boolean {
  return rateLimit(`checkout:${ip}`, 5, 60_000)
}
