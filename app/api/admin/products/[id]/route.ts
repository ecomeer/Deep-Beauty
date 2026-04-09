import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    console.log('PATCH request received for id:', id)
    console.log('ENV check:', {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'exists' : 'missing',
      key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'exists' : 'missing'
    })

    let body
    try {
      body = await req.json()
      console.log('Request body:', JSON.stringify(body, null, 2))
    } catch (parseError) {
      console.error('Failed to parse JSON body:', parseError)
      return NextResponse.json({ error: 'Invalid JSON body', details: String(parseError) }, { status: 400 })
    }

    const allowed = [
      'name_ar','name_en','slug','category','price','compare_price',
      'stock_quantity','weight_grams','is_active','is_featured',
      'description_ar','description_en','ingredients_ar','ingredients_en','images',
    ]
    const updateFields: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in body) updateFields[key] = body[key]
    }

    console.log('Filtered update fields:', updateFields)
    console.log('Supabase client exists:', !!supabaseAdmin)

    const { data, error } = await supabaseAdmin
      .from('products')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message, details: error }, { status: 400 })
    }

    console.log('Update successful:', data)
    return NextResponse.json({ data })
  } catch (err) {
    console.error('PATCH error:', err)
    return NextResponse.json({ error: 'Internal server error', details: String(err) }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await supabaseAdmin.from('products').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
