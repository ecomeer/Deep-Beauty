'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCountry } from '@/context/CountryContext'
import { Product } from '@/types'
import { MagnifyingGlassIcon, SparklesIcon } from '@heroicons/react/24/outline'

const DEBOUNCE_MS = 300
const MAX_RESULTS = 5

/**
 * Debounced instant-search dropdown fed by the existing /api/products?search=
 * endpoint. Renders below the search input; parent controls the query string.
 */
export default function SearchSuggestions({
  query,
  onNavigate,
}: {
  query: string
  onNavigate?: () => void
}) {
  const [results, setResults] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState('')
  const { formatPrice } = useCountry()
  const abortRef = useRef<AbortController | null>(null)

  const trimmed = query.trim()

  useEffect(() => {
    if (trimmed.length < 2) {
      setResults([]); setSearched(''); setLoading(false)
      abortRef.current?.abort()
      return
    }
    setLoading(true)
    const timer = setTimeout(async () => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      try {
        const res = await fetch(
          `/api/products?search=${encodeURIComponent(trimmed)}&limit=${MAX_RESULTS}`,
          { signal: controller.signal }
        )
        if (!res.ok) throw new Error()
        const json = await res.json()
        setResults(json.products || [])
        setSearched(trimmed)
      } catch {
        if (!controller.signal.aborted) { setResults([]); setSearched(trimmed) }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [trimmed])

  if (trimmed.length < 2) return null

  return (
    <div
      className="absolute top-full inset-x-0 mt-2 bg-white rounded-2xl shadow-lg border border-beige overflow-hidden z-50"
      role="listbox"
      aria-label="اقتراحات البحث"
    >
      {loading && searched !== trimmed ? (
        <div className="px-4 py-3 space-y-2.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="skeleton w-10 h-10 rounded-lg flex-shrink-0" />
              <div className="skeleton h-3 flex-1 rounded" />
            </div>
          ))}
        </div>
      ) : results.length === 0 ? (
        <p className="px-4 py-4 text-sm text-on-surface-variant text-center">
          لا نتائج لـ «{trimmed}» — جرّبي كلمة أخرى
        </p>
      ) : (
        <>
          <ul>
            {results.map((p) => (
              <li key={p.id} role="option" aria-selected="false">
                <Link
                  href={`/products/${p.slug}`}
                  onClick={onNavigate}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface transition-colors"
                >
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-beige flex-shrink-0">
                    {p.images?.[0] ? (
                      <Image src={p.images[0]} alt="" fill sizes="40px" className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <SparklesIcon className="w-5 h-5 text-primary opacity-30" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  <span className="flex-1 text-sm font-medium text-on-surface line-clamp-1">
                    {p.name_ar}
                  </span>
                  <span className="text-xs font-bold text-primary flex-shrink-0" dir="ltr">
                    {formatPrice(p.sale_price ?? p.price)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href={`/products?search=${encodeURIComponent(trimmed)}`}
            onClick={onNavigate}
            className="flex items-center justify-center gap-1.5 px-4 py-3 text-xs font-bold text-primary border-t border-beige hover:bg-surface transition-colors"
          >
            <MagnifyingGlassIcon className="w-3.5 h-3.5" aria-hidden="true" />
            عرض كل النتائج
          </Link>
        </>
      )}
    </div>
  )
}
