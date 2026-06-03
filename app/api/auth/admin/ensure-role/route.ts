import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase-admin'

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function getAllowedAdminEmails(): string[] {
  const list = process.env.ADMIN_EMAILS ?? process.env.ADMIN_EMAIL ?? ''
  return list
    .split(',')
    .map((email) => normalizeEmail(email))
    .filter(Boolean)
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const normalizedEmail = normalizeEmail(email)
    const allowedAdminEmails = getAllowedAdminEmails()
    if (!allowedAdminEmails.includes(normalizedEmail)) {
      return NextResponse.json({ error: 'Unauthorized admin email' }, { status: 403 })
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

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    }

    if (normalizeEmail(user.email ?? '') !== normalizedEmail) {
      return NextResponse.json({ error: 'Session email mismatch' }, { status: 403 })
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      app_metadata: {
        ...(user.app_metadata ?? {}),
        role: 'admin',
      },
      user_metadata: {
        ...(user.user_metadata ?? {}),
        role: 'admin',
      },
    })

    if (updateError) {
      return NextResponse.json({ error: 'Failed to sync admin role' }, { status: 500 })
    }

    // FIXED: keep DB role in sync for RLS policies based on users.role.
    await supabaseAdmin
      .from('users')
      .upsert({
        id: user.id,
        email: normalizedEmail,
        role: 'admin',
        is_active: true,
      })

    const response = NextResponse.json({ ok: true })
    cookiesToSet.forEach(({ name, value, options }) =>
      response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
    )
    return response
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
