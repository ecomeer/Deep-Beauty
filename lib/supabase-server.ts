import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Read from process.env directly
const getSupabaseUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const getSupabaseKey = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function createServerSupabaseClient() {
  const supabaseUrl = getSupabaseUrl()
  const supabaseKey = getSupabaseKey()

  const cookieStore = await cookies()

  // Provide placeholder values if env vars are missing (will fail on actual API calls)
  const url = supabaseUrl || 'https://placeholder.supabase.co'
  const key = supabaseKey || 'placeholder-key'

  return createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Silent fail for read-only cookie store
          }
        },
      },
    }
  )
}
