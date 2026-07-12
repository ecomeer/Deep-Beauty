'use client'

import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

/**
 * Shared fetch lifecycle for admin list pages.
 *
 * `unwrap` extracts the item array from the endpoint's response shape
 * (`{ banners }`, `{ sales }`, a bare array, ...) so the differing admin
 * APIs don't need to change. `raw` exposes the last full response for
 * pages that also need pagination fields (total, totalPages).
 *
 * Pass the current `url` (including query params); the list refetches
 * whenever it changes. Call `refetch()` after mutations.
 */
export function useAdminList<T>(
  url: string,
  unwrap: (json: unknown) => T[]
) {
  const [items, setItems] = useState<T[]>([])
  const [raw, setRaw] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setRaw(json)
      setItems(unwrap(json))
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'fetch failed'
      setError(message)
      toast.error('تعذّر تحميل البيانات')
    } finally {
      setLoading(false)
    }
    // unwrap is intentionally excluded: callers pass inline functions whose
    // identity changes every render but whose behavior is static.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { items, setItems, raw, loading, error, refetch }
}
