import { NextRequest, NextResponse } from 'next/server'
import { createWritableServerClient } from '@/lib/supabase-server'
import { sendEmail, welcomeEmail } from '@/lib/email'
import { authLimiter, getClientIp } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    if (!authLimiter(getClientIp(request), 'register')) {
      return NextResponse.json(
        { error: 'محاولات كثيرة جداً. حاول مرة أخرى بعد قليل' },
        { status: 429 }
      )
    }

    const { name, email, phone, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'الاسم والبريد وكلمة المرور مطلوبة' }, { status: 400 })
    }

    const { supabase, applyCookies } = createWritableServerClient(request)

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, phone } },
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // public.users is created by the trusted auth.users trigger. Do not let
    // a browser session insert role-bearing rows directly.
    if (authData.user) {
      try {
        const { subject, html } = welcomeEmail(name)
        await sendEmail({ to: email, subject, html })
      } catch {
        // Non-critical.
      }
    }

    return applyCookies(NextResponse.json({
      user: authData.user,
      message: 'تم التسجيل بنجاح',
    }, { status: 201 }))
  } catch {
    return NextResponse.json({ error: 'حدث خطأ أثناء إنشاء الحساب' }, { status: 500 })
  }
}
