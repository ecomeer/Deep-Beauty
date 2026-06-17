'use client'

import { useState, useEffect, useCallback } from 'react'

interface WishlistItem {
  id: string
  name_ar: string
  name_en: string
  price: number
  image: string
  slug: string
  addedAt: string
}

export function useWishlist() {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  // Load from localStorage after hydration to prevent error #418
  useEffect(() => {
    try {
      const stored = localStorage.getItem('deep-beauty-wishlist')
      if (stored) {
        setItems(JSON.parse(stored) as WishlistItem[])
      }
    } catch {
      // ignore
    }
    setHydrated(true)
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem('deep-beauty-wishlist', JSON.stringify(items))
    }
  }, [items, hydrated])

  const addItem = useCallback((product: {
    id: string
    name_ar: string
    name_en: string
    price: number
    image: string
    slug: string
  }) => {
    setItems(prev => {
      if (prev.some(item => item.id === product.id)) {
        return prev
      }
      return [...prev, {
        ...product,
        addedAt: new Date().toISOString()
      }]
    })
  }, [])

  const removeItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(item => item.id !== productId))
  }, [])

  const toggleItem = useCallback((product: {
    id: string
    name_ar: string
    name_en: string
    price: number
    image: string
    slug: string
  }) => {
    setItems(prev => {
      const exists = prev.some(item => item.id === product.id)
      if (exists) {
        return prev.filter(item => item.id !== product.id)
      }
      return [...prev, {
        ...product,
        addedAt: new Date().toISOString()
      }]
    })
  }, [])

  const isInWishlist = useCallback((productId: string) => {
    return items.some(item => item.id === productId)
  }, [items])

  const clearWishlist = useCallback(() => {
    setItems([])
  }, [])

  return {
    items,
    addItem,
    removeItem,
    toggleItem,
    isInWishlist,
    clearWishlist,
    totalItems: items.length,
    isLoaded: true
  }
}
