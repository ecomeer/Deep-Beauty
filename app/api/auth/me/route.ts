import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get user profile from database
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id,email,name,phone,role,is_active,created_at')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: profile?.name || user.user_metadata?.name || user.email,
        phone: profile?.phone || user.user_metadata?.phone,
        avatar: user.user_metadata?.avatar_url || null
      }
    })
  } catch (error: unknown) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
