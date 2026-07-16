// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useCart } from './useCart'
import type { CartItem } from '@/types'

const CART_KEY = 'deep_beauty_cart'

const item = (overrides: Partial<CartItem> = {}): CartItem =>
  ({
    id: 'p1',
    name_ar: 'كريم',
    name_en: 'Cream',
    price: 10,
    quantity: 1,
    image: '',
    ...overrides,
  }) as CartItem

beforeEach(() => {
  localStorage.clear()
})

describe('useCart', () => {
  it('starts empty and closed', () => {
    const { result } = renderHook(() => useCart())
    expect(result.current.items).toEqual([])
    expect(result.current.totalItems).toBe(0)
    expect(result.current.subtotal).toBe(0)
    expect(result.current.isOpen).toBe(false)
  })

  it('restores a saved cart from localStorage after mount', async () => {
    localStorage.setItem(CART_KEY, JSON.stringify([item({ quantity: 3 })]))
    const { result } = renderHook(() => useCart())
    await waitFor(() => expect(result.current.totalItems).toBe(3))
    expect(result.current.subtotal).toBe(30)
  })

  it('recovers from corrupt localStorage with an empty cart', async () => {
    localStorage.setItem(CART_KEY, '{not json')
    const { result } = renderHook(() => useCart())
    // Hydration must still complete (writes back a valid empty cart on change).
    act(() => result.current.addItem(item()))
    await waitFor(() => expect(result.current.items).toHaveLength(1))
  })

  it('adds an item and opens the sidebar', () => {
    const { result } = renderHook(() => useCart())
    act(() => result.current.addItem(item()))
    expect(result.current.items).toHaveLength(1)
    expect(result.current.isOpen).toBe(true)
  })

  it('merges quantities when the same item is added twice', () => {
    const { result } = renderHook(() => useCart())
    act(() => result.current.addItem(item({ quantity: 1 })))
    act(() => result.current.addItem(item({ quantity: 2 })))
    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].quantity).toBe(3)
    expect(result.current.subtotal).toBe(30)
  })

  it('updates quantity and removes the item at zero', () => {
    const { result } = renderHook(() => useCart())
    act(() => result.current.addItem(item()))
    act(() => result.current.updateQuantity('p1', 5))
    expect(result.current.items[0].quantity).toBe(5)

    act(() => result.current.updateQuantity('p1', 0))
    expect(result.current.items).toHaveLength(0)
  })

  it('removes an item by id', () => {
    const { result } = renderHook(() => useCart())
    act(() => result.current.addItem(item()))
    act(() => result.current.addItem(item({ id: 'p2' })))
    act(() => result.current.removeItem('p1'))
    expect(result.current.items.map((i) => i.id)).toEqual(['p2'])
  })

  it('clears the cart', () => {
    const { result } = renderHook(() => useCart())
    act(() => result.current.addItem(item()))
    act(() => result.current.clearCart())
    expect(result.current.items).toEqual([])
  })

  it('persists changes to localStorage after hydration', async () => {
    const { result } = renderHook(() => useCart())
    act(() => result.current.addItem(item({ quantity: 2 })))
    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem(CART_KEY) ?? '[]') as CartItem[]
      expect(saved).toHaveLength(1)
      expect(saved[0].quantity).toBe(2)
    })
  })
})
