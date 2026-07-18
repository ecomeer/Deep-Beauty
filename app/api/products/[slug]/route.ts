import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getActiveFlashSales, bestDiscountForProduct, applyDiscount } from '@/lib/flash-sale'
import { getProductRecommendations, getProductRatings } from '@/lib/recommendations'
import { Product } from '@/types'

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

  const recommendations = await getProductRecommendations(product, 6)

  // `related` stays for backward compatibility with the existing product
  // page UI: same-category first, then bestsellers, capped at 6 — each
  // section already excludes the ones before it.
  const related = [
    ...recommendations.same_category,
    ...recommendations.best_sellers,
  ].slice(0, 6)

  const ratingSubjects = [product.id, ...related.map((p) => p.id), ...recommendations.frequently_bought_together.map((p) => p.id)]
  const ratings = await getProductRatings(ratingSubjects)

  const attachRating = <T extends { id: string }>(p: T): T & Pick<Product, 'rating' | 'review_count'> => ({
    ...p,
    rating: ratings[p.id]?.average_rating ?? null,
    review_count: ratings[p.id]?.review_count ?? 0,
  })

  return NextResponse.json({
    product: attachRating({ ...product, sale_price: applyDiscount(product.price, bestDiscountForProduct(product, flashSales)) }),
    related: related.map(attachRating),
    recommendations: {
      same_category: recommendations.same_category.map(attachRating),
      frequently_bought_together: recommendations.frequently_bought_together.map(attachRating),
      best_sellers: recommendations.best_sellers.map(attachRating),
      new_arrivals: recommendations.new_arrivals.map(attachRating),
    },
  })
}
