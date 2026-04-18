import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-admin'

export async function POST(req: NextRequest) {
  const _authErr = await requireAdmin(req)
  if (_authErr) return _authErr
  try {
    const subscription = await req.json()
    if (!subscription?.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('push_subscriptions')
      .upsert(
        { endpoint: subscription.endpoint, subscription: JSON.stringify(subscription) },
        { onConflict: 'endpoint' }
      )

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
