import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createWritableServerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { name, phone, userId, email } = await request.json()

    if (!userId || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { supabase, applyCookies } = createWritableServerClient(request)

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

    return applyCookies(NextResponse.json({ ok: true }))
  } catch (error) {
    console.error('Profile registration error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
