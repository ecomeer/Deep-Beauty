'use client'

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react'
import {
  GulfCountry,
  CurrencyCode,
  CountryConfig,
  GULF_COUNTRIES,
  getCurrencyByCountry,
  formatPrice,
  type ExchangeRates,
} from '@/lib/currency'

interface CountryContextType {
  selectedCountry: GulfCountry
  currency: CurrencyCode
  countryConfig: CountryConfig
  setCountry: (country: GulfCountry) => void
  formatPrice: (amountKWD: number) => string
}

const CountryContext = createContext<CountryContextType | undefined>(undefined)

const STORAGE_KEY = 'selected_country'
const DEFAULT_COUNTRY: GulfCountry = 'KW'

function buildCountryValue(
  country: GulfCountry,
  setCountry: (country: GulfCountry) => void,
  rates?: ExchangeRates
): CountryContextType {
  const currency = getCurrencyByCountry(country)
  return {
    selectedCountry: country,
    currency,
    countryConfig: GULF_COUNTRIES[country],
    setCountry,
    formatPrice: (amountKWD: number) => formatPrice(amountKWD, currency, rates),
  }
}

export function CountryProvider({
  children,
  initialRates,
}: {
  children: ReactNode
  // Admin-managed exchange rates loaded server-side from the settings table
  initialRates?: ExchangeRates
}) {
  const [selectedCountry, setSelectedCountry] = useState<GulfCountry>(() => {
    if (typeof window === 'undefined') return DEFAULT_COUNTRY
    const stored = localStorage.getItem(STORAGE_KEY) as GulfCountry | null
    return stored && GULF_COUNTRIES[stored] ? stored : DEFAULT_COUNTRY
  })

  const setCountry = useCallback((country: GulfCountry) => {
    setSelectedCountry(country)
    localStorage.setItem(STORAGE_KEY, country)
  }, [])

  const value = useMemo(
    () => buildCountryValue(selectedCountry, setCountry, initialRates),
    [selectedCountry, setCountry, initialRates]
  )

  return (
    <CountryContext.Provider value={value}>
      {children}
    </CountryContext.Provider>
  )
}

export function useCountry(): CountryContextType {
  const context = useContext(CountryContext)
  if (context === undefined) {
    // Safe defaults during SSR before provider mounts
    return buildCountryValue(DEFAULT_COUNTRY, () => {})
  }
  return context
}
