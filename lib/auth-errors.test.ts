import { describe, it, expect } from 'vitest'
import { translateAuthError } from './auth-errors'

describe('translateAuthError', () => {
  it('translates known Supabase errors to Arabic', () => {
    expect(translateAuthError({ message: 'Email not confirmed' }, 'x')).toContain('تأكيد')
    expect(translateAuthError({ message: 'Invalid login credentials' }, 'x')).toContain('غير صحيحة')
    expect(translateAuthError({ message: 'User already registered' }, 'x')).toContain('مسجّل مسبقاً')
    expect(translateAuthError({ message: 'Unsupported provider: provider is not enabled' }, 'x')).toContain('Google')
    expect(translateAuthError({ message: 'email rate limit exceeded' }, 'x')).toContain('حد المحاولات')
  })

  it('matches case-insensitively', () => {
    expect(translateAuthError({ message: 'INVALID LOGIN CREDENTIALS' }, 'x')).toContain('غير صحيحة')
  })

  it('returns the fallback for unknown or missing errors', () => {
    expect(translateAuthError({ message: 'something odd' }, 'fallback')).toBe('fallback')
    expect(translateAuthError(null, 'fallback')).toBe('fallback')
    expect(translateAuthError({}, 'fallback')).toBe('fallback')
  })
})
