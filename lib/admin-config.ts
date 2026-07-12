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
  return user?.app_metadata?.role === 'admin' || user?.user_metadata?.role === 'admin'
}

// DEV PREVIEW BYPASS — only when explicitly set in .env.local
export function isDevBypass(): boolean {
  return process.env.NEXT_PUBLIC_DEV_BYPASS === 'true'
}
