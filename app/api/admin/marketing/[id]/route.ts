import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-admin'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const _authErr = await requireAdmin(req)
  if (_authErr) return _authErr
  try {
    const body = await req.json()
    const { id } = await params

    const { data, error } = await supabaseAdmin
      .from('marketing_campaigns')
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
  const _authErr = await requireAdmin(req)
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

      // Get target audience
      let query = supabaseAdmin.from('users').select('email, full_name')
      if (campaign.target_audience !== 'all') {
        query = query.eq('role', campaign.target_audience)
      }
      const { data: users, error: usersError } = await query

      if (usersError) return NextResponse.json({ error: usersError.message }, { status: 500 })

      // Update sent count
      await supabaseAdmin
        .from('marketing_campaigns')
        .update({ 
          sent_count: users?.length || 0,
          sent_at: new Date().toISOString()
        })
        .eq('id', id)

      return NextResponse.json({ 
        message: `Campaign sent to ${users?.length || 0} users`,
        sent_count: users?.length || 0
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
