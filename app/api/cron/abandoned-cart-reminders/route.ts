import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendEmail, abandonedCartEmail } from '@/lib/email'

interface CartItem {
  id: string
  name_ar: string
  price: number
  quantity: number
}

// Vercel Cron (see vercel.json) hits this once daily — the Hobby plan
// doesn't allow finer-grained cron schedules. Emails carts that are
// between 1 and 24 hours old, still unrecovered, have an email on file,
// and haven't already been reminded — a customer editing the checkout
// form for hours shouldn't get a reminder mid-purchase, and a cart older
// than a day is unlikely to convert from a nudge.
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

  return NextResponse.json({ checked: carts?.length ?? 0, sent })
}
