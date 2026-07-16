import { describe, expect, it } from 'vitest'
import { buildPaidOrderPatch } from './payment-order'

const NOW = '2026-07-16T10:00:00.000Z'

describe('buildPaidOrderPatch', () => {
  it('confirms a pending order and records payment timestamps', () => {
    expect(
      buildPaidOrderPatch(
        { status: 'pending', payment_status: 'unpaid', paid_at: null, confirmed_at: null },
        NOW
      )
    ).toEqual({
      payment_status: 'paid',
      status: 'confirmed',
      paid_at: NOW,
      confirmed_at: NOW,
      updated_at: NOW,
    })
  })

  it('preserves a shipped order lifecycle state when a delayed webhook arrives', () => {
    expect(
      buildPaidOrderPatch(
        { status: 'shipped', payment_status: 'unpaid', paid_at: null, confirmed_at: null },
        NOW
      )
    ).toEqual({
      payment_status: 'paid',
      status: 'shipped',
      paid_at: NOW,
      updated_at: NOW,
    })
  })

  it('preserves an existing paid_at timestamp', () => {
    expect(
      buildPaidOrderPatch(
        {
          status: 'confirmed',
          payment_status: 'unpaid',
          paid_at: '2026-07-16T09:00:00.000Z',
        },
        NOW
      )?.paid_at
    ).toBe('2026-07-16T09:00:00.000Z')
  })

  it('never revives a cancelled order', () => {
    expect(
      buildPaidOrderPatch({ status: 'cancelled', payment_status: 'unpaid' }, NOW)
    ).toBeNull()
  })
})
