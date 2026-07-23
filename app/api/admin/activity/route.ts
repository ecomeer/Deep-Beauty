import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-admin'

const PAGE_SIZE = 50

// Read-only admin audit trail. Full-admin only (pass 'staff' so scoped staff
// accounts can't read the activity of others).
export async function GET(req: NextRequest) {
  const _authErr = await requireAdmin(req, 'staff')
  if (_authErr) return _authErr

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data, error, count } = await supabaseAdmin
    .from('admin_activity_log')
    .select('id, actor_email, action, entity, entity_id, meta, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({
    activity: data || [],
    total: count ?? 0,
    page,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)),
  })
}
