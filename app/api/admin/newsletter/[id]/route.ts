import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const { id } = params

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

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

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

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const { action } = await req.json()

    if (action === 'send_campaign') {
      const { subject, content } = await req.json()
      
      if (!subject || !content) {
        return NextResponse.json({ error: 'Subject and content are required' }, { status: 400 })
      }

      // Get all active subscribers
      const { data: subscribers, error: subsError } = await supabaseAdmin
        .from('newsletter_subscribers')
        .select('email, name')
        .eq('is_active', true)

      if (subsError) return NextResponse.json({ error: subsError.message }, { status: 500 })

      // Here you would integrate with an email service like SendGrid, Mailgun, etc.
      // For now, we'll just return the count
      return NextResponse.json({ 
        message: `Newsletter campaign prepared for ${subscribers?.length || 0} subscribers`,
        subscriber_count: subscribers?.length || 0
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
