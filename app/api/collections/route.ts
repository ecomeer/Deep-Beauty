import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('collections')
      .select('id, name_ar, name_en, slug, description_ar, description_en, image_url, is_featured, sort_order, collection_products(count)')
      .eq('status', 'active')
      .is('deleted_at', null)
      .order('sort_order')

    if (error) {
      console.error('Collections API error:', error)
      return NextResponse.json({ error: 'فشل في جلب المجموعات' }, { status: 500 })
    }

    const collections = (data || []).map((c) => {
      const { collection_products, ...rest } = c as typeof c & { collection_products: { count: number }[] }
      return { ...rest, product_count: collection_products?.[0]?.count ?? 0 }
    })

    return NextResponse.json(
      { collections },
      { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } }
    )
  } catch (err) {
    console.error('Collections API exception:', err)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
