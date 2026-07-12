import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const { user, error: authError } = await requireUser()
  if (authError) return authError

  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ notifications: data || [] })
}

// PATCH /api/account/notifications — mark all as read
export async function PATCH(req: NextRequest) {
  const { user, error: authError } = await requireUser()
  if (authError) return authError

  const body = await req.json().catch(() => ({}))
  const ids: string[] | undefined = body.ids

  let query = supabaseAdmin
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)

  if (ids?.length) query = query.in('id', ids)

  const { error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
