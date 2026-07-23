import { createServerClient } from '@supabase/ssr'
import type { NextRequest } from 'next/server'
import { supabaseAdmin } from './supabase-admin'

/**
 * Best-effort admin audit trail. Records who (resolved from the request's
 * session cookie) did what to which entity. Never throws and never blocks the
 * caller's success path — a logging failure must not fail the mutation.
 *
 * Usage (after a successful mutation):
 *   await logActivity(req, { action: 'update', entity: 'product', entity_id: id })
 */
export async function logActivity(
  req: NextRequest,
  entry: { action: string; entity: string; entity_id?: string | null; meta?: Record<string, unknown> }
): Promise<void> {
  try {
    let actorId: string | null = null
    let actorEmail: string | null = null

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (url && key) {
      const supabase = createServerClient(url, key, {
        cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} },
      })
      const { data: { user } } = await supabase.auth.getUser()
      actorId = user?.id ?? null
      actorEmail = user?.email ?? null
    }

    await supabaseAdmin.from('admin_activity_log').insert({
      actor_id: actorId,
      actor_email: actorEmail,
      action: entry.action,
      entity: entry.entity,
      entity_id: entry.entity_id ?? null,
      meta: entry.meta ?? null,
    })
  } catch (e) {
    console.error('logActivity failed:', e)
  }
}
