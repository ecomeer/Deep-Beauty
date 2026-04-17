import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// ─── GET /api/wishlist ─────────────────────────────────────────────
// Returns the current user's wishlist with product details
export async function GET(_req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول أولاً' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('wishlists')
      .select(`
        id,
        product_id,
        created_at,
        products (
          id, name_ar, name_en, slug, price, compare_price, images,
          stock_quantity, is_active, is_featured
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Wishlist fetch error:', error)
      return NextResponse.json({ error: 'فشل في جلب المفضلة' }, { status: 500 })
    }

    // Filter out wishlist rows whose product was deleted / deactivated
    const items = (data || []).filter((row: any) => row.products?.is_active)

    return NextResponse.json({ items })
  } catch (err) {
    console.error('Wishlist GET exception:', err)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

// ─── POST /api/wishlist ────────────────────────────────────────────
// Body: { product_id: string }
// Toggle: if product already in wishlist → remove, otherwise → add
// Returns: { action: 'added' | 'removed' }
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول أولاً' }, { status: 401 })
    }

    const { product_id } = await req.json()
    if (!product_id) {
      return NextResponse.json({ error: 'product_id مطلوب' }, { status: 400 })
    }

    // Check if already in wishlist
    const { data: existing } = await supabase
      .from('wishlists')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', product_id)
      .maybeSingle()

    if (existing) {
      // Remove
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('id', existing.id)

      if (error) {
        console.error('Wishlist delete error:', error)
        return NextResponse.json({ error: 'فشل في إزالة المنتج من المفضلة' }, { status: 500 })
      }
      return NextResponse.json({ action: 'removed' })
    } else {
      // Add
      const { error } = await supabase
        .from('wishlists')
        .insert({ user_id: user.id, product_id })

      if (error) {
        console.error('Wishlist insert error:', error)
        return NextResponse.json({ error: 'فشل في إضافة المنتج للمفضلة' }, { status: 500 })
      }
      return NextResponse.json({ action: 'added' })
    }
  } catch (err) {
    console.error('Wishlist POST exception:', err)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
