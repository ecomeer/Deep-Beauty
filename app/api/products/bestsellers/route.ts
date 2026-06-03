import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { getActiveFlashDiscount, applyDiscount } from '@/lib/flash-sale'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '4')
    
    const supabase = await createServerSupabaseClient()
    
    // Get products with highest sales count or order count
    // First try to get from products table if there's a sales_count column
    const productColumns = 'id, name_ar, name_en, slug, description_ar, description_en, price, sale_price, images, category, stock_quantity, is_active, is_featured, sales_count, created_at'
    const { data: initialProducts, error } = await supabase
      .from('products')
      .select(productColumns)
      .eq('is_active', true)
      .order('sales_count', { ascending: false })
      .limit(limit)
    let products = initialProducts

    let products = primaryProducts

    // If that fails or returns empty, fall back to featured products
    if (error || !products || products.length === 0) {
      const fallback = await supabase
        .from('products')
        .select(productColumns)
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (fallback.error) {
        console.error('Bestsellers error:', fallback.error)
        return NextResponse.json(
          { error: 'فشل في جلب الأكثر مبيعاً' },
          { status: 500 }
        )
      }
      
      products = fallback.data || []
    }

    const flashDiscount = await getActiveFlashDiscount()
    const withSalePrice = products.map(p => ({
      ...p,
      sale_price: applyDiscount(p.price, flashDiscount),
    }))

    return NextResponse.json(
      { products: withSalePrice },
      { headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' } }
    )
  } catch (error) {
    console.error('Bestsellers API error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    )
  }
}
