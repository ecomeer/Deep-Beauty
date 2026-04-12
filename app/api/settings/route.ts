import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Public settings endpoint — only returns non-sensitive settings for store display
const PUBLIC_KEYS = ['announcement_text', 'whatsapp_number', 'instagram_url', 'tiktok_url', 'snapchat_url']

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('settings')
    .select('key, value')
    .in('key', PUBLIC_KEYS)

  if (error) return NextResponse.json({ settings: [] })
  return NextResponse.json({ settings: data || [] })
}
