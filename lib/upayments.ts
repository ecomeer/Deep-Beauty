import { toWhatsAppPhone } from '@/lib/utils'

// UPayments UInterfaceV2 integration (non-whitelabel hosted checkout).
// Docs: https://developers.upayments.com/reference/addcharge.md
// When UPAYMENTS_TOKEN is set this gateway takes precedence over
// MyFatoorah in /api/payment/initiate.

const UPAYMENTS_API_URL =
  process.env.UPAYMENTS_API_URL || 'https://sandboxapi.upayments.com/api/v1'

export function isUPaymentsConfigured(): boolean {
  return Boolean(process.env.UPAYMENTS_TOKEN)
}

export interface UPaymentsChargeRequest {
  orderId: string
  orderNumber: string
  amount: number
  customerName: string
  customerPhone: string
  customerEmail?: string
}

// Exported for tests: builds the create-charge request body.
// Constraints from the API: order.id ≤ 40 chars (fits the order UUID),
// reference.id ≤ 35 chars (UUIDs are 36 — use the order number instead).
export function buildChargeBody(data: UPaymentsChargeRequest, siteUrl: string) {
  return {
    order: {
      id: data.orderId,
      reference: data.orderNumber,
      description: `طلب ${data.orderNumber} — Deep Beauty`,
      currency: 'KWD',
      amount: data.amount,
    },
    reference: { id: data.orderNumber },
    language: 'ar',
    tokens: {},
    customer: {
      name: data.customerName,
      mobile: `+${toWhatsAppPhone(data.customerPhone)}`,
      ...(data.customerEmail ? { email: data.customerEmail } : {}),
    },
    returnUrl: `${siteUrl}/api/payment/upayments/callback?order=${data.orderId}`,
    cancelUrl: `${siteUrl}/api/payment/upayments/callback?order=${data.orderId}&cancelled=1`,
    notificationUrl: `${siteUrl}/api/payment/upayments/webhook`,
  }
}

export async function createUPaymentsCharge(
  data: UPaymentsChargeRequest
): Promise<{ paymentUrl: string }> {
  const token = process.env.UPAYMENTS_TOKEN
  if (!token) {
    throw new Error('UPayments token not configured')
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const res = await fetch(`${UPAYMENTS_API_URL}/charge`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(buildChargeBody(data, siteUrl)),
    signal: AbortSignal.timeout(15000),
  })

  const json = await res.json().catch(() => null)

  if (!res.ok || !json?.status || !json?.data?.link) {
    console.error('UPayments charge failed:', res.status, json)
    throw new Error(json?.message || `UPayments charge failed (${res.status})`)
  }

  return { paymentUrl: json.data.link }
}

export interface UPaymentsStatus {
  success: boolean
  result: string | null
  paymentId: string | null
  // The order id (order.id we sent) and order number (reference we sent)
  // and paid amount, as recorded by UPayments against this specific
  // track_id. Callers MUST use these — not any client-supplied query
  // param or webhook body field — to decide which order to mark paid,
  // otherwise a track_id for one payment can be replayed against an
  // unrelated order (see callback/webhook routes).
  orderId: string | null
  orderNumber: string | null
  amount: number | null
}

// Exported for tests: interprets a get-payment-status response.
export function parsePaymentStatus(json: unknown): UPaymentsStatus {
  const transaction = (
    json as {
      data?: {
        transaction?: {
          result?: string
          payment_id?: string
          merchant_requested_order_id?: string
          reference?: string
          total_price?: string | number
        }
      }
    }
  )?.data?.transaction
  const result = transaction?.result ?? null
  const rawAmount = transaction?.total_price
  const amount =
    rawAmount != null && rawAmount !== '' ? Number(rawAmount) : null
  return {
    success: result === 'CAPTURED',
    result,
    paymentId: transaction?.payment_id ?? null,
    orderId: transaction?.merchant_requested_order_id ?? null,
    orderNumber: transaction?.reference ?? null,
    amount: amount != null && Number.isFinite(amount) ? amount : null,
  }
}

// UPayments webhooks carry no signature, so callers MUST verify a
// payment through this status API before trusting it.
export async function getUPaymentsStatus(trackId: string): Promise<UPaymentsStatus> {
  const token = process.env.UPAYMENTS_TOKEN
  if (!token) {
    throw new Error('UPayments token not configured')
  }

  const res = await fetch(
    `${UPAYMENTS_API_URL}/get-payment-status/${encodeURIComponent(trackId)}`,
    {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(15000),
    }
  )

  const json = await res.json().catch(() => null)
  if (!res.ok || !json) {
    console.error('UPayments status check failed:', res.status, json)
    return { success: false, result: null, paymentId: null, orderId: null, orderNumber: null, amount: null }
  }

  return parsePaymentStatus(json)
}
