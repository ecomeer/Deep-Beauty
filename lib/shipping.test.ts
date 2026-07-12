import { describe, it, expect } from 'vitest'
import { calculateShipping, type ShippingZone } from './shipping'

const zones: ShippingZone[] = [
  {
    id: 'kw',
    name_ar: 'الكويت',
    name_en: 'Kuwait',
    countries: ['KW'],
    base_rate: 0,
    free_shipping_threshold: null,
    estimated_days_min: 1,
    estimated_days_max: 2,
    is_active: true,
  },
  {
    id: 'sa',
    name_ar: 'السعودية',
    name_en: 'Saudi Arabia',
    countries: ['SA'],
    base_rate: 2.5,
    free_shipping_threshold: 50,
    estimated_days_min: 3,
    estimated_days_max: 5,
    is_active: true,
  },
  {
    id: 'ae-off',
    name_ar: 'الإمارات',
    name_en: 'UAE',
    countries: ['AE'],
    base_rate: 2.5,
    free_shipping_threshold: 50,
    estimated_days_min: 2,
    estimated_days_max: 4,
    is_active: false,
  },
]

describe('calculateShipping', () => {
  it('returns the zone base rate below the free-shipping threshold', () => {
    expect(calculateShipping('SA', 30, zones)).toEqual({ rate: 2.5, isFree: false, zone: zones[1] })
  })
  it('grants free shipping at or above the threshold', () => {
    expect(calculateShipping('SA', 50, zones)).toEqual({ rate: 0, isFree: true, zone: zones[1] })
  })
  it('ignores inactive zones', () => {
    expect(calculateShipping('AE', 30, zones)).toEqual({ rate: 0, isFree: false, zone: null })
  })
  it('returns zero with no matching zone', () => {
    expect(calculateShipping('QA', 30, zones)).toEqual({ rate: 0, isFree: false, zone: null })
  })
  it('handles a zero-rate zone without a threshold (Kuwait)', () => {
    expect(calculateShipping('KW', 5, zones)).toEqual({ rate: 0, isFree: false, zone: zones[0] })
  })
})
