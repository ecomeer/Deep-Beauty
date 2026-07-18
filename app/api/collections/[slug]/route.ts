import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getActiveFlashSales, bestDiscountForProduct, applyDiscount } from '@/lib/flash-sale'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  try {
    const supabase = await createServerSupabaseClient()

    const { data: collection, error } = await supabase
      .from('collections')
      .select('id, name_ar, name_en, slug, description_ar, description_en, image_url')
      .eq('slug', slug)
      .eq('status', 'active')
      .is('deleted_at', null)
      .maybeSingle()

    if (error) {
      console.error('Collection API error:', error)
      return NextResponse.json({ error: 'فشل في جلب المجموعة' }, { status: 500 })
    }
    if (!collection) return NextResponse.json({ error: 'Collection not found' }, { status: 404 })

    const [{ data: links }, flashSales] = await Promise.all([
      supabase
        .from('collection_products')
        .select('sort_order, products(id, name_ar, name_en, slug, description_ar, price, compare_price, images, category, stock_quantity, is_active, is_featured, created_at)')
        .eq('collection_id', collection.id)
        .order('sort_order'),
      getActiveFlashSales(),
    ])

    type ProductRow = { id: string; price: number; category?: string | null; is_active: boolean; [key: string]: unknown }
    type LinkRow = { sort_order: number; products: ProductRow | null }
    const products = ((links || []) as unknown as LinkRow[])
      .map((l) => l.products)
      .filter((p): p is ProductRow => !!p && p.is_active === true)
      .map((p) => ({
        ...p,
        sale_price: applyDiscount(p.price, bestDiscountForProduct(p, flashSales)),
      }))

    return NextResponse.json(
      { collection, products },
      { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } }
    )
  } catch (err) {
    console.error('Collection API exception:', err)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
