import { describe, it, expect, vi, afterEach } from 'vitest'
import { rateLimit, checkoutLimiter } from './rate-limit'

afterEach(() => {
  vi.useRealTimers()
})

describe('rateLimit', () => {
  it('allows requests up to the limit, then blocks', () => {
    const key = `test-${Math.random()}`
    expect(rateLimit(key, 3, 60_000)).toBe(true)
    expect(rateLimit(key, 3, 60_000)).toBe(true)
    expect(rateLimit(key, 3, 60_000)).toBe(true)
    expect(rateLimit(key, 3, 60_000)).toBe(false)
  })

  it('isolates limits per key', () => {
    const a = `test-a-${Math.random()}`
    const b = `test-b-${Math.random()}`
    expect(rateLimit(a, 1, 60_000)).toBe(true)
    expect(rateLimit(a, 1, 60_000)).toBe(false)
    expect(rateLimit(b, 1, 60_000)).toBe(true)
  })

  it('allows requests again once the window has passed', () => {
    vi.useFakeTimers()
    const key = `test-window-${Math.random()}`
    expect(rateLimit(key, 1, 1000)).toBe(true)
    expect(rateLimit(key, 1, 1000)).toBe(false)
    vi.advanceTimersByTime(1001)
    expect(rateLimit(key, 1, 1000)).toBe(true)
  })
})

describe('checkoutLimiter', () => {
  it('allows 5 requests per IP then blocks the 6th', () => {
    const ip = `1.2.3.${Math.floor(Math.random() * 255)}`
    for (let i = 0; i < 5; i++) expect(checkoutLimiter(ip)).toBe(true)
    expect(checkoutLimiter(ip)).toBe(false)
  })
})
