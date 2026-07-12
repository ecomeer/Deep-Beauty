// UPayments UInterfaceV2 integration.
// Docs: https://developers.upayments.com/reference/addcharge

export interface PaymentProduct {
  name: string
  description?: string
  price: number
  quantity: number
}

export interface PaymentInitiateRequest {
  orderId: string
  orderNumber: string
  amount: number
  customerName: string
  customerPhone: string
  customerEmail?: string | null
  products?: PaymentProduct[]
}

export interface PaymentInitiateResponse {
  paymentUrl: string
  paymentId: string
}

export interface PaymentStatusResult {
  success: boolean
  orderId?: string
  orderNumber?: string
  amount?: number
  paymentMethod?: string
  trackId?: string
  rawStatus?: string
}

type UPaymentsTransaction = {
  result?: string
  status?: string
  order_id?: string
  requested_order_id?: string
  merchant_requested_order_id?: string
  reference?: string
  total_price?: string
  total_paid_non_kwd?: string
  payment_type?: string
  track_id?: string
}

const UPAYMENTS_API_URL = (process.env.UPAYMENTS_API_URL || 'https://sandboxapi.upayments.com/api/v1').replace(/\/$/, '')
const UPAYMENTS_API_TOKEN = process.env.UPAYMENTS_API_TOKEN
const UPAYMENTS_PAYMENT_GATEWAY_SRC = process.env.UPAYMENTS_PAYMENT_GATEWAY_SRC?.trim()

function requireConfig() {
  if (!UPAYMENTS_API_TOKEN) {
    throw new Error('UPayments token not configured')
  }
}

function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
}

function normalizeKuwaitMobile(value: string) {
  const digits = value.replace(/\D/g, '')
  if (digits.startsWith('965')) return `+${digits}`
  return `+965${digits}`
}

function toKwdAmount(value: number) {
  return Number(value.toFixed(3))
}

function toOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function toOptionalNumber(value: unknown): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined
  if (typeof value !== 'string') return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function isCaptured(transaction: UPaymentsTransaction) {
  return transaction.result === 'CAPTURED' || transaction.status === 'done'
}

function extractLocalOrderId(transaction: UPaymentsTransaction) {
  return (
    toOptionalString(transaction.merchant_requested_order_id) ||
    toOptionalString(transaction.requested_order_id) ||
    toOptionalString(transaction.order_id)
  )
}

export async function initiatePayment(
  data: PaymentInitiateRequest
): Promise<PaymentInitiateResponse> {
  requireConfig()

  const siteUrl = getSiteUrl()
  const body: Record<string, unknown> = {
    products: data.products,
    order: {
      id: data.orderId,
      reference: data.orderNumber,
      description: `Deep Beauty order ${data.orderNumber}`,
      currency: 'KWD',
      amount: toKwdAmount(data.amount),
    },
    language: 'ar',
    reference: {
      id: data.orderNumber,
    },
    customer: {
      uniqueId: data.customerEmail || data.customerPhone,
      name: data.customerName,
      email: data.customerEmail || undefined,
      mobile: normalizeKuwaitMobile(data.customerPhone),
    },
    returnUrl: `${siteUrl}/api/payment/callback`,
    cancelUrl: `${siteUrl}/api/payment/error`,
    notificationUrl: `${siteUrl}/api/payment/webhook`,
    customerExtraData: data.orderId,
    paymentLinkExpiryInMinutes: 30,
  }

  if (UPAYMENTS_PAYMENT_GATEWAY_SRC) {
    body.paymentGateway = { src: UPAYMENTS_PAYMENT_GATEWAY_SRC }
  }

  const response = await fetch(`${UPAYMENTS_API_URL}/charge`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${UPAYMENTS_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const result = await response.json().catch(() => null)

  if (!response.ok || !result?.status) {
    const message = toOptionalString(result?.message) || `UPayments charge failed: ${response.status}`
    throw new Error(message)
  }

  const paymentUrl = toOptionalString(result?.data?.link)
  if (!paymentUrl) {
    throw new Error('UPayments did not return a payment link')
  }

  const url = new URL(paymentUrl)
  const sessionId = url.searchParams.get('session_id') || data.orderId

  return {
    paymentUrl,
    paymentId: sessionId,
  }
}

export async function verifyPayment(params: {
  trackId?: string | null
  sessionId?: string | null
  invoiceId?: string | null
}): Promise<PaymentStatusResult> {
  requireConfig()

  const trackId = params.trackId?.trim()
  const sessionId = params.sessionId?.trim()
  const invoiceId = params.invoiceId?.trim()

  let url: string
  if (trackId) {
    url = `${UPAYMENTS_API_URL}/get-payment-status/${encodeURIComponent(trackId)}`
  } else if (sessionId) {
    url = `${UPAYMENTS_API_URL}/get-payment-status?session_id=${encodeURIComponent(sessionId)}`
  } else if (invoiceId) {
    url = `${UPAYMENTS_API_URL}/get-payment-status?invoice_id=${encodeURIComponent(invoiceId)}`
  } else {
    throw new Error('Missing UPayments status identifier')
  }

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${UPAYMENTS_API_TOKEN}`,
    },
  })

  const result = await response.json().catch(() => null)
  if (!response.ok || !result?.status) {
    return { success: false }
  }

  const transaction = result?.data?.transaction as UPaymentsTransaction | undefined
  if (!transaction) return { success: false }

  return {
    success: isCaptured(transaction),
    orderId: extractLocalOrderId(transaction),
    orderNumber: toOptionalString(transaction.reference),
    amount: toOptionalNumber(transaction.total_price) ?? toOptionalNumber(transaction.total_paid_non_kwd),
    paymentMethod: toOptionalString(transaction.payment_type),
    trackId: toOptionalString(transaction.track_id) || trackId,
    rawStatus: toOptionalString(transaction.result) || toOptionalString(transaction.status),
  }
}
