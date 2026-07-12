import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const { user, error: authError } = await requireUser()
  if (authError) return authError

  const { data, error } = await supabaseAdmin
    .from('user_addresses')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ addresses: data || [] })
}

export async function POST(req: NextRequest) {
  const { user, error: authError } = await requireUser()
  if (authError) return authError

  const body = await req.json()
  const { label, area, block, street, house, notes, is_default } = body

  if (!area) return NextResponse.json({ error: 'المنطقة مطلوبة' }, { status: 400 })

  if (is_default) {
    await supabaseAdmin
      .from('user_addresses')
      .update({ is_default: false })
      .eq('user_id', user.id)
  }

  const { data, error } = await supabaseAdmin
    .from('user_addresses')
    .insert({
      user_id: user.id,
      label: label || 'المنزل',
      area,
      block: block || '',
      street: street || '',
      house: house || '',
      notes: notes || null,
      is_default: is_default ?? false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ address: data }, { status: 201 })
}
