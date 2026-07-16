// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

const holders = vi.hoisted(() => ({
  getUser: undefined as unknown as ReturnType<typeof vi.fn>,
}))

vi.mock('@/lib/supabase-client', () => ({
  createClientSupabase: () => ({
    auth: {
      getUser: holders.getUser,
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  }),
}))

import { useWishlist, type WishlistItem } from './useWishlist'

const LS_KEY = 'deep-beauty-wishlist'

const product = (overrides: Partial<WishlistItem> = {}): Omit<WishlistItem, 'addedAt'> => ({
  id: 'p1',
  name_ar: 'كريم',
  name_en: 'Cream',
  price: 10,
  image: '',
  slug: 'cream',
  ...overrides,
})

const fetchMock = vi.fn()

beforeEach(() => {
  localStorage.clear()
  holders.getUser = vi.fn().mockResolvedValue({ data: { user: null } })
  fetchMock.mockReset()
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ items: [] })))
  vi.stubGlobal('fetch', fetchMock)
})

afterAll(() => {
  vi.unstubAllGlobals()
})

async function renderLoaded() {
  const rendered = renderHook(() => useWishlist())
  await waitFor(() => expect(rendered.result.current.isLoaded).toBe(true))
  return rendered
}

describe('useWishlist — guest', () => {
  it('loads the wishlist from localStorage', async () => {
    localStorage.setItem(LS_KEY, JSON.stringify([{ ...product(), addedAt: 'now' }]))
    const { result } = await renderLoaded()
    expect(result.current.totalItems).toBe(1)
    expect(result.current.isInWishlist('p1')).toBe(true)
  })

  it('recovers from corrupt localStorage with an empty list', async () => {
    localStorage.setItem(LS_KEY, '{oops')
    const { result } = await renderLoaded()
    expect(result.current.items).toEqual([])
  })

  it('toggles an item on and off without calling the API', async () => {
    const { result } = await renderLoaded()

    await act(() => result.current.toggleItem(product()))
    expect(result.current.isInWishlist('p1')).toBe(true)

    await act(() => result.current.toggleItem(product()))
    expect(result.current.isInWishlist('p1')).toBe(false)

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('does not duplicate an item added twice', async () => {
    const { result } = await renderLoaded()
    await act(() => result.current.addItem(product()))
    await act(() => result.current.addItem(product()))
    expect(result.current.totalItems).toBe(1)
  })

  it('persists to localStorage', async () => {
    const { result } = await renderLoaded()
    await act(() => result.current.addItem(product()))
    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') as WishlistItem[]
      expect(saved.map((i) => i.id)).toEqual(['p1'])
    })
  })

  it('clears the wishlist', async () => {
    const { result } = await renderLoaded()
    await act(() => result.current.addItem(product()))
    await act(() => result.current.clearWishlist())
    expect(result.current.items).toEqual([])
  })
})

describe('useWishlist — logged in', () => {
  beforeEach(() => {
    holders.getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } })
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [
            {
              created_at: '2026-01-01',
              products: { id: 'p9', name_ar: 'عطر', name_en: 'Perfume', price: 30, images: ['a.jpg'], slug: 'perfume' },
            },
          ],
        })
      )
    )
  })

  it('loads the wishlist from the server, not localStorage', async () => {
    localStorage.setItem(LS_KEY, JSON.stringify([{ ...product(), addedAt: 'now' }]))
    const { result } = await renderLoaded()

    expect(fetchMock).toHaveBeenCalledWith('/api/wishlist')
    expect(result.current.items).toEqual([
      {
        id: 'p9',
        name_ar: 'عطر',
        name_en: 'Perfume',
        price: 30,
        image: 'a.jpg',
        slug: 'perfume',
        addedAt: '2026-01-01',
      },
    ])
  })

  it('syncs a toggle to the API', async () => {
    const { result } = await renderLoaded()
    fetchMock.mockClear()
    fetchMock.mockResolvedValue(new Response('{}'))

    await act(() => result.current.toggleItem(product()))

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/wishlist',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ product_id: 'p1' }),
      })
    )
  })
})
