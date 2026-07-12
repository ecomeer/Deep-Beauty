import { describe, it, expect } from 'vitest'
import {
  convertFromKWD,
  formatPrice,
  getCurrencyByCountry,
  parseExchangeRateSettings,
  EXCHANGE_RATES,
} from './currency'

describe('convertFromKWD', () => {
  it('returns the amount unchanged for KWD', () => {
    expect(convertFromKWD(10, 'KWD')).toBe(10)
  })
  it('uses the static table by default', () => {
    expect(convertFromKWD(2, 'SAR')).toBe(2 * EXCHANGE_RATES.SAR)
  })
  it('prefers admin-provided rates over the static table', () => {
    expect(convertFromKWD(2, 'SAR', { SAR: 13 })).toBe(26)
  })
  it('falls back to the static table when the rate is missing from overrides', () => {
    expect(convertFromKWD(2, 'AED', { SAR: 13 })).toBe(2 * EXCHANGE_RATES.AED)
  })
})

describe('formatPrice', () => {
  it('uses 3 decimals for KWD/BHD/OMR and 2 for the rest', () => {
    expect(formatPrice(1, 'KWD')).toBe('1.000 د.ك')
    expect(formatPrice(1, 'SAR')).toBe(`${EXCHANGE_RATES.SAR.toFixed(2)} ر.س`)
  })
})

describe('getCurrencyByCountry', () => {
  it('maps countries to their currencies', () => {
    expect(getCurrencyByCountry('KW')).toBe('KWD')
    expect(getCurrencyByCountry('SA')).toBe('SAR')
  })
})

describe('parseExchangeRateSettings', () => {
  it('parses valid settings rows', () => {
    expect(
      parseExchangeRateSettings([
        { key: 'exchange_rate_sar', value: '12.5' },
        { key: 'exchange_rate_aed', value: '11.9' },
      ])
    ).toEqual({ SAR: 12.5, AED: 11.9 })
  })
  it('ignores unknown keys and invalid values', () => {
    expect(
      parseExchangeRateSettings([
        { key: 'announcement_text', value: 'hi' },
        { key: 'exchange_rate_sar', value: 'abc' },
        { key: 'exchange_rate_aed', value: '0' },
        { key: 'exchange_rate_qar', value: null },
      ])
    ).toBeUndefined()
  })
  it('returns undefined for empty input', () => {
    expect(parseExchangeRateSettings([])).toBeUndefined()
    expect(parseExchangeRateSettings(null)).toBeUndefined()
  })
})
