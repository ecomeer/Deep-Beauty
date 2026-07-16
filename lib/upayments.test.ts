import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import {
  isUPaymentsConfigured,
  createUPaymentsCharge,
  buildChargeBody,
  parsePaymentStatus,
  isTerminalUPaymentsFailure,
} from './upayments'

const ORIGINAL_ENV = { ...process.env }

beforeEach(() => {
  delete process.env.UPAYMENTS_TOKEN
})

afterAll(() => {
  process.env = { ...ORIGINAL_ENV }
})

const sampleRequest = {
  orderId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  orderNumber: 'DB-20260712-1234',
  amount: 25.5,
  customerName: 'سارة',
  customerPhone: '51234567',
  customerEmail: 'sara@example.com',
}

describe('isUPaymentsConfigured', () => {
  it('is false without a token and true with one', () => {
    expect(isUPaymentsConfigured()).toBe(false)
    process.env.UPAYMENTS_TOKEN = 'jtest123'
    expect(isUPaymentsConfigured()).toBe(true)
  })
})

describe('createUPaymentsCharge', () => {
  it('throws a clear error when the token is missing', async () => {
    await expect(createUPaymentsCharge(sampleRequest)).rejects.toThrow('UPayments token not configured')
  })
})

describe('buildChargeBody', () => {
  const body = buildChargeBody(sampleRequest, 'https://shop.example')

  it('puts the UUID in order.id and the short order number in reference.id (≤35 chars)', () => {
    expect(body.order.id).toBe(sampleRequest.orderId)
    expect(body.reference.id).toBe('DB-20260712-1234')
    expect(body.reference.id.length).toBeLessThanOrEqual(35)
  })

  it('includes the mandatory tokens object and Arabic language', () => {
    expect(body.tokens).toEqual({})
    expect(body.language).toBe('ar')
    expect(body.order.currency).toBe('KWD')
    expect(body.order.amount).toBe(25.5)
  })

  it('builds callback URLs carrying the order id', () => {
    expect(body.returnUrl).toBe(
      'https://shop.example/api/payment/upayments/callback?order=a1b2c3d4-e5f6-7890-abcd-ef1234567890'
    )
    expect(body.cancelUrl).toContain('&cancelled=1')
    expect(body.notificationUrl).toBe('https://shop.example/api/payment/upayments/webhook')
  })

  it('normalizes the customer phone to +965 format', () => {
    expect(body.customer.mobile).toBe('+96551234567')
    expect(body.customer.email).toBe('sara@example.com')
  })

  it('omits email when not provided', () => {
    const noEmail = buildChargeBody({ ...sampleRequest, customerEmail: undefined }, 'https://x')
    expect('email' in noEmail.customer).toBe(false)
  })
})

describe('parsePaymentStatus', () => {
  it('treats CAPTURED as success and extracts the order id/number/amount UPayments recorded for this track_id', () => {
    expect(
      parsePaymentStatus({
        status: true,
        data: {
          transaction: {
            result: 'CAPTURED',
            payment_id: '100412610000005799',
            merchant_requested_order_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            reference: 'DB-20260712-1234',
            total_price: '25.500',
          },
        },
      })
    ).toEqual({
      success: true,
      result: 'CAPTURED',
      paymentId: '100412610000005799',
      orderId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      orderNumber: 'DB-20260712-1234',
      amount: 25.5,
    })
  })

  it('treats anything else as failure', () => {
    expect(parsePaymentStatus({ data: { transaction: { result: 'NOT CAPTURED' } } }).success).toBe(false)
    expect(parsePaymentStatus({ data: {} }).success).toBe(false)
    expect(parsePaymentStatus(null).success).toBe(false)
  })

  it('returns null orderId/amount when the response omits them', () => {
    const parsed = parsePaymentStatus({ data: { transaction: { result: 'CAPTURED' } } })
    expect(parsed.orderId).toBeNull()
    expect(parsed.amount).toBeNull()
  })

  it('parses a numeric total_price as well as a string one', () => {
    expect(
      parsePaymentStatus({ data: { transaction: { result: 'CAPTURED', total_price: 25.5 } } }).amount
    ).toBe(25.5)
  })
})

describe('isTerminalUPaymentsFailure', () => {
  it('recognizes explicit terminal failures', () => {
    expect(isTerminalUPaymentsFailure('NOT CAPTURED')).toBe(true)
    expect(isTerminalUPaymentsFailure('declined')).toBe(true)
    expect(isTerminalUPaymentsFailure('CANCELLED')).toBe(true)
    expect(isTerminalUPaymentsFailure('expired')).toBe(true)
  })

  it('does not treat pending, processing, unknown, or missing results as terminal', () => {
    expect(isTerminalUPaymentsFailure('PENDING')).toBe(false)
    expect(isTerminalUPaymentsFailure('PROCESSING')).toBe(false)
    expect(isTerminalUPaymentsFailure('SOMETHING_NEW')).toBe(false)
    expect(isTerminalUPaymentsFailure(null)).toBe(false)
  })
})
