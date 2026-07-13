import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createWritableServerClient } from '@/lib/supabase-server'
import { getAllowedAdminEmails } from '@/lib/admin-config'

export async function POST(request: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }

    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'البريد وكلمة المرور مطلوبان' }, { status: 400 })
    }

    const { supabase, applyCookies } = createWritableServerClient(request)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.user) {
      return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 })
    }

    const normalizedEmail = email.trim().toLowerCase()

    // A 'staff' account is scoped access granted by an admin via /admin/team
    // — it never touches app_metadata and must not be overwritten by the
    // admin-sync logic below.
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('role, is_active')
      .eq('id', data.user.id)
      .maybeSingle()

    if (existingUser?.role === 'staff') {
      if (existingUser.is_active === false) {
        await supabase.auth.signOut()
        return NextResponse.json({ error: 'تم إيقاف هذا الحساب' }, { status: 403 })
      }
      return applyCookies(NextResponse.json({ ok: true }))
    }

    const hasAdminMeta = data.user.app_metadata?.role === 'admin'
    const allowedEmails = getAllowedAdminEmails()
    const emailInAllowList = allowedEmails.length === 0 || allowedEmails.includes(normalizedEmail)

    if (!hasAdminMeta && !emailInAllowList) {
      await supabase.auth.signOut()
      return NextResponse.json({ error: 'هذا الحساب لا يملك صلاحية الدخول إلى لوحة التحكم' }, { status: 403 })
    }

    // Sync admin role to app_metadata and DB (ensure-role logic built-in)
    if (!hasAdminMeta) {
      try {
        await supabaseAdmin.auth.admin.updateUserById(data.user.id, {
          app_metadata: { ...(data.user.app_metadata ?? {}), role: 'admin' },
          user_metadata: { ...(data.user.user_metadata ?? {}), role: 'admin' },
        })
      } catch (e) {
        console.error('Failed to sync admin role:', e)
      }
    }

    try {
      await supabaseAdmin
        .from('users')
        .upsert({ id: data.user.id, email: normalizedEmail, role: 'admin', is_active: true })
    } catch (e) {
      console.error('Failed to upsert user record:', e)
    }

    return applyCookies(NextResponse.json({ ok: true }))
  } catch (err) {
    console.error('Admin login error:', err)
    return NextResponse.json({ error: 'حدث خطأ أثناء تسجيل الدخول' }, { status: 500 })
  }
}
