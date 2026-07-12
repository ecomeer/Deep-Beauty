import { describe, it, expect } from 'vitest'
import {
  toArabicPrice,
  isKuwaitPhone,
  toWhatsAppPhone,
  slugify,
  generateOrderNumber,
  STATUS_LABELS,
  STATUS_COLORS,
} from './utils'

describe('toArabicPrice', () => {
  it('formats with 3 decimals, Arabic-Indic digits, and the KWD symbol', () => {
    expect(toArabicPrice(12.5)).toBe('١٢.٥٠٠ د.ك')
    expect(toArabicPrice(0)).toBe('٠.٠٠٠ د.ك')
  })
})

describe('isKuwaitPhone', () => {
  it('accepts valid Kuwaiti mobiles with and without prefix', () => {
    expect(isKuwaitPhone('51234567')).toBe(true)
    expect(isKuwaitPhone('+96551234567')).toBe(true)
    expect(isKuwaitPhone('965 5123 4567')).toBe(true)
  })
  it('rejects wrong lengths and non-mobile prefixes', () => {
    expect(isKuwaitPhone('1234567')).toBe(false)
    expect(isKuwaitPhone('71234567')).toBe(false)
  })
})

describe('toWhatsAppPhone', () => {
  it('adds the Kuwait country code for local numbers', () => {
    expect(toWhatsAppPhone('51234567')).toBe('96551234567')
  })
  it('does not double an existing country code', () => {
    expect(toWhatsAppPhone('96551234567')).toBe('96551234567')
    expect(toWhatsAppPhone('+965 5123 4567')).toBe('96551234567')
  })
  it('strips leading zeros and non-digits', () => {
    expect(toWhatsAppPhone('051234567')).toBe('96551234567')
  })
})

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Hello World')).toBe('hello-world')
    expect(slugify('  A  B  ')).toBe('a-b')
  })
})

describe('generateOrderNumber', () => {
  it('matches the DB-YYYYMMDD-XXXX shape', () => {
    expect(generateOrderNumber()).toMatch(/^DB-\d{8}-\d{4}$/)
  })
})

describe('order status config', () => {
  it('labels and colors cover the same statuses', () => {
    expect(Object.keys(STATUS_COLORS).sort()).toEqual(Object.keys(STATUS_LABELS).sort())
  })
})
