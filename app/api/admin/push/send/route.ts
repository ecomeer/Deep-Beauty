import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-admin'
import { sendAdminPushNotification } from '@/lib/push-notifications'

export async function POST(req: NextRequest) {
  const _authErr = await requireAdmin(req)
  if (_authErr) return _authErr
  try {
    const { title, body, url = '/admin/orders' } = await req.json()
    const result = await sendAdminPushNotification({ title, body, url })
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
