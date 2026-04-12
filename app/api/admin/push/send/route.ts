import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const { title, body, url = '/admin/orders' } = await req.json()

    const webpush = await import('web-push')
    webpush.default.setVapidDetails(
      process.env.VAPID_SUBJECT!,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    )

    const { data: subs } = await supabaseAdmin
      .from('push_subscriptions')
      .select('subscription')

    if (!subs || subs.length === 0) {
      return NextResponse.json({ sent: 0 })
    }

    const payload = JSON.stringify({ title, body, icon: '/icon-192.png', badge: '/icon-192.png', url })

    const results = await Promise.allSettled(
      subs.map((row: { subscription: string }) =>
        webpush.default.sendNotification(JSON.parse(row.subscription), payload)
      )
    )

    const sent = results.filter((r) => r.status === 'fulfilled').length
    return NextResponse.json({ sent, total: subs.length })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
