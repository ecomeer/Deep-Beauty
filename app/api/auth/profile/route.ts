import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// ─── GET /api/auth/profile ─────────────────────────────────────────
export async function GET(_req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول أولاً' }, { status: 401 })
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (error) {
      console.error('Profile GET error:', error)
      return NextResponse.json({ error: 'فشل في جلب البيانات الشخصية' }, { status: 500 })
    }

    return NextResponse.json({
      profile: profile ?? {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name ?? null,
        phone: user.user_metadata?.phone ?? null,
        default_address: null,
      },
    })
  } catch (err) {
    console.error('Profile GET exception:', err)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

// ─── PUT /api/auth/profile ─────────────────────────────────────────
// Body: { full_name?, phone?, default_address? }
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول أولاً' }, { status: 401 })
    }

    const body = await req.json()
    const allowed = ['full_name', 'phone', 'default_address']
    const updates: Record<string, unknown> = { id: user.id }
    for (const key of allowed) {
      if (key in body) updates[key] = body[key]
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .upsert(updates)
      .select()
      .single()

    if (error) {
      console.error('Profile PUT error:', error)
      return NextResponse.json({ error: 'فشل في تحديث البيانات الشخصية' }, { status: 500 })
    }

    return NextResponse.json({ profile })
  } catch (err) {
    console.error('Profile PUT exception:', err)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
