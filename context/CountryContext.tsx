'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { 
  GulfCountry, 
  CurrencyCode, 
  CountryConfig, 
  GULF_COUNTRIES, 
  getCurrencyByCountry,
  formatPrice 
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

export function CountryProvider({ children }: { children: ReactNode }) {
  const [selectedCountry, setSelectedCountry] = useState<GulfCountry>(() => {
    if (typeof window === 'undefined') return DEFAULT_COUNTRY
    const stored = localStorage.getItem(STORAGE_KEY) as GulfCountry | null
    return stored && GULF_COUNTRIES[stored] ? stored : DEFAULT_COUNTRY
  })

  const setCountry = (country: GulfCountry) => {
    setSelectedCountry(country)
    localStorage.setItem(STORAGE_KEY, country)
  }

  const currency = getCurrencyByCountry(selectedCountry)
  const countryConfig = GULF_COUNTRIES[selectedCountry]

  const formatPriceWithCurrency = (amountKWD: number) => {
    return formatPrice(amountKWD, currency)
  }

  return (
    <CountryContext.Provider
      value={{
        selectedCountry,
        currency,
        countryConfig,
        setCountry,
        formatPrice: formatPriceWithCurrency
      }}
    >
      {children}
    </CountryContext.Provider>
  )
}

export function useCountry(): CountryContextType {
  const context = useContext(CountryContext)
  if (context === undefined) {
    // Return safe defaults during SSR before provider mounts
    return {
      selectedCountry: DEFAULT_COUNTRY,
      currency: 'KWD',
      countryConfig: GULF_COUNTRIES[DEFAULT_COUNTRY],
      setCountry: () => {},
      formatPrice: (amount: number) => formatPrice(amount, 'KWD'),
    }
  }
  return context
}
