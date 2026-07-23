import { describe, expect, it } from 'vitest'
import { kuwaitDateKey, startOfKuwaitDayUtc } from './kuwait-time'

describe('Kuwait calendar boundaries', () => {
  it('assigns early Kuwait hours to the new local day', () => {
    expect(kuwaitDateKey('2026-07-23T22:05:00.000Z')).toBe('2026-07-24')
  })

  it('returns Kuwait midnight as the matching UTC instant', () => {
    expect(startOfKuwaitDayUtc('2026-07-23T22:05:00.000Z').toISOString())
      .toBe('2026-07-23T21:00:00.000Z')
  })

  it('supports calendar-day offsets without changing the Kuwait boundary', () => {
    expect(startOfKuwaitDayUtc('2026-07-23T22:05:00.000Z', -6).toISOString())
      .toBe('2026-07-17T21:00:00.000Z')
  })
})
