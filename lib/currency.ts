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

// Admin-managed overrides (settings table) take precedence; the static
// table above is the fallback when no override is configured.
export type ExchangeRates = Partial<Record<CurrencyCode, number>>

// Convert amount from KWD to target currency
export function convertFromKWD(
  amountKWD: number,
  targetCurrency: CurrencyCode,
  rates?: ExchangeRates
): number {
  if (targetCurrency === 'KWD') return amountKWD
  const rate = rates?.[targetCurrency] || EXCHANGE_RATES[targetCurrency]
  return amountKWD * rate
}

// Format price in specific currency
export function formatPrice(
  amountKWD: number,
  currency: CurrencyCode,
  rates?: ExchangeRates
): string {
  const converted = convertFromKWD(amountKWD, currency, rates)
  const symbol = CURRENCY_SYMBOLS[currency]

  // Different decimal places based on currency
  const decimals = currency === 'KWD' || currency === 'BHD' || currency === 'OMR' ? 3 : 2

  return `${converted.toFixed(decimals)} ${symbol}`
}

// Settings keys (settings table) for admin-managed exchange rates
export const EXCHANGE_RATE_SETTING_KEYS: Record<string, CurrencyCode> = {
  exchange_rate_sar: 'SAR',
  exchange_rate_aed: 'AED',
  exchange_rate_qar: 'QAR',
  exchange_rate_bhd: 'BHD',
  exchange_rate_omr: 'OMR',
}

// Parses settings rows ({key, value}) into an ExchangeRates object,
// ignoring missing or non-numeric values.
export function parseExchangeRateSettings(
  rows: Array<{ key: string; value: string | null }> | null | undefined
): ExchangeRates | undefined {
  if (!rows?.length) return undefined
  const rates: ExchangeRates = {}
  for (const row of rows) {
    const currency = EXCHANGE_RATE_SETTING_KEYS[row.key]
    const rate = row.value ? parseFloat(row.value) : NaN
    if (currency && Number.isFinite(rate) && rate > 0) rates[currency] = rate
  }
  return Object.keys(rates).length ? rates : undefined
}

// Get currency by country code
export function getCurrencyByCountry(countryCode: GulfCountry): CurrencyCode {
  return GULF_COUNTRIES[countryCode].currency
}
