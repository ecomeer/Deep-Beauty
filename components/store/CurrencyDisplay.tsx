'use client'

import { useCountry } from '@/context/CountryContext'
import { GULF_COUNTRIES, EXCHANGE_RATES, CURRENCY_SYMBOLS } from '@/lib/currency'

interface CurrencyDisplayProps {
  amountKWD: number
  className?: string
  showSymbol?: boolean
  decimals?: number
}

export default function CurrencyDisplay({
  amountKWD,
  className = '',
  showSymbol = true,
  decimals = 2
}: CurrencyDisplayProps) {
  const { selectedCountry: country } = useCountry()
  const currency = GULF_COUNTRIES[country]?.currency || 'KWD'
  const rate = EXCHANGE_RATES[currency as keyof typeof EXCHANGE_RATES] || 1
  const symbol = CURRENCY_SYMBOLS[currency as keyof typeof CURRENCY_SYMBOLS] || 'د.ك'
  
  const convertedAmount = amountKWD * rate
  const formatted = convertedAmount.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  
  return (
    <span className={className}>
      {showSymbol && <span className="ml-1">{symbol}</span>}
      {formatted}
    </span>
  )
}
