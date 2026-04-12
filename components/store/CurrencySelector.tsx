'use client'

import { useContext } from 'react'
import { CountryContext } from '@/context/CountryContext'
import { GULF_COUNTRIES, CURRENCY_SYMBOLS } from '@/lib/currency'

export default function CurrencySelector() {
  const { country, setCountry } = useContext(CountryContext)

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm opacity-60">الدولة:</span>
      <select
        value={country}
        onChange={(e) => setCountry(e.target.value as any)}
        className="text-sm font-medium bg-transparent border-none focus:ring-0 cursor-pointer"
        style={{ color: 'var(--text-dark)' }}
      >
        {Object.entries(GULF_COUNTRIES).map(([code, config]) => (
          <option key={code} value={code}>
            {config.flag} {config.name_ar}
          </option>
        ))}
      </select>
    </div>
  )
}
