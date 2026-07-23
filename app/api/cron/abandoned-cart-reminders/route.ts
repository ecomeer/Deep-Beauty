import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendEmail, abandonedCartEmail } from '@/lib/email'

interface CartItem {
  id: string
  name_ar: string
  price: number
  quantity: number
}

// Vercel Cron (see vercel.json) performs two bounded maintenance jobs:
// release expired unpaid online-payment reservations, then email eligible
// abandoned carts. Both operations are idempotent.
export async function GET(req: NextRequest) {
  // Fail closed: a missing CRON_SECRET must NOT leave this endpoint open. An
  // unauthenticated caller could otherwise trigger up to 100 emails per hit.
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error('CRON_SECRET is not configured; refusing to run cron job')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }
  if (req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: expiredData, error: expiryError } = await supabaseAdmin.rpc(
    'expire_pending_online_orders',
    { p_now: new Date().toISOString() }
  )
  if (expiryError) {
    console.error('Failed to expire pending online orders:', expiryError)
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: carts, error } = await supabaseAdmin
    .from('abandoned_carts')
    .select('id, customer_name, customer_email, items')
    .eq('recovered', false)
    .is('reminded_at', null)
    .not('customer_email', 'is', null)
    .lte('created_at', oneHourAgo)
    .gte('created_at', oneDayAgo)
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.deepbeautykw.com'
  let sent = 0

  for (const cart of carts ?? []) {
    const items = (cart.items ?? []) as CartItem[]
    if (!cart.customer_email || items.length === 0) continue

    const { subject, html } = abandonedCartEmail(cart.customer_name, items, `${siteUrl}/checkout`)
    const result = await sendEmail({ to: cart.customer_email, subject, html })

    if (result.sent) {
      sent++
      await supabaseAdmin
        .from('abandoned_carts')
        .update({ reminded_at: new Date().toISOString() })
        .eq('id', cart.id)
    }
  }

  return NextResponse.json({
    expiredPayments: Number(expiredData) || 0,
    expiryWarning: Boolean(expiryError),
    checked: carts?.length ?? 0,
    sent,
  })
}
