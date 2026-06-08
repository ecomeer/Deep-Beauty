import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase-admin'

function getAllowedAdminEmails(): string[] {
  const list = process.env.ADMIN_EMAILS ?? process.env.ADMIN_EMAIL ?? ''
  return list
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }

    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'البريد وكلمة المرور مطلوبان' }, { status: 400 })
    }

    const cookiesToSet: Array<{ name: string; value: string; options: Record<string, unknown> }> = []

    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookies) => { cookiesToSet.push(...cookies) },
        },
      }
    )

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.user) {
      return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 })
    }

    const normalizedEmail = email.trim().toLowerCase()
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

    const response = NextResponse.json({ ok: true })
    cookiesToSet.forEach(({ name, value, options }) =>
      response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
    )
    return response
  } catch (err) {
    console.error('Admin login error:', err)
    return NextResponse.json({ error: 'حدث خطأ أثناء تسجيل الدخول' }, { status: 500 })
  }
}
