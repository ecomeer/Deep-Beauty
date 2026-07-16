import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { validateEnv, getEnvVar } from './env'

const ORIGINAL_ENV = { ...process.env }

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
})

afterAll(() => {
  process.env = { ...ORIGINAL_ENV }
})

describe('validateEnv', () => {
  it('passes when all required variables are set', () => {
    expect(() => validateEnv()).not.toThrow()
  })

  it('names every missing variable in the error', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    expect(() => validateEnv()).toThrow(
      'Missing environment variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY'
    )
  })

  it('treats an empty string as missing', () => {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ''
    expect(() => validateEnv()).toThrow('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  })
})

describe('getEnvVar', () => {
  it('returns the value when set', () => {
    expect(getEnvVar('NEXT_PUBLIC_SUPABASE_URL')).toBe('https://example.supabase.co')
  })

  it('throws with the variable name when unset', () => {
    delete process.env.RESEND_API_KEY
    expect(() => getEnvVar('RESEND_API_KEY')).toThrow('Missing environment variable: RESEND_API_KEY')
  })
})
