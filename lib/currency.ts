// Gulf Countries Currency Configuration
export type GulfCountry = 'KW' | 'SA' | 'AE' | 'QA' | 'BH' | 'OM'
export type CurrencyCode = 'KWD' | 'SAR' | 'AED' | 'QAR' | 'BHD' | 'OMR'

export interface CountryConfig {
  code: GulfCountry
  name_ar: string
  name_en: string
  currency: CurrencyCode
  currency_name_ar: string
  currency_name_en: string
  flag: string
  phone_prefix: string
}

export const GULF_COUNTRIES: Record<GulfCountry, CountryConfig> = {
  KW: {
    code: 'KW',
    name_ar: 'الكويت',
    name_en: 'Kuwait',
    currency: 'KWD',
    currency_name_ar: 'دينار كويتي',
    currency_name_en: 'Kuwaiti Dinar',
    flag: '🇰🇼',
    phone_prefix: '+965'
  },
  SA: {
    code: 'SA',
    name_ar: 'المملكة العربية السعودية',
    name_en: 'Saudi Arabia',
    currency: 'SAR',
    currency_name_ar: 'ريال سعودي',
    currency_name_en: 'Saudi Riyal',
    flag: '🇸🇦',
    phone_prefix: '+966'
  },
  AE: {
    code: 'AE',
    name_ar: 'الإمارات العربية المتحدة',
    name_en: 'United Arab Emirates',
    currency: 'AED',
    currency_name_ar: 'درهم إماراتي',
    currency_name_en: 'UAE Dirham',
    flag: '🇦🇪',
    phone_prefix: '+971'
  },
  QA: {
    code: 'QA',
    name_ar: 'دولة قطر',
    name_en: 'Qatar',
    currency: 'QAR',
    currency_name_ar: 'ريال قطري',
    currency_name_en: 'Qatari Riyal',
    flag: '🇶🇦',
    phone_prefix: '+974'
  },
  BH: {
    code: 'BH',
    name_ar: 'مملكة البحرين',
    name_en: 'Bahrain',
    currency: 'BHD',
    currency_name_ar: 'دينار بحريني',
    currency_name_en: 'Bahraini Dinar',
    flag: '🇧🇭',
    phone_prefix: '+973'
  },
  OM: {
    code: 'OM',
    name_ar: 'سلطنة عمان',
    name_en: 'Oman',
    currency: 'OMR',
    currency_name_ar: 'ريال عماني',
    currency_name_en: 'Omani Rial',
    flag: '🇴🇲',
    phone_prefix: '+968'
  }
}

// Exchange rates (1 KWD = X currency)
// These should be updated regularly or fetched from an API
export const EXCHANGE_RATES: Record<CurrencyCode, number> = {
  KWD: 1,
  SAR: 12.25,    // 1 KWD ≈ 12.25 SAR
  AED: 11.95,    // 1 KWD ≈ 11.95 AED
  QAR: 11.85,    // 1 KWD ≈ 11.85 QAR
  BHD: 1.23,     // 1 KWD ≈ 1.23 BHD
  OMR: 1.26      // 1 KWD ≈ 1.26 OMR
}

// Currency symbols
export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  KWD: 'د.ك',
  SAR: 'ر.س',
  AED: 'د.إ',
  QAR: 'ر.ق',
  BHD: 'د.ب',
  OMR: 'ر.ع'
}

// Convert amount from KWD to target currency
export function convertFromKWD(amountKWD: number, targetCurrency: CurrencyCode): number {
  if (targetCurrency === 'KWD') return amountKWD
  return amountKWD * EXCHANGE_RATES[targetCurrency]
}

// Convert amount to KWD from source currency
export function convertToKWD(amount: number, sourceCurrency: CurrencyCode): number {
  if (sourceCurrency === 'KWD') return amount
  return amount / EXCHANGE_RATES[sourceCurrency]
}

// Format price in specific currency
export function formatPrice(amountKWD: number, currency: CurrencyCode): string {
  const converted = convertFromKWD(amountKWD, currency)
  const symbol = CURRENCY_SYMBOLS[currency]
  
  // Different decimal places based on currency
  const decimals = currency === 'KWD' || currency === 'BHD' || currency === 'OMR' ? 3 : 2
  
  return `${converted.toFixed(decimals)} ${symbol}`
}

// Get country by code
export function getCountry(code: GulfCountry): CountryConfig {
  return GULF_COUNTRIES[code]
}

// Get default country (Kuwait)
export function getDefaultCountry(): CountryConfig {
  return GULF_COUNTRIES.KW
}

// Get currency by country code
export function getCurrencyByCountry(countryCode: GulfCountry): CurrencyCode {
  return GULF_COUNTRIES[countryCode].currency
}

// Validate phone number based on country
export function isValidPhone(phone: string, countryCode: GulfCountry): boolean {
  const prefixes = {
    KW: /^\+965[0-9]{8}$/,
    SA: /^\+9665[0-9]{8}$/,
    AE: /^\+9715[0-9]{8}$/,
    QA: /^\+974[0-9]{8}$/,
    BH: /^\+973[0-9]{8}$/,
    OM: /^\+968[0-9]{8}$/
  }
  
  return prefixes[countryCode].test(phone.replace(/\s/g, ''))
}

// Add country prefix to phone if missing
export function formatPhoneWithPrefix(phone: string, countryCode: GulfCountry): string {
  const cleanPhone = phone.replace(/\s/g, '').replace(/^0/, '')
  const prefix = GULF_COUNTRIES[countryCode].phone_prefix
  
  if (cleanPhone.startsWith('+')) {
    return cleanPhone
  }
  
  if (cleanPhone.startsWith(prefix.replace('+', ''))) {
    return `+${cleanPhone}`
  }
  
  return `${prefix}${cleanPhone}`
}
