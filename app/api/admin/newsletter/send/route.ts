import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-admin'
import { sendEmail, newsletterEmail } from '@/lib/email'
import { escapeHtml } from '@/lib/utils'

// Broadcast a newsletter to all active subscribers. Batches like the campaign
// send in /api/admin/marketing/[id] and personalizes the {name} placeholder.
export async function POST(req: NextRequest) {
  const _authErr = await requireAdmin(req, 'customers')
  if (_authErr) return _authErr
  try {
    const { subject, body } = await req.json()
    if (!subject?.trim() || !body?.trim()) {
      return NextResponse.json({ error: 'العنوان والمحتوى مطلوبان' }, { status: 400 })
    }

    const { data: subscribers, error } = await supabaseAdmin
      .from('newsletter_subscribers')
      .select('email, name')
      .eq('is_active', true)
      .not('email', 'is', null)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const list = subscribers || []
    if (list.length === 0) {
      return NextResponse.json({ error: 'لا يوجد مشتركون نشطون' }, { status: 400 })
    }

    let sent = 0
    let failed = 0
    const BATCH_SIZE = 50
    for (let i = 0; i < list.length; i += BATCH_SIZE) {
      const batch = list.slice(i, i + BATCH_SIZE)
      const results = await Promise.all(
        batch.map((s) => {
          const personalized = body.replaceAll('{name}', escapeHtml((s.name as string) || ''))
          const { subject: subj, html } = newsletterEmail(subject, personalized)
          return sendEmail({ to: s.email as string, subject: subj, html })
        })
      )
      sent += results.filter((r) => r.sent).length
      failed += results.filter((r) => !r.sent).length
    }

    if (sent === 0) {
      return NextResponse.json(
        { error: 'لم يُرسل أي بريد — تأكد من ضبط RESEND_API_KEY', sent },
        { status: 502 }
      )
    }

    return NextResponse.json({
      message: `تم إرسال النشرة إلى ${sent} مشترك${failed ? ` (فشل ${failed})` : ''}`,
      sent,
      failed,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
