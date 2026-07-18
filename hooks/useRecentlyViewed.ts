'use client'

import { useCallback, useEffect, useState } from 'react'

export interface RecentlyViewedItem {
  id: string
  slug: string
  name_ar: string
  image: string
  price: number
  sale_price?: number | null
}

const STORAGE_KEY = 'deep-beauty-recently-viewed'
const MAX_ITEMS = 8

function readStored(): RecentlyViewedItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((p) => p && p.id && p.slug) : []
  } catch {
    return []
  }
}

/**
 * Tracks the visitor's recently viewed products in localStorage.
 * `record` is stable — call it from a product page effect; `items`
 * excludes the ids passed in `excludeIds` (e.g. the product being viewed).
 */
export function useRecentlyViewed(excludeIds: string[] = []) {
  const [items, setItems] = useState<RecentlyViewedItem[]>([])

  useEffect(() => {
    setItems(readStored())
  }, [])

  const record = useCallback((item: RecentlyViewedItem) => {
    try {
      const rest = readStored().filter((p) => p.id !== item.id)
      const next = [item, ...rest].slice(0, MAX_ITEMS)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      setItems(next)
    } catch {
      // storage unavailable (private mode) — feature degrades silently
    }
  }, [])

  const visible = items.filter((p) => !excludeIds.includes(p.id))
  return { items: visible, record }
}
