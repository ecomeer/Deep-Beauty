import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('marketing_campaigns')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, description, type, target_audience, content, scheduled_at, is_active } = body

    if (!title || !type || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('marketing_campaigns')
      .insert([{
        title: title.trim(),
        description: description?.trim() || null,
        type,
        target_audience: target_audience || 'all',
        content,
        scheduled_at: scheduled_at || null,
        is_active: is_active ?? true,
        sent_count: 0,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
