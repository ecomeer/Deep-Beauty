import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getActiveFlashSales, bestDiscountForProduct, applyDiscount } from '@/lib/flash-sale'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const productColumns = 'id, name_ar, name_en, slug, description_ar, description_en, ingredients_ar, ingredients_en, usage_ar, benefits_ar, seo_title, meta_description, image_alt, product_type, price, compare_price, images, category, stock_quantity, is_active, is_featured, created_at'
  const [productRes, flashSales] = await Promise.all([
    supabaseAdmin.from('products').select(productColumns).eq('slug', slug).eq('is_active', true).single(),
    getActiveFlashSales(),
  ])

  if (productRes.error || !productRes.data)
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  const product = productRes.data

  // Prefer same category, then fill with others — query only the 6 rows needed
  // instead of pulling a batch and filtering in JS.
  let relatedRows: typeof productRes.data[] = []
  if (product.category) {
    const { data } = await supabaseAdmin
      .from('products')
      .select(productColumns)
      .eq('is_active', true)
      .eq('category', product.category)
      .neq('id', product.id)
      .limit(6)
    relatedRows = data || []
  }
  if (relatedRows.length < 6) {
    const excludeIds = [product.id, ...relatedRows.map((p) => p.id)]
    const { data } = await supabaseAdmin
      .from('products')
      .select(productColumns)
      .eq('is_active', true)
      .not('id', 'in', `(${excludeIds.join(',')})`)
      .limit(6 - relatedRows.length)
    relatedRows = [...relatedRows, ...(data || [])]
  }

  const related = relatedRows.map((p) => ({
    ...p,
    sale_price: applyDiscount(p.price, bestDiscountForProduct(p, flashSales)),
  }))

  return NextResponse.json({
    product: {
      ...product,
      sale_price: applyDiscount(product.price, bestDiscountForProduct(product, flashSales)),
    },
    related,
  })
}
