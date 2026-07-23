import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-admin'
import { revalidateStorefront } from '@/lib/revalidate-storefront'

export async function GET(req: NextRequest) {
  const _authErr = await requireAdmin(req, 'marketing')
  if (_authErr) return _authErr
  const { data, error } = await supabaseAdmin
    .from('flash_sales')
    .select('id, name_ar, discount_percentage, starts_at, ends_at, apply_to, is_active, created_at, category_id, categories(name_ar), flash_sale_products(product_id)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const sales = (data || []).map((s) => {
    const category = s.categories as { name_ar?: string } | { name_ar?: string }[] | null
    const categoryRow = Array.isArray(category) ? category[0] : category
    const links = (s.flash_sale_products as { product_id: string }[] | null) || []
    const { categories: _categories, flash_sale_products: _links, ...rest } = s
    void _categories
    void _links
    return {
      ...rest,
      category_name: categoryRow?.name_ar || null,
      product_ids: links.map((l) => l.product_id),
    }
  })

  return NextResponse.json({ sales })
}

export async function POST(req: NextRequest) {
  const _authErr = await requireAdmin(req, 'marketing')
  if (_authErr) return _authErr
  try {
    const body = await req.json()
    const { name_ar, discount_percentage, starts_at, ends_at, apply_to, is_active, category_id, product_ids } = body

    if (!name_ar || !discount_percentage || !starts_at || !ends_at) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (apply_to === 'category' && !category_id) {
      return NextResponse.json({ error: 'اختر فئة للعرض' }, { status: 400 })
    }
    if (apply_to === 'products' && (!Array.isArray(product_ids) || product_ids.length === 0)) {
      return NextResponse.json({ error: 'اختر منتج واحد على الأقل' }, { status: 400 })
    }
    if (typeof discount_percentage !== 'number' || discount_percentage <= 0 || discount_percentage > 100) {
      return NextResponse.json({ error: 'نسبة الخصم غير صالحة' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('flash_sales')
      .insert([{
        name_ar,
        discount_percentage,
        starts_at,
        ends_at,
        apply_to: apply_to || 'all',
        is_active: is_active ?? true,
        category_id: apply_to === 'category' ? category_id : null,
      }])
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (apply_to === 'products' && Array.isArray(product_ids) && product_ids.length > 0) {
      const { error: linkError } = await supabaseAdmin
        .from('flash_sale_products')
        .insert(product_ids.map((product_id: string) => ({ flash_sale_id: data.id, product_id })))

      if (linkError) {
        await supabaseAdmin.from('flash_sales').delete().eq('id', data.id)
        return NextResponse.json({ error: linkError.message }, { status: 500 })
      }
    }

    revalidateStorefront()
    return NextResponse.json({ sale: data }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const _authErr = await requireAdmin(req, 'marketing')
  if (_authErr) return _authErr
  try {
    const body = await req.json()
    const { id, product_ids, ...updates } = body
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from('flash_sales')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (Array.isArray(product_ids)) {
      await supabaseAdmin.from('flash_sale_products').delete().eq('flash_sale_id', id)
      if (product_ids.length > 0) {
        const { error: linkError } = await supabaseAdmin
          .from('flash_sale_products')
          .insert(product_ids.map((product_id: string) => ({ flash_sale_id: id, product_id })))
        if (linkError) return NextResponse.json({ error: linkError.message }, { status: 500 })
      }
    }

    revalidateStorefront()
    return NextResponse.json({ sale: data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const _authErr = await requireAdmin(req, 'marketing')
  if (_authErr) return _authErr
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const { error } = await supabaseAdmin.from('flash_sales').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  revalidateStorefront()
  return NextResponse.json({ ok: true })
}
