'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useWishlist } from '@/hooks/useWishlist'

type WishlistContextType = ReturnType<typeof useWishlist>

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
