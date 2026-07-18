import { NextRequest, NextResponse } from 'next/server'
import { getFrequentlyBoughtTogether, getBestSellers, getProductRatings } from '@/lib/recommendations'

export const dynamic = 'force-dynamic'

// Cart / post-purchase recommendations: products frequently bought
// alongside what's currently in the cart, falling back to bestsellers when
// there's not enough order-history data yet (new store, new products).
export async function GET(req: NextRequest) {
  try {
    const ids = (req.nextUrl.searchParams.get('ids') || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)

    if (ids.length === 0) return NextResponse.json({ products: [] })

    let products = await getFrequentlyBoughtTogether(ids, ids, 4)
    if (products.length < 4) {
      const fallback = await getBestSellers([...ids, ...products.map((p) => p.id)], 4 - products.length)
      products = [...products, ...fallback]
    }

    const ratings = await getProductRatings(products.map((p) => p.id))
    const withRatings = products.map((p) => ({
      ...p,
      rating: ratings[p.id]?.average_rating ?? null,
      review_count: ratings[p.id]?.review_count ?? 0,
    }))

    return NextResponse.json(
      { products: withRatings },
      { headers: { 'Cache-Control': 'private, no-store' } }
    )
  } catch (err) {
    console.error('Cart recommendations error:', err)
    return NextResponse.json({ products: [] }, { status: 200 })
  }
}
