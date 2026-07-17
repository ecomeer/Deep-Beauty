import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { contactLimiter, getClientIp } from '@/lib/rate-limit'
import { sendEmail, contactNotificationEmail } from '@/lib/email'
import { CONTACT_INFO } from '@/lib/contact'

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    if (!contactLimiter(ip)) {
      return NextResponse.json({ error: 'طلبات كثيرة، يرجى الانتظار قليلاً' }, { status: 429 })
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 })
    }
    if (typeof body !== 'object' || body === null) {
      return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 })
    }
    const { name, email, message } = body as Record<string, unknown>
    if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string') {
      return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 })
    }

    if (!name.trim() || !email.trim() || !message.trim()) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 })
    }
    if (name.length > 200 || email.length > 200 || message.length > 5000) {
      return NextResponse.json({ error: 'البيانات المدخلة طويلة جداً' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('contact_messages')
      .insert({ name: name.trim(), email: email.trim(), message: message.trim() })

    if (error) {
      console.error('Contact message insert error:', error)
      return NextResponse.json({ error: 'حدث خطأ أثناء إرسال الرسالة' }, { status: 500 })
    }

    const { subject, html } = contactNotificationEmail({ name: name.trim(), email: email.trim(), message: message.trim() })
    const result = await sendEmail({ to: CONTACT_INFO.email, subject, html, replyTo: email.trim() })
    if (!result.sent) {
      // The message is safely stored either way — email delivery is best-effort.
      console.warn('[contact] notification email not sent:', result.error)
    }

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (err) {
    console.error('Contact route exception:', err)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
