import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { normalizeCustomerProfileUpdate } from '@/lib/profile-updates'

export const dynamic = 'force-dynamic'

// ─── GET /api/auth/profile ─────────────────────────────────────────
export async function GET() {
  try {
    const { user, error: authError } = await requireUser()
    if (authError) return authError

    const [userResult, profileResult] = await Promise.all([
      supabaseAdmin
        .from('users')
        .select('id,email,name,phone,created_at,updated_at')
        .eq('id', user.id)
        .maybeSingle(),
      supabaseAdmin
        .from('profiles')
        .select('default_address')
        .eq('id', user.id)
        .maybeSingle(),
    ])

    if (userResult.error || profileResult.error) {
      console.error('Profile GET error:', userResult.error || profileResult.error)
      return NextResponse.json({ error: 'فشل في جلب البيانات الشخصية' }, { status: 500 })
    }

    return NextResponse.json({
      profile: {
        id: user.id,
        email: userResult.data?.email ?? user.email,
        full_name: userResult.data?.name ?? user.user_metadata?.name ?? null,
        phone: userResult.data?.phone ?? user.user_metadata?.phone ?? null,
        default_address: profileResult.data?.default_address ?? null,
        created_at: userResult.data?.created_at ?? null,
        updated_at: userResult.data?.updated_at ?? null,
      },
    })
  } catch (err) {
    console.error('Profile GET exception:', err)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

// ─── PUT /api/auth/profile ─────────────────────────────────────────
// Body: { name? | full_name?, phone?, default_address? }
export async function PUT(req: NextRequest) {
  try {
    const { user, error: authError } = await requireUser()
    if (authError) return authError

    let updates
    try {
      updates = normalizeCustomerProfileUpdate(await req.json())
    } catch {
      return NextResponse.json({ error: 'لا توجد بيانات صالحة للتحديث' }, { status: 400 })
    }

    const userUpdates: Record<string, string> = {}
    if (updates.name !== undefined) userUpdates.name = updates.name
    if (updates.phone !== undefined) userUpdates.phone = updates.phone

    if (Object.keys(userUpdates).length > 0) {
      const { error } = await supabaseAdmin
        .from('users')
        .update(userUpdates)
        .eq('id', user.id)

      if (error) {
        console.error('Users profile update error:', error)
        return NextResponse.json({ error: 'فشل في تحديث البيانات الشخصية' }, { status: 500 })
      }
    }

    const profileUpdates: Record<string, unknown> = {
      id: user.id,
      email: user.email ?? null,
      updated_at: new Date().toISOString(),
    }
    if (updates.name !== undefined) profileUpdates.full_name = updates.name
    if (updates.phone !== undefined) profileUpdates.phone = updates.phone
    if (updates.default_address !== undefined) profileUpdates.default_address = updates.default_address

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(profileUpdates)
      .select('id,email,full_name,phone,default_address,created_at,updated_at')
      .single()

    if (profileError) {
      console.error('Profiles update error:', profileError)
      return NextResponse.json({ error: 'فشل في تحديث البيانات الشخصية' }, { status: 500 })
    }

    return NextResponse.json({ profile })
  } catch (err) {
    console.error('Profile PUT exception:', err)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
