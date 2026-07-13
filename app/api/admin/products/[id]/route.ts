import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-admin'
import { sendEmail, backInStockEmail } from '@/lib/email'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const _authErr = await requireAdmin(req)
  if (_authErr) return _authErr
  const { id } = await params
  const { data, error } = await supabaseAdmin.from('products').select('*').eq('id', id).single()
  if (error || !data) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  return NextResponse.json({ product: data })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const _authErr = await requireAdmin(req)
  if (_authErr) return _authErr
  try {
    const { id } = await params

    let body
    try {
      body = await req.json()
    } catch (parseError) {
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

    // Capture the pre-update stock level so we can detect a 0 → positive
    // restock below, without an extra round-trip when stock isn't changing.
    let previousStock: number | null = null
    if ('stock_quantity' in updateFields) {
      const { data: before } = await supabaseAdmin.from('products').select('stock_quantity').eq('id', id).maybeSingle()
      previousStock = before?.stock_quantity ?? null
    }

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

    if (previousStock !== null && previousStock <= 0 && Number(data.stock_quantity) > 0) {
      notifyBackInStock(id, data.name_ar, data.slug).catch((err) =>
        console.error('Failed to send back-in-stock notifications:', err)
      )
    }

    return NextResponse.json({ data })
  } catch (err) {
    console.error('PATCH error:', err)
    return NextResponse.json({ error: 'Internal server error', details: String(err) }, { status: 500 })
  }
}

async function notifyBackInStock(productId: string, productName: string, slug: string) {
  const { data: subs } = await supabaseAdmin
    .from('stock_notifications')
    .select('id, email')
    .eq('product_id', productId)
    .eq('notified', false)

  if (!subs || subs.length === 0) return

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.deepbeautykw.com'
  const { subject, html } = backInStockEmail(productName, `${siteUrl}/products/${slug}`)

  for (const sub of subs) {
    const result = await sendEmail({ to: sub.email, subject, html })
    if (result.sent) {
      await supabaseAdmin.from('stock_notifications').update({ notified: true }).eq('id', sub.id)
    }
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const _authErr = await requireAdmin(req)
  if (_authErr) return _authErr
  const { id } = await params
  const { error } = await supabaseAdmin.from('products').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
