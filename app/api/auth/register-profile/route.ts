import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { normalizeCustomerProfileUpdate } from '@/lib/profile-updates'

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await requireUser()
    if (authError) return authError

    let updates
    try {
      updates = normalizeCustomerProfileUpdate(await request.json())
    } catch {
      return NextResponse.json({ error: 'No valid profile fields' }, { status: 400 })
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
        console.error('Profile registration update error:', error)
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
      }
    }

    // Do not accept browser-supplied id/email/role/is_active. The Auth trigger
    // owns identity creation; account activation remains an admin decision.
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Profile registration error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
