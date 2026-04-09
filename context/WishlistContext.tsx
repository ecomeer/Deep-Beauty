'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useWishlist } from '@/hooks/useWishlist'

interface WishlistItem {
  id: string
  name_ar: string
  name_en: string
  price: number
  image: string
  slug: string
  addedAt: string
}

interface WishlistContextType {
  items: WishlistItem[]
  addItem: (product: Omit<WishlistItem, 'addedAt'>) => void
  removeItem: (productId: string) => void
  toggleItem: (product: Omit<WishlistItem, 'addedAt'>) => void
  isInWishlist: (productId: string) => boolean
  clearWishlist: () => void
  totalItems: number
  isLoaded: boolean
}

const WishlistContext = createContext<WishlistContextType | null>(null)

export function WishlistProvider({ children }: { children: ReactNode }) {
  const wishlist = useWishlist()

  return (
    <WishlistContext.Provider value={wishlist}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlistContext() {
  const context = useContext(WishlistContext)
  if (!context) {
    throw new Error('useWishlistContext must be used within a WishlistProvider')
  }
  return context
}
