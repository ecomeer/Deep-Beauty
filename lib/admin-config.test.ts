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
  it('accepts admin role in app_metadata or user_metadata', () => {
    expect(hasAdminMetadata({ app_metadata: { role: 'admin' }, user_metadata: {} })).toBe(true)
    expect(hasAdminMetadata({ app_metadata: {}, user_metadata: { role: 'admin' } })).toBe(true)
  })
  it('rejects non-admin roles and missing users', () => {
    expect(hasAdminMetadata({ app_metadata: { role: 'customer' }, user_metadata: {} })).toBe(false)
    expect(hasAdminMetadata(null)).toBe(false)
  })
})

describe('isDevBypass', () => {
  it("is true only for the literal string 'true'", () => {
    expect(isDevBypass()).toBe(false)
    process.env.NEXT_PUBLIC_DEV_BYPASS = 'true'
    expect(isDevBypass()).toBe(true)
    process.env.NEXT_PUBLIC_DEV_BYPASS = '1'
    expect(isDevBypass()).toBe(false)
  })
})
