// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { CartProvider, useCartContext } from '@/context/CartContext'
import { WishlistProvider, useWishlistContext } from '@/context/WishlistContext'
import type { Product } from '@/types'

vi.mock('next/image', async () => (await import('@/test/helpers/component-mocks')).nextImageMock())
vi.mock('next/link', async () => (await import('@/test/helpers/component-mocks')).nextLinkMock())

const toastSuccess = vi.hoisted(() => vi.fn())
vi.mock('react-hot-toast', () => ({ default: { success: toastSuccess } }))

vi.mock('@/lib/supabase-client', () => ({
  createClientSupabase: () => ({
    auth: {
      getUser: async () => ({ data: { user: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  }),
}))

import QuickViewModal from './QuickViewModal'

let cart: ReturnType<typeof useCartContext>
let wishlist: ReturnType<typeof useWishlistContext>
function Capture() {
  cart = useCartContext()
  wishlist = useWishlistContext()
  return null
}

const product = (overrides: Partial<Product> = {}): Product =>
  ({
    id: 'p1',
    name_ar: 'سيروم فيتامين سي',
    name_en: 'Vitamin C Serum',
    slug: 'vitamin-c',
    price: 12,
    compare_price: null,
    images: [],
    stock_quantity: 3,
    category: 'skincare',
    description_ar: 'وصف',
    is_active: true,
    ...overrides,
  }) as unknown as Product

const onClose = vi.fn()

function renderModal(p: Product | null, isOpen = true) {
  return render(
    <CartProvider>
      <WishlistProvider>
        <Capture />
        <QuickViewModal product={p} isOpen={isOpen} onClose={onClose} />
      </WishlistProvider>
    </CartProvider>
  )
}

beforeEach(() => {
  localStorage.clear()
  onClose.mockClear()
  toastSuccess.mockClear()
})

afterAll(() => {
  vi.unstubAllGlobals()
})

describe('QuickViewModal', () => {
  it('renders nothing when closed or without a product', () => {
    expect(renderModal(product(), false).container.textContent).toBe('')
    expect(renderModal(null, true).container.textContent).toBe('')
  })

  it('shows the product details', () => {
    renderModal(product())
    expect(screen.getByText('سيروم فيتامين سي')).toBeTruthy()
    expect(screen.getByText('Vitamin C Serum')).toBeTruthy()
    expect(screen.getByText('متوفر (3 قطعة)')).toBeTruthy()
  })

  it('clamps quantity between 1 and the stock', () => {
    renderModal(product({ stock_quantity: 2 }))
    const minus = screen.getByText('الكمية:').parentElement!.querySelectorAll('button')[0]
    const plus = screen.getByText('الكمية:').parentElement!.querySelectorAll('button')[1]

    fireEvent.click(minus)
    expect(screen.getByText('1')).toBeTruthy() // floored at 1

    fireEvent.click(plus)
    fireEvent.click(plus)
    fireEvent.click(plus)
    expect(screen.getByText('2')).toBeTruthy() // capped at stock (2)
  })

  it('adds the selected quantity to the cart, toasts, and closes', () => {
    renderModal(product())
    const plus = screen.getByText('الكمية:').parentElement!.querySelectorAll('button')[1]
    fireEvent.click(plus) // quantity 2

    fireEvent.click(screen.getByText('أضف للسلة'))

    expect(cart.items).toEqual([
      expect.objectContaining({ id: 'p1', quantity: 2, price: 12, slug: 'vitamin-c' }),
    ])
    expect(toastSuccess).toHaveBeenCalledWith(expect.stringContaining('سيروم فيتامين سي'))
    expect(onClose).toHaveBeenCalled()
  })

  it('disables add-to-cart and hides quantity controls at zero stock', () => {
    renderModal(product({ stock_quantity: 0 }))
    const addButton = screen.getByText('أضف للسلة').closest('button')!
    expect(addButton.disabled).toBe(true)
    expect(screen.queryByText('الكمية:')).toBeNull()
    expect(screen.getAllByText('نفذت الكمية').length).toBeGreaterThan(0)
  })

  it('toggles the wishlist with a toast', async () => {
    renderModal(product())
    // Wait out the hook's async init — it overwrites items from storage when
    // it resolves, so clicking earlier would race it.
    await waitFor(() => expect(wishlist.isLoaded).toBe(true))
    const buttons = screen.getByText('أضف للسلة').parentElement!.querySelectorAll('button')
    const heart = buttons[1]

    await act(async () => {
      fireEvent.click(heart)
    })
    expect(toastSuccess).toHaveBeenCalledWith('أُضيف للمفضلة ❤️')
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem('deep-beauty-wishlist') ?? '[]')).toHaveLength(1)
    )
  })

  it('closes on backdrop click', () => {
    const { container } = renderModal(product())
    fireEvent.click(container.querySelector('.absolute.inset-0')!)
    expect(onClose).toHaveBeenCalled()
  })
})
