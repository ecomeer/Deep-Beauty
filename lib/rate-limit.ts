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

/** Pre-configured limiter: 10 back-in-stock subscriptions per 5 minutes per IP. */
export function stockNotifyLimiter(ip: string): boolean {
  return rateLimit(`stock-notify:${ip}`, 10, 5 * 60_000)
}

/** Pre-configured limiter: 20 abandoned-cart snapshot saves per 5 minutes per IP. */
export function abandonedCartLimiter(ip: string): boolean {
  return rateLimit(`abandoned-cart:${ip}`, 20, 5 * 60_000)
}

/** Pre-configured limiter: 5 contact-form submissions per 10 minutes per IP. */
export function contactLimiter(ip: string): boolean {
  return rateLimit(`contact:${ip}`, 5, 10 * 60_000)
}

/** Extracts the client IP from forwarded headers set by the hosting proxy. */
export function getClientIp(req: { headers: { get(name: string): string | null } }): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}
