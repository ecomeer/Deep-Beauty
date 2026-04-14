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
    let { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('sales_count', { ascending: false })
      .limit(limit)

    // If that fails or returns empty, fall back to featured products
    if (error || !products || products.length === 0) {
      const fallback = await supabase
        .from('products')
        .select('*')
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

    return NextResponse.json({ products: withSalePrice })
  } catch (error) {
    console.error('Bestsellers API error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    )
  }
}
