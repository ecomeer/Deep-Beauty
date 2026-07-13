import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  rateLimit,
  checkoutLimiter,
  loginLimiter,
  registerLimiter,
  couponLimiter,
  trackOrderLimiter,
  reviewLimiter,
  getClientIp,
} from './rate-limit'

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

describe('loginLimiter', () => {
  it('allows 10 attempts per IP then blocks the 11th', () => {
    const ip = `10.0.0.${Math.floor(Math.random() * 255)}`
    for (let i = 0; i < 10; i++) expect(loginLimiter(ip)).toBe(true)
    expect(loginLimiter(ip)).toBe(false)
  })
})

describe('registerLimiter', () => {
  it('allows 5 attempts per IP then blocks the 6th', () => {
    const ip = `10.0.1.${Math.floor(Math.random() * 255)}`
    for (let i = 0; i < 5; i++) expect(registerLimiter(ip)).toBe(true)
    expect(registerLimiter(ip)).toBe(false)
  })
})

describe('couponLimiter', () => {
  it('allows 20 checks per IP then blocks the 21st', () => {
    const ip = `10.0.2.${Math.floor(Math.random() * 255)}`
    for (let i = 0; i < 20; i++) expect(couponLimiter(ip)).toBe(true)
    expect(couponLimiter(ip)).toBe(false)
  })
})

describe('trackOrderLimiter', () => {
  it('allows 20 lookups per IP then blocks the 21st', () => {
    const ip = `10.0.3.${Math.floor(Math.random() * 255)}`
    for (let i = 0; i < 20; i++) expect(trackOrderLimiter(ip)).toBe(true)
    expect(trackOrderLimiter(ip)).toBe(false)
  })
})

describe('reviewLimiter', () => {
  it('allows 10 submissions per IP then blocks the 11th', () => {
    const ip = `10.0.4.${Math.floor(Math.random() * 255)}`
    for (let i = 0; i < 10; i++) expect(reviewLimiter(ip)).toBe(true)
    expect(reviewLimiter(ip)).toBe(false)
  })
})

describe('getClientIp', () => {
  it('prefers the first x-forwarded-for entry', () => {
    const headers = new Headers({ 'x-forwarded-for': '1.1.1.1, 2.2.2.2' })
    expect(getClientIp({ headers })).toBe('1.1.1.1')
  })

  it('falls back to x-real-ip', () => {
    const headers = new Headers({ 'x-real-ip': '3.3.3.3' })
    expect(getClientIp({ headers })).toBe('3.3.3.3')
  })

  it('falls back to "unknown" with no headers', () => {
    const headers = new Headers()
    expect(getClientIp({ headers })).toBe('unknown')
  })
})
