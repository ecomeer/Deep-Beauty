import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-admin'
import { sendEmail, newsletterEmail } from '@/lib/email'
import { escapeHtml } from '@/lib/utils'

const TYPE_LABELS_AR: Record<string, string> = {
  sms: 'الرسائل النصية',
  push: 'الإشعارات',
  social: 'وسائل التواصل',
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const _authErr = await requireAdmin(req, 'marketing')
  if (_authErr) return _authErr
  const { id } = await params
  const { data, error } = await supabaseAdmin
    .from('marketing_campaigns')
    .select('id, title, description, type, target_audience, content, scheduled_at, is_active, sent_count, sent_at, created_at')
    .eq('id', id)
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const _authErr = await requireAdmin(req, 'marketing')
  if (_authErr) return _authErr
  try {
    const body = await req.json()
    const { id } = await params

    // Whitelist updatable columns — never forward arbitrary client keys to the
    // row (mass-assignment). Mirrors the create route's field set; excludes
    // server-managed fields like sent_count/sent_at/created_at.
    const allowed: Record<string, unknown> = {}
    for (const key of ['title', 'description', 'type', 'target_audience', 'content', 'scheduled_at', 'is_active'] as const) {
      if (key in body) allowed[key] = body[key]
    }

    if (Object.keys(allowed).length === 0) {
      return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('marketing_campaigns')
      .update(allowed)
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
  const _authErr = await requireAdmin(req, 'marketing')
  if (_authErr) return _authErr
  try {
    const { id } = await params

    const { error } = await supabaseAdmin
      .from('marketing_campaigns')
      .delete()
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const _authErr = await requireAdmin(req, 'marketing')
  if (_authErr) return _authErr
  try {
    const { id } = await params
    const { action } = await req.json()

    if (action === 'send') {
      // Get campaign details
      const { data: campaign, error: campaignError } = await supabaseAdmin
        .from('marketing_campaigns')
        .select('*')
        .eq('id', id)
        .single()

      if (campaignError) return NextResponse.json({ error: campaignError.message }, { status: 500 })

      if (campaign.sent_at) {
        return NextResponse.json({ error: 'تم إرسال هذه الحملة بالفعل' }, { status: 409 })
      }

      if (campaign.type !== 'email') {
        return NextResponse.json(
          { error: `إرسال حملات ${TYPE_LABELS_AR[campaign.type] || campaign.type} غير مدعوم بعد — البريد الإلكتروني فقط مفعّل حالياً` },
          { status: 400 }
        )
      }

      const content = campaign.content as { subject?: string; body?: string } | null
      if (!content?.subject?.trim() || !content?.body?.trim()) {
        return NextResponse.json({ error: 'الحملة تفتقد لعنوان أو محتوى البريد' }, { status: 400 })
      }

      // Target audience: 'all'/'customers' = every customer; 'vip' = customers
      // with loyalty points; 'new' = customers who signed up in the last 30 days.
      let query = supabaseAdmin.from('users').select('email, name').eq('role', 'customer').not('email', 'is', null)
      if (campaign.target_audience === 'vip') {
        query = query.gt('loyalty_points', 0)
      } else if (campaign.target_audience === 'new') {
        const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        query = query.gte('created_at', cutoff)
      }

      const { data: recipients, error: recipientsError } = await query
      if (recipientsError) return NextResponse.json({ error: recipientsError.message }, { status: 500 })

      const list = recipients || []
      if (list.length === 0) {
        return NextResponse.json({ error: 'لا يوجد مستلمون يطابقون الجمهور المستهدف' }, { status: 400 })
      }

      // Send in batches of 50, sequentially between batches, to respect rate
      // limits. {name} is substituted per recipient (the only placeholder the
      // campaign form advertises that applies to a broadcast — there's no
      // single order to fill {order_number} with).
      let sent = 0
      let failed = 0
      const BATCH_SIZE = 50
      for (let i = 0; i < list.length; i += BATCH_SIZE) {
        const batch = list.slice(i, i + BATCH_SIZE)
        const results = await Promise.all(
          batch.map((r) => {
            const personalizedBody = content.body!.replaceAll('{name}', escapeHtml((r.name as string) || ''))
            const { subject, html } = newsletterEmail(content.subject!, personalizedBody)
            return sendEmail({ to: r.email as string, subject, html })
          })
        )
        sent += results.filter((r) => r.sent).length
        failed += results.filter((r) => !r.sent).length
      }

      if (sent === 0) {
        return NextResponse.json(
          { error: 'لم يُرسل أي بريد — تأكد من ضبط RESEND_API_KEY', sent_count: 0 },
          { status: 502 }
        )
      }

      // Only mark as sent once at least one email actually went out, so a
      // fully-failed attempt can still be retried instead of being hidden
      // behind sent_at.
      await supabaseAdmin
        .from('marketing_campaigns')
        .update({
          sent_count: sent,
          sent_at: new Date().toISOString(),
        })
        .eq('id', id)

      return NextResponse.json({
        message: `تم إرسال الحملة إلى ${sent} مستلم${failed ? ` (فشل ${failed})` : ''}`,
        sent_count: sent,
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
