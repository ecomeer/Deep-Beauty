import { describe, expect, it } from 'vitest'
import { formatKuwaitDate, getKuwaitDayBounds, getKuwaitDateKey } from './kuwait-time'

describe('Kuwait time helpers', () => {
  it('formats UTC timestamps in Asia/Kuwait', () => {
    expect(formatKuwaitDate('2026-07-13T21:30:00.000Z')).toContain('١٤')
  })

  it('uses the Kuwait calendar date for order numbers', () => {
    expect(getKuwaitDateKey(new Date('2026-07-13T21:30:00.000Z'))).toBe('20260714')
  })

  it('returns UTC boundaries for a Kuwait-local day', () => {
    expect(getKuwaitDayBounds('2026-07-14')).toEqual({
      start: '2026-07-13T21:00:00.000Z',
      end: '2026-07-14T20:59:59.999Z',
    })
  })
})
