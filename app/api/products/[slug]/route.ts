import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getActiveFlashDiscount, applyDiscount } from '@/lib/flash-sale'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const [productRes, allProductsRes, flashDiscount] = await Promise.all([
    supabaseAdmin.from('products').select('*').eq('slug', slug).eq('is_active', true).single(),
    supabaseAdmin.from('products').select('*').eq('is_active', true).limit(20),
    getActiveFlashDiscount(),
  ])

  if (productRes.error || !productRes.data)
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  const product = productRes.data
  const allOthers = (allProductsRes.data || []).filter((p) => p.id !== product.id)

  // Prefer same category, then fill with others
  const sameCategory = allOthers.filter((p) => p.category === product.category)
  const otherCategory = allOthers.filter((p) => p.category !== product.category)
  const related = [...sameCategory, ...otherCategory]
    .slice(0, 6)
    .map((p) => ({ ...p, sale_price: applyDiscount(p.price, flashDiscount) }))

  return NextResponse.json({
    product: { ...product, sale_price: applyDiscount(product.price, flashDiscount) },
    related,
  })
}
