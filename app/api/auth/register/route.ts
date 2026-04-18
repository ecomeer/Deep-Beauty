import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'الاسم والبريد وكلمة المرور مطلوبة' }, { status: 400 })
    }

    const cookiesToSet: Array<{ name: string; value: string; options: Record<string, unknown> }> = []

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookies) => { cookiesToSet.push(...cookies) },
        },
      }
    )

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, phone } },
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (authData.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert({ id: authData.user.id, name, email, phone, role: 'customer', is_active: true })

      if (profileError) {
        console.error('Profile creation error:', profileError)
      }
    }

    const response = NextResponse.json({
      user: authData.user,
      message: 'تم التسجيل بنجاح',
    }, { status: 201 })

    cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]))
    return response
  } catch {
    return NextResponse.json({ error: 'حدث خطأ أثناء إنشاء الحساب' }, { status: 500 })
  }
}
