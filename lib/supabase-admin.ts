import { createClient } from '@supabase/supabase-js'

// Server-only client with service_role — bypasses RLS
// NEVER import this in client components ('use client')
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      // 30s timeout — storage uploads can be large
      fetch: (url, options) =>
        fetch(url, { ...options, signal: AbortSignal.timeout(30000) }),
    },
  }
)
