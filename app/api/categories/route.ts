import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name_ar, name_en, slug, image_url, is_active')
      .eq('is_active', true)
      .order('name_ar')

    if (error) {
      console.error('Categories API error:', error)
      return NextResponse.json({ error: 'فشل في جلب التصنيفات' }, { status: 500 })
    }

    return NextResponse.json({ categories: categories || [] })
  } catch (err) {
    console.error('Categories API exception:', err)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
