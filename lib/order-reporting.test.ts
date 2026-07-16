import { describe, expect, it } from 'vitest'
import {
  filterRecognizedRevenueOrders,
  isRecognizedRevenueOrder,
  sumRecognizedRevenue,
} from './order-reporting'

describe('recognized revenue rules', () => {
  it('counts paid online orders that are not cancelled or refunded', () => {
    expect(
      isRecognizedRevenueOrder({
        total: 12,
        status: 'confirmed',
        payment_status: 'paid',
        payment_method: 'online',
      })
    ).toBe(true)
  })

  it('counts delivered cash-on-delivery orders even when payment status is unpaid', () => {
    expect(
      isRecognizedRevenueOrder({
        total: 8,
        status: 'delivered',
        payment_status: 'unpaid',
        payment_method: 'cod',
      })
    ).toBe(true)
  })

  it('does not count pending COD orders, cancelled paid orders, or refunded orders', () => {
    expect(
      isRecognizedRevenueOrder({
        total: 8,
        status: 'pending',
        payment_status: 'unpaid',
        payment_method: 'cod',
      })
    ).toBe(false)

    expect(
      isRecognizedRevenueOrder({
        total: 8,
        status: 'cancelled',
        payment_status: 'paid',
        payment_method: 'online',
      })
    ).toBe(false)

    expect(
      isRecognizedRevenueOrder({
        total: 8,
        status: 'delivered',
        payment_status: 'refunded',
        payment_method: 'online',
      })
    ).toBe(false)
  })

  it('filters and sums using the same business rule', () => {
    const orders = [
      { total: 10, status: 'confirmed', payment_status: 'paid', payment_method: 'online' },
      { total: '7.500', status: 'delivered', payment_status: 'unpaid', payment_method: 'cod' },
      { total: 20, status: 'pending', payment_status: 'unpaid', payment_method: 'cod' },
    ]

    expect(filterRecognizedRevenueOrders(orders)).toHaveLength(2)
    expect(sumRecognizedRevenue(orders)).toBe(17.5)
  })
})
