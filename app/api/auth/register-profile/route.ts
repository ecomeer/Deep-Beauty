import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { name, phone, userId, email } = await request.json()

    if (!userId || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const cookiesToSet: Array<{ name: string; value: string; options: Record<string, unknown> }> = []
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookies) => {
            cookiesToSet.push(...cookies)
          },
        },
      }
    )

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user || user.id !== userId || user.email !== email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false },
      }
    )

    // Create profile in users table
    const { error: insertError } = await supabaseAdmin.from('users').upsert({
      id: userId,
      name,
      email,
      phone,
      role: 'customer',
      is_active: true,
    })

    if (insertError) {
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
    }

    const response = NextResponse.json({ ok: true })
    cookiesToSet.forEach(({ name, value, options }) =>
      response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
    )
    return response
  } catch (error) {
    console.error('Profile registration error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
