import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('settings')
    .select('key, value')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ settings: data || [] })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // body is Record<string, string> — e.g. { store_name: 'Deep Beauty', shipping_cost: '1.500', ... }

    const rows = Object.entries(body as Record<string, string>).map(([key, value]) => ({
      key,
      value: value ?? '',
    }))

    const { error } = await supabaseAdmin
      .from('settings')
      .upsert(rows, { onConflict: 'key' })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
