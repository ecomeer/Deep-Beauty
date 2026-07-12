import { NextRequest, NextResponse } from 'next/server'
import { verifyPayment } from '@/lib/payment'
import { supabaseAdmin } from '@/lib/supabase-admin'

async function readWebhookPayload(req: NextRequest) {
  const contentType = req.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    return (await req.json()) as Record<string, unknown>
  }

  const form = await req.formData()
  return Object.fromEntries(form.entries())
}

function toStringValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

export async function POST(req: NextRequest) {
  try {
    const body = await readWebhookPayload(req)
    const trackId = toStringValue(body.track_id)
    const sessionId = toStringValue(body.session_id)
    const invoiceId = toStringValue(body.invoice_id)
    const requestedOrderId = toStringValue(body.requested_order_id)
    const redirectResult = toStringValue(body.result)

    let orderId = requestedOrderId
    let paid = redirectResult === 'CAPTURED'

    if (trackId || sessionId || invoiceId) {
      const result = await verifyPayment({ trackId, sessionId, invoiceId })
      paid = result.success
      orderId = result.orderId || orderId
    }

    if (!orderId) {
      return NextResponse.json({ ok: true, ignored: true })
    }

    const updates =
      paid
        ? { payment_status: 'paid', status: 'confirmed', payment_method: 'upayments' }
        : redirectResult
          ? { payment_status: 'unpaid', status: 'cancelled', payment_method: 'upayments' }
          : null

    if (updates) {
      const { error } = await supabaseAdmin
        .from('orders')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', orderId)

      if (error) {
        console.error('UPayments webhook order update error:', error)
        return NextResponse.json({ error: 'Order update failed' }, { status: 500 })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('UPayments webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 })
  }
}
