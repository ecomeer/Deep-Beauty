import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-admin'
import { sendEmail, newsletterEmail } from '@/lib/email'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const _authErr = await requireAdmin(req)
  if (_authErr) return _authErr
  try {
    const body = await req.json()
    const { id } = await params

    const { data, error } = await supabaseAdmin
      .from('newsletter_subscribers')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const _authErr = await requireAdmin(req)
  if (_authErr) return _authErr
  try {
    const { id } = await params

    const { error } = await supabaseAdmin
      .from('newsletter_subscribers')
      .delete()
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const _authErr = await requireAdmin(req)
  if (_authErr) return _authErr
  try {
    await params
    // Parse the body once — action and campaign fields arrive together
    const { action, subject, content } = await req.json()

    if (action === 'send_campaign') {
      if (!subject || !content) {
        return NextResponse.json({ error: 'Subject and content are required' }, { status: 400 })
      }

      // Get all active subscribers
      const { data: subscribers, error: subsError } = await supabaseAdmin
        .from('newsletter_subscribers')
        .select('email, name')
        .eq('is_active', true)

      if (subsError) return NextResponse.json({ error: subsError.message }, { status: 500 })

      const list = subscribers || []
      const { subject: emailSubject, html } = newsletterEmail(subject, content)

      // Send in batches of 50, sequentially between batches, to respect rate limits
      let sent = 0
      let failed = 0
      const BATCH_SIZE = 50
      for (let i = 0; i < list.length; i += BATCH_SIZE) {
        const batch = list.slice(i, i + BATCH_SIZE)
        const results = await Promise.all(
          batch.map((sub) => sendEmail({ to: sub.email, subject: emailSubject, html }))
        )
        sent += results.filter((r) => r.sent).length
        failed += results.filter((r) => !r.sent).length
      }

      if (list.length > 0 && sent === 0) {
        return NextResponse.json(
          { error: 'لم يُرسل أي بريد — تأكد من ضبط RESEND_API_KEY', subscriber_count: list.length },
          { status: 502 }
        )
      }

      return NextResponse.json({
        message: `تم إرسال الحملة إلى ${sent} مشترك${failed ? ` (فشل ${failed})` : ''}`,
        subscriber_count: list.length,
        sent,
        failed,
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
