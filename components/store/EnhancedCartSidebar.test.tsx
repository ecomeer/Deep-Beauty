// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { CartProvider, useCartContext } from '@/context/CartContext'
import { CountryProvider, useCountry } from '@/context/CountryContext'
import type { CartItem } from '@/types'

vi.mock('framer-motion', async () => (await import('@/test/helpers/component-mocks')).framerMotionMock())
vi.mock('next/image', async () => (await import('@/test/helpers/component-mocks')).nextImageMock())
vi.mock('next/link', async () => (await import('@/test/helpers/component-mocks')).nextLinkMock())

import EnhancedCartSidebar from './EnhancedCartSidebar'

let cart: ReturnType<typeof useCartContext>
let country: ReturnType<typeof useCountry>

function Capture() {
  cart = useCartContext()
  country = useCountry()
  return null
}

const item = (overrides: Partial<CartItem> = {}): CartItem =>
  ({
    id: 'p1',
    name_ar: 'كريم مرطب',
    name_en: 'Moisturizer',
    price: 10,
    quantity: 1,
    image: '',
    slug: 'moisturizer',
    ...overrides,
  }) as CartItem

function renderSidebar() {
  return render(
    <CountryProvider>
      <CartProvider>
        <Capture />
        <EnhancedCartSidebar />
      </CartProvider>
    </CountryProvider>
  )
}

function openWith(items: CartItem[]) {
  act(() => {
    items.forEach((i) => cart.addItem(i)) // addItem also opens the sidebar
    cart.setIsOpen(true)
  })
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('EnhancedCartSidebar', () => {
  it('renders nothing while closed', () => {
    const { container } = renderSidebar()
    expect(container.querySelector('[role="dialog"]')).toBeNull()
  })

  it('shows the empty state when opened with no items', () => {
    renderSidebar()
    act(() => cart.setIsOpen(true))
    expect(screen.getByText('سلة التسوق فارغة')).toBeTruthy()
  })

  it('renders cart items with free shipping for Kuwait', () => {
    renderSidebar()
    openWith([item({ quantity: 2 })])
    expect(screen.getByText('كريم مرطب')).toBeTruthy()
    expect(screen.getByText('2')).toBeTruthy() // quantity display
    expect(screen.getByText('مجاني 🎉')).toBeTruthy() // KW shipping always free
  })

  it('increments quantity and floors decrement at 1', () => {
    renderSidebar()
    openWith([item()])

    const dialog = screen.getByRole('dialog')
    const buttons = dialog.querySelectorAll('button')
    const minus = Array.from(buttons).find((b) => (b as HTMLButtonElement).disabled)!
    expect(minus).toBeTruthy() // minus disabled at quantity 1

    // The plus button is the sibling after the quantity span
    const plus = minus.parentElement!.querySelectorAll('button')[1]
    fireEvent.click(plus)
    expect(cart.items[0].quantity).toBe(2)

    // Now minus is enabled and decrements back to 1
    fireEvent.click(minus)
    expect(cart.items[0].quantity).toBe(1)
  })

  it('removes an item 300ms after the trash click', () => {
    vi.useFakeTimers()
    renderSidebar()
    openWith([item()])

    const dialog = screen.getByRole('dialog')
    // trash button is inside the price/remove column
    const trash = Array.from(dialog.querySelectorAll('button')).find((b) =>
      b.className.includes('hover:text-red-500')
    )!
    fireEvent.click(trash)
    expect(cart.items).toHaveLength(1) // not yet — animation grace period

    act(() => vi.advanceTimersByTime(300))
    expect(cart.items).toHaveLength(0)
  })

  it('shows the free-shipping progress for Gulf countries below the threshold', () => {
    renderSidebar()
    act(() => country.setCountry('SA'))
    openWith([item({ price: 10, quantity: 2 })]) // 20 KWD < 50 threshold

    expect(screen.getByText(/للحصول على شحن مجاني/)).toBeTruthy()
    expect(screen.queryByText('مجاني 🎉')).toBeNull() // shipping is charged
  })

  it('congratulates once the free-shipping threshold is reached', () => {
    renderSidebar()
    act(() => country.setCountry('SA'))
    openWith([item({ price: 25, quantity: 2 })]) // 50 KWD ≥ 50 threshold

    expect(screen.getByText('لقد حصلت على شحن مجاني')).toBeTruthy()
    expect(screen.getByText('مجاني 🎉')).toBeTruthy()
  })

  it('closes via the overlay', () => {
    renderSidebar()
    openWith([item()])
    const [overlay] = screen.getAllByLabelText('إغلاق السلة')
    fireEvent.click(overlay)
    expect(cart.isOpen).toBe(false)
  })
})
