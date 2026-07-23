import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-admin'
import { revalidateStorefront } from '@/lib/revalidate-storefront'

// Single-request bulk mutation for the products list, replacing the previous
// N-requests-per-row client loops.
export async function POST(req: NextRequest) {
  const _authErr = await requireAdmin(req, 'products')
  if (_authErr) return _authErr
  try {
    const { ids, action } = await req.json()
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No ids provided' }, { status: 400 })
    }
    if (!['activate', 'deactivate', 'delete'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    if (action === 'delete') {
      const { error } = await supabaseAdmin.from('products').delete().in('id', ids)
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    } else {
      const { error } = await supabaseAdmin
        .from('products')
        .update({ is_active: action === 'activate' })
        .in('id', ids)
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    }

    revalidateStorefront()
    return NextResponse.json({ ok: true, count: ids.length })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
