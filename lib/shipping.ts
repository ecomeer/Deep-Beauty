import { GulfCountry } from './currency'

export interface ShippingZone {
  id: string
  name_ar: string
  name_en: string
  countries: GulfCountry[]
  base_rate: number // in KWD
  free_shipping_threshold: number | null // in KWD, null means no free shipping
  estimated_days_min: number
  estimated_days_max: number
  is_active: boolean
}

export interface ShippingRate {
  zone_id: string
  weight_from: number // in kg
  weight_to: number // in kg
  rate: number // in KWD
}

// Default shipping zones for Gulf countries
export const DEFAULT_SHIPPING_ZONES: Omit<ShippingZone, 'id'>[] = [
  {
    name_ar: 'الكويت',
    name_en: 'Kuwait',
    countries: ['KW'],
    base_rate: 0, // Free shipping in Kuwait
    free_shipping_threshold: null,
    estimated_days_min: 1,
    estimated_days_max: 2,
    is_active: true
  },
  {
    name_ar: 'السعودية',
    name_en: 'Saudi Arabia',
    countries: ['SA'],
    base_rate: 2.5,
    free_shipping_threshold: 50,
    estimated_days_min: 3,
    estimated_days_max: 5,
    is_active: true
  },
  {
    name_ar: 'الإمارات',
    name_en: 'UAE',
    countries: ['AE'],
    base_rate: 2.5,
    free_shipping_threshold: 50,
    estimated_days_min: 2,
    estimated_days_max: 4,
    is_active: true
  },
  {
    name_ar: 'قطر',
    name_en: 'Qatar',
    countries: ['QA'],
    base_rate: 3,
    free_shipping_threshold: 50,
    estimated_days_min: 2,
    estimated_days_max: 4,
    is_active: true
  },
  {
    name_ar: 'البحرين',
    name_en: 'Bahrain',
    countries: ['BH'],
    base_rate: 2.5,
    free_shipping_threshold: 50,
    estimated_days_min: 2,
    estimated_days_max: 3,
    is_active: true
  },
  {
    name_ar: 'عمان',
    name_en: 'Oman',
    countries: ['OM'],
    base_rate: 3.5,
    free_shipping_threshold: 60,
    estimated_days_min: 3,
    estimated_days_max: 5,
    is_active: true
  }
]

// Calculate shipping cost
export function calculateShipping(
  countryCode: GulfCountry,
  subtotalKWD: number,
  zones: ShippingZone[]
): { rate: number; isFree: boolean; zone: ShippingZone | null } {
  const zone = zones.find(z => z.countries.includes(countryCode) && z.is_active)
  
  if (!zone) {
    return { rate: 0, isFree: false, zone: null }
  }
  
  // Check free shipping threshold
  if (zone.free_shipping_threshold && subtotalKWD >= zone.free_shipping_threshold) {
    return { rate: 0, isFree: true, zone }
  }
  
  return { rate: zone.base_rate, isFree: false, zone }
}

// Get shipping estimate text
export function getShippingEstimate(zone: ShippingZone | null): string {
  if (!zone) return ''
  
  if (zone.estimated_days_min === zone.estimated_days_max) {
    return `${zone.estimated_days_min} يوم`
  }
  
  return `من ${zone.estimated_days_min} إلى ${zone.estimated_days_max} أيام`
}

// Get zone by country
export function getZoneByCountry(
  countryCode: GulfCountry,
  zones: ShippingZone[]
): ShippingZone | null {
  return zones.find(z => z.countries.includes(countryCode) && z.is_active) || null
}
