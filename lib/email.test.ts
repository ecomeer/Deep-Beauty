import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { sendEmail, orderConfirmationEmail, orderStatusEmail } from './email'

const ORIGINAL_ENV = { ...process.env }

beforeEach(() => {
  delete process.env.RESEND_API_KEY
  delete process.env.EMAIL_FROM
})

afterEach(() => {
  vi.unstubAllGlobals()
})

afterAll(() => {
  process.env = { ...ORIGINAL_ENV }
})

describe('sendEmail', () => {
  it('is a no-op without RESEND_API_KEY', async () => {
    const result = await sendEmail({ to: 'a@b.com', subject: 's', html: '<p>x</p>' })
    expect(result).toEqual({ sent: false, error: 'not_configured' })
  })

  it('does not call Resend without an explicit EMAIL_FROM sender', async () => {
    process.env.RESEND_API_KEY = 're_test'
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const result = await sendEmail({ to: 'a@b.com', subject: 's', html: '<p>x</p>' })

    expect(result).toEqual({ sent: false, error: 'from_not_configured' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns the provider status code when Resend rejects the sender', async () => {
    process.env.RESEND_API_KEY = 're_test'
    process.env.EMAIL_FROM = 'Deep Beauty <orders@example.com>'
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('{"message":"forbidden"}', { status: 403 })
      )
    )

    const result = await sendEmail({ to: 'a@b.com', subject: 's', html: '<p>x</p>' })

    expect(result).toEqual({ sent: false, error: 'resend_403' })
  })
})

describe('orderConfirmationEmail', () => {
  it('includes order number, customer name, items, and total', () => {
    const { subject, html } = orderConfirmationEmail(
      { order_number: 'DB-20260712-1234', customer_name: 'سارة', total: 25.5, subtotal: 24, shipping_cost: 1.5 },
      [{ product_name_ar: 'كريم مرطب', quantity: 2, total_price: 24 }]
    )
    expect(subject).toContain('DB-20260712-1234')
    expect(html).toContain('سارة')
    expect(html).toContain('كريم مرطب')
    expect(html).toContain('د.ك')
    expect(html).toContain('dir="rtl"')
  })
})

describe('orderStatusEmail', () => {
  it('uses the central Arabic status label', () => {
    const { subject, html } = orderStatusEmail({
      order_number: 'DB-20260712-1234',
      total: 10,
      status: 'shipped',
    })
    expect(subject).toContain('تم الشحن')
    expect(html).toContain('تم الشحن')
    expect(html).toContain('DB-20260712-1234')
  })

  it('falls back to the raw status when unknown', () => {
    const { html } = orderStatusEmail({ order_number: 'X', total: 1, status: 'weird_status' })
    expect(html).toContain('weird_status')
  })
})
