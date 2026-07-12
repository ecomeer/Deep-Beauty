import { describe, it, expect } from 'vitest'
import {
  ORDER_STATUSES,
  ACTIVE_ORDER_STATUSES,
  VALID_TRANSITIONS,
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_CUSTOMER_MESSAGES,
} from './order-status'

describe('order status machine', () => {
  it('transitions map covers exactly the known statuses', () => {
    expect(Object.keys(VALID_TRANSITIONS).sort()).toEqual([...ORDER_STATUSES].sort())
  })

  it('every transition target is a known status', () => {
    for (const targets of Object.values(VALID_TRANSITIONS)) {
      for (const t of targets) expect(ORDER_STATUSES).toContain(t)
    }
  })

  it('active statuses are a subset of all statuses', () => {
    for (const s of ACTIVE_ORDER_STATUSES) expect(ORDER_STATUSES).toContain(s)
    expect(ACTIVE_ORDER_STATUSES).not.toContain('delivered')
    expect(ACTIVE_ORDER_STATUSES).not.toContain('cancelled')
  })

  it('delivered and cancelled are terminal', () => {
    expect(VALID_TRANSITIONS.delivered).toEqual([])
    expect(VALID_TRANSITIONS.cancelled).toEqual([])
  })

  it('labels and colors cover every status', () => {
    for (const s of ORDER_STATUSES) {
      expect(STATUS_LABELS[s]).toBeTruthy()
      expect(STATUS_COLORS[s]).toBeTruthy()
    }
  })

  it('customer messages exist for every notifiable transition target', () => {
    for (const s of ['confirmed', 'shipped', 'delivered', 'cancelled']) {
      expect(STATUS_CUSTOMER_MESSAGES[s]).toBeTruthy()
    }
  })
})
