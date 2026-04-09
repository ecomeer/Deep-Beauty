'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
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
  const [selectedCountry, setSelectedCountry] = useState<GulfCountry>(DEFAULT_COUNTRY)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem(STORAGE_KEY) as GulfCountry | null
    if (stored && GULF_COUNTRIES[stored]) {
      setSelectedCountry(stored)
    }
  }, [])

  const setCountry = (country: GulfCountry) => {
    setSelectedCountry(country)
    localStorage.setItem(STORAGE_KEY, country)
  }

  const currency = getCurrencyByCountry(selectedCountry)
  const countryConfig = GULF_COUNTRIES[selectedCountry]

  const formatPriceWithCurrency = (amountKWD: number) => {
    return formatPrice(amountKWD, currency)
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <CountryContext.Provider
        value={{
          selectedCountry: DEFAULT_COUNTRY,
          currency: 'KWD',
          countryConfig: GULF_COUNTRIES[DEFAULT_COUNTRY],
          setCountry: () => {},
          formatPrice: (amount: number) => formatPrice(amount, 'KWD')
        }}
      >
        {children}
      </CountryContext.Provider>
    )
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

export function useCountry() {
  const context = useContext(CountryContext)
  if (context === undefined) {
    throw new Error('useCountry must be used within a CountryProvider')
  }
  return context
}
