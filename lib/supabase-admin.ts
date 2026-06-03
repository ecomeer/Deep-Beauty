import { createClient } from '@supabase/supabase-js'

// Server-only client with service_role — bypasses RLS
// NEVER import this in client components ('use client')
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  throw new Error('[supabase-admin] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars')
}
export const supabaseAdmin = createClient(
  url,
  key,
  {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      // 30s timeout — storage uploads can be large
      fetch: (url, options) =>
        fetch(url, { ...options, signal: AbortSignal.timeout(30000) }),
    },
  }
)
