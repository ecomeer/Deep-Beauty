'use client'

import { useState, useRef, useEffect } from 'react'
import { useCountry } from '@/context/CountryContext'
import { GULF_COUNTRIES, GulfCountry } from '@/lib/currency'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

export default function CountrySelector() {
  const { selectedCountry, countryConfig, setCountry } = useCountry()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (code: GulfCountry) => {
    setCountry(code)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="اختيار الدولة"
      >
        <span className="text-2xl">{countryConfig.flag}</span>
        <span className="text-sm font-medium hidden sm:block">{countryConfig.name_ar}</span>
        <span className="text-xs text-gray-500 hidden sm:block">({countryConfig.currency})</span>
        <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
          <p className="text-xs text-gray-500 px-4 py-2 border-b border-gray-100">
            اختر بلدك / العملة
          </p>
          {Object.entries(GULF_COUNTRIES).map(([code, country]) => (
            <button
              key={code}
              onClick={() => handleSelect(code as GulfCountry)}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-right ${
                selectedCountry === code ? 'bg-[#9C6644]/5' : ''
              }`}
            >
              <span className="text-2xl">{country.flag}</span>
              <div className="flex-1 text-right">
                <p className={`text-sm font-medium ${selectedCountry === code ? 'text-[#9C6644]' : 'text-gray-800'}`}>
                  {country.name_ar}
                </p>
                <p className="text-xs text-gray-500">
                  {country.currency_name_ar} ({country.currency})
                </p>
              </div>
              {selectedCountry === code && (
                <div className="w-2 h-2 rounded-full bg-[#9C6644]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
