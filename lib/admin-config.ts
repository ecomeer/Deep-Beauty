import type { User } from '@supabase/supabase-js'

// Single source of truth for admin authorization inputs.
// Edge-safe: used by proxy.ts (middleware), lib/auth-admin.ts, and the
// admin login route — keep this module free of Node-only imports.

export function getAllowedAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? process.env.ADMIN_EMAIL ?? '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
}

export function isEmailAllowListed(email: string | null | undefined): boolean {
  if (!email) return false
  return getAllowedAdminEmails().includes(email.trim().toLowerCase())
}

export function hasAdminMetadata(
  user: Pick<User, 'app_metadata' | 'user_metadata'> | null | undefined
): boolean {
  // SECURITY: only `app_metadata` is server-managed and NOT writable by the
  // user. `user_metadata` is self-writable through the browser anon key
  // (supabase.auth.updateUser({ data: { role: 'admin' } })), so trusting it
  // here would let any customer promote themselves to admin. Never read
  // `user_metadata.role` for authorization.
  return user?.app_metadata?.role === 'admin'
}

// DEV PREVIEW BYPASS — local development only. Gated by NODE_ENV so a
// misconfigured production deploy can never disable admin auth, even if the
// env var leaks into the client bundle. Prefer the server-only DEV_BYPASS var;
// NEXT_PUBLIC_DEV_BYPASS is still honored for back-compat but only outside
// production.
export function isDevBypass(): boolean {
  if (process.env.NODE_ENV === 'production') return false
  return process.env.DEV_BYPASS === 'true' || process.env.NEXT_PUBLIC_DEV_BYPASS === 'true'
}
