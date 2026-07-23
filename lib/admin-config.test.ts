import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import {
  getAllowedAdminEmails,
  isEmailAllowListed,
  hasAdminMetadata,
  isDevBypass,
} from './admin-config'

const ORIGINAL_ENV = { ...process.env }

beforeEach(() => {
  delete process.env.ADMIN_EMAILS
  delete process.env.ADMIN_EMAIL
  delete process.env.NEXT_PUBLIC_DEV_BYPASS
})

afterAll(() => {
  process.env = { ...ORIGINAL_ENV }
})

describe('getAllowedAdminEmails', () => {
  it('parses a comma-separated list, trimming and lowercasing', () => {
    process.env.ADMIN_EMAILS = ' A@x.com , b@y.com ,'
    expect(getAllowedAdminEmails()).toEqual(['a@x.com', 'b@y.com'])
  })
  it('falls back to ADMIN_EMAIL', () => {
    process.env.ADMIN_EMAIL = 'Solo@x.com'
    expect(getAllowedAdminEmails()).toEqual(['solo@x.com'])
  })
  it('returns empty when nothing is configured', () => {
    expect(getAllowedAdminEmails()).toEqual([])
  })
})

describe('isEmailAllowListed', () => {
  it('matches case-insensitively', () => {
    process.env.ADMIN_EMAILS = 'admin@x.com'
    expect(isEmailAllowListed('ADMIN@X.COM')).toBe(true)
    expect(isEmailAllowListed('other@x.com')).toBe(false)
  })
  it('rejects null/undefined', () => {
    process.env.ADMIN_EMAILS = 'admin@x.com'
    expect(isEmailAllowListed(null)).toBe(false)
    expect(isEmailAllowListed(undefined)).toBe(false)
  })
})

describe('hasAdminMetadata', () => {
  it('accepts admin role only in app_metadata (server-managed)', () => {
    expect(hasAdminMetadata({ app_metadata: { role: 'admin' }, user_metadata: {} })).toBe(true)
  })
  it('SECURITY: ignores self-writable user_metadata.role', () => {
    // user_metadata is writable by the user via the anon key, so it must never
    // grant admin — otherwise any customer could self-promote.
    expect(hasAdminMetadata({ app_metadata: {}, user_metadata: { role: 'admin' } })).toBe(false)
  })
  it('rejects non-admin roles and missing users', () => {
    expect(hasAdminMetadata({ app_metadata: { role: 'customer' }, user_metadata: {} })).toBe(false)
    expect(hasAdminMetadata(null)).toBe(false)
  })
})

describe('isDevBypass', () => {
  it("is true only for the literal string 'true' outside production", () => {
    expect(isDevBypass()).toBe(false)
    process.env.NEXT_PUBLIC_DEV_BYPASS = 'true'
    expect(isDevBypass()).toBe(true)
    process.env.NEXT_PUBLIC_DEV_BYPASS = '1'
    expect(isDevBypass()).toBe(false)
  })
  it('also honors the server-only DEV_BYPASS var', () => {
    process.env.DEV_BYPASS = 'true'
    expect(isDevBypass()).toBe(true)
    delete process.env.DEV_BYPASS
  })
  it('SECURITY: never bypasses in production', () => {
    const original = process.env.NODE_ENV
    // NODE_ENV is read-only-typed; assign through a mutable view for the test.
    ;(process.env as Record<string, string>).NODE_ENV = 'production'
    process.env.NEXT_PUBLIC_DEV_BYPASS = 'true'
    process.env.DEV_BYPASS = 'true'
    expect(isDevBypass()).toBe(false)
    ;(process.env as Record<string, string>).NODE_ENV = original ?? 'test'
    delete process.env.DEV_BYPASS
  })
})
