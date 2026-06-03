'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClientSupabase } from '@/lib/supabase-client'

interface WishlistItem {
  id: string
  name_ar: string
  name_en: string
  price: number
  image: string
  slug: string
  addedAt: string
}

const LS_KEY = 'deep-beauty-wishlist'

function loadFromLS(): WishlistItem[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function useWishlist() {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const supabase = useRef<ReturnType<typeof createClientSupabase> | null>(null)
  function getSupabase() {
    if (!supabase.current) supabase.current = createClientSupabase()
    return supabase.current
  }

  // On mount: check auth, load from server or localStorage
  useEffect(() => {
    let cancelled = false

    async function init() {
      const { data: { user } } = await getSupabase().auth.getUser()
      if (cancelled) return

      if (user) {
        setIsLoggedIn(true)
        const res = await fetch('/api/wishlist')
        if (!cancelled && res.ok) {
          const { items: serverItems } = await res.json()
          setItems((serverItems || []).map((row: any) => ({
            id: row.products.id,
            name_ar: row.products.name_ar,
            name_en: row.products.name_en,
            price: row.products.price,
            image: row.products.images?.[0] ?? '',
            slug: row.products.slug ?? row.products.id,
            addedAt: row.created_at,
          })))
        }
      } else {
        setItems(loadFromLS())
      }
      if (!cancelled) setIsLoaded(true)
    }

    init()

    const { data: { subscription } } = getSupabase().auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setIsLoggedIn(false)
        setItems(loadFromLS())
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  // Persist to localStorage when not logged in
  useEffect(() => {
    if (isLoaded && !isLoggedIn) {
      localStorage.setItem(LS_KEY, JSON.stringify(items))
    }
  }, [items, isLoaded, isLoggedIn])

  const addItem = useCallback(async (product: Omit<WishlistItem, 'addedAt'>) => {
    if (isLoggedIn) {
      await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: product.id }),
      })
    }
    setItems(prev => {
      if (prev.some(i => i.id === product.id)) return prev
      return [...prev, { ...product, addedAt: new Date().toISOString() }]
    })
  }, [isLoggedIn])

  const removeItem = useCallback(async (productId: string) => {
    if (isLoggedIn) {
      await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId }),
      })
    }
    setItems(prev => prev.filter(i => i.id !== productId))
  }, [isLoggedIn])

  const toggleItem = useCallback(async (product: Omit<WishlistItem, 'addedAt'>) => {
    const exists = items.some(i => i.id === product.id)
    if (isLoggedIn) {
      await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: product.id }),
      })
    }
    setItems(prev =>
      exists
        ? prev.filter(i => i.id !== product.id)
        : [...prev, { ...product, addedAt: new Date().toISOString() }]
    )
  }, [items, isLoggedIn])

  const isInWishlist = useCallback((productId: string) => {
    return items.some(i => i.id === productId)
  }, [items])

  const clearWishlist = useCallback(async () => {
    if (isLoggedIn) {
      await Promise.all(items.map(i =>
        fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: i.id }),
        })
      ))
    }
    setItems([])
  }, [items, isLoggedIn])

  return {
    items,
    addItem,
    removeItem,
    toggleItem,
    isInWishlist,
    clearWishlist,
    totalItems: items.length,
    isLoaded,
  }
}
