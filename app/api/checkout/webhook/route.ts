import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const chargeId = body?.id as string | undefined
    const tapStatus = body?.status as string | undefined

    if (!chargeId) {
      return NextResponse.json({ error: 'Missing charge id' }, { status: 400 })
    }

    if (!process.env.TAP_SECRET_KEY) {
      return NextResponse.json({ error: 'Tap secret missing' }, { status: 503 })
    }

    // FIXED: verify webhook payload by re-fetching charge state from Tap API.
    const verifyRes = await fetch(`https://api.tap.company/v2/charges/${chargeId}`, {
      headers: { Authorization: `Bearer ${process.env.TAP_SECRET_KEY}` },
    })
    if (!verifyRes.ok) {
      return NextResponse.json({ error: 'Unable to verify charge' }, { status: 502 })
    }
    const charge = await verifyRes.json()
    const status = charge?.status ?? tapStatus
    const orderRef = charge?.reference?.order ?? charge?.reference?.transaction

    if (!orderRef) {
      return NextResponse.json({ ok: true, ignored: true })
    }

    const updates =
      status === 'CAPTURED'
        ? { payment_status: 'paid', status: 'confirmed' }
        : status === 'FAILED' || status === 'CANCELLED'
          ? { payment_status: 'unpaid', status: 'cancelled' }
          : null

    if (updates) {
      await supabaseAdmin
        .from('orders')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('order_number', orderRef)
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 })
  }
}
