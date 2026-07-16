// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { CartProvider, useCartContext } from './CartContext'
import type { CartItem } from '@/types'
import type { ReactNode } from 'react'

beforeEach(() => {
  localStorage.clear()
})

describe('useCartContext', () => {
  it('throws when used outside CartProvider', () => {
    expect(() => renderHook(() => useCartContext())).toThrow(
      'useCartContext must be used inside CartProvider'
    )
  })

  it('exposes the shared cart inside the provider', () => {
    const wrapper = ({ children }: { children: ReactNode }) => <CartProvider>{children}</CartProvider>
    const { result } = renderHook(() => useCartContext(), { wrapper })

    act(() =>
      result.current.addItem({ id: 'p1', name_ar: 'كريم', price: 10, quantity: 2 } as CartItem)
    )
    expect(result.current.totalItems).toBe(2)
    expect(result.current.subtotal).toBe(20)
    expect(result.current.isOpen).toBe(true) // addItem opens the sidebar
  })
})
