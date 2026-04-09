import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '4')
    
    const supabase = await createServerSupabaseClient()
    
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_featured', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Featured products error:', error)
      return NextResponse.json(
        { error: 'فشل في جلب المنتجات المميزة' },
        { status: 500 }
      )
    }

    return NextResponse.json({ products: products || [] })
  } catch (error) {
    console.error('Featured products API error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    )
  }
}
