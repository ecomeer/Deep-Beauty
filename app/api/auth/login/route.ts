import { NextRequest, NextResponse } from 'next/server'
import { createWritableServerClient } from '@/lib/supabase-server'
import { getClientIp, loginLimiter } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    if (!loginLimiter(getClientIp(request))) {
      return NextResponse.json({ error: 'محاولات كثيرة، يرجى الانتظار قليلاً' }, { status: 429 })
    }

    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'البريد وكلمة المرور مطلوبان' }, { status: 400 })
    }

    const { supabase, applyCookies } = createWritableServerClient(request)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 })
    }

    return applyCookies(NextResponse.json({ user: data.user }))
  } catch {
    return NextResponse.json({ error: 'حدث خطأ أثناء تسجيل الدخول' }, { status: 500 })
  }
}
