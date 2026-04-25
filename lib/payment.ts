// MyFatoorah Payment Integration
export interface PaymentInitiateRequest {
  orderId: string
  orderNumber: string
  amount: number
  customerName: string
  customerPhone: string
  customerEmail?: string
}

export interface PaymentInitiateResponse {
  paymentUrl: string
  paymentId: string
}

const MYFATOORAH_API_URL = process.env.MYFATOORAH_API_URL || 'https://api.myfatoorah.com/v2'
const MYFATOORAH_TOKEN = process.env.MYFATOORAH_TOKEN

function toNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function extractOrderId(invoice: Record<string, unknown>): string | undefined {
  const direct =
    toNonEmptyString(invoice.CustomerReference) ??
    toNonEmptyString(invoice.customerReference) ??
    toNonEmptyString(invoice.CustomerReferenceNo)

  if (direct) return direct

  const userDefined =
    toNonEmptyString(invoice.UserDefinedField) ??
    toNonEmptyString(invoice.userDefinedField)

  if (!userDefined) return undefined

  if (userDefined.startsWith('orderId:')) {
    return toNonEmptyString(userDefined.slice('orderId:'.length))
  }

  return userDefined
}

export async function initiatePayment(
  data: PaymentInitiateRequest
): Promise<PaymentInitiateResponse> {
  if (!MYFATOORAH_TOKEN) {
    throw new Error('MyFatoorah token not configured')
  }

  const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/payment/callback`
  const errorUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/payment/error`

  const response = await fetch(`${MYFATOORAH_API_URL}/InitiatePayment`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MYFATOORAH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      InvoiceValue: data.amount,
      CustomerName: data.customerName,
      CustomerMobile: data.customerPhone,
      CustomerEmail: data.customerEmail || '',
      CustomerReference: data.orderId,
      UserDefinedField: `orderId:${data.orderId}`,
      CallBackUrl: callbackUrl,
      ErrorUrl: errorUrl,
      Language: 'AR',
      DisplayCurrencyIso: 'KWD',
    }),
  })

  if (!response.ok) {
    throw new Error(`Payment initiation failed: ${response.status}`)
  }

  const result = await response.json()

  if (!result.IsSuccess) {
    throw new Error(result.Message || 'Payment initiation failed')
  }

  return {
    paymentUrl: result.Data.PaymentURL,
    paymentId: result.Data.PaymentId,
  }
}

export async function verifyPayment(paymentId: string): Promise<{
  success: boolean
  orderId?: string
  amount?: number
  paymentMethod?: string
}> {
  if (!MYFATOORAH_TOKEN) {
    throw new Error('MyFatoorah token not configured')
  }

  const response = await fetch(`${MYFATOORAH_API_URL}/GetPaymentStatus`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MYFATOORAH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      Key: paymentId,
      KeyType: 'PaymentId',
    }),
  })

  if (!response.ok) {
    throw new Error(`Payment verification failed: ${response.status}`)
  }

  const result = await response.json()

  if (!result.IsSuccess) {
    return { success: false }
  }

  const invoice = result.Data as Record<string, unknown>
  const success = invoice.InvoiceStatus === 'Paid'
  const orderId = extractOrderId(invoice)

  return {
    success,
    orderId,
    amount: typeof invoice.InvoiceValue === 'number' ? invoice.InvoiceValue : undefined,
    paymentMethod: toNonEmptyString(invoice.PaymentMethod),
  }
}
