import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getClientIp, reviewLimiter } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('reviews')
      .select('id,product_id,rating,comment,name,created_at,is_approved')
      .eq('product_id', productId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ reviews: data || [] })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!reviewLimiter(getClientIp(request))) {
      return NextResponse.json({ error: 'طلبات كثيرة، يرجى الانتظار قليلاً' }, { status: 429 })
    }

    const body = await request.json()
    const { productId, customerName, rating, comment, orderId } = body

    if (!productId || !customerName || !rating || !comment) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be an integer from 1 to 5' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        product_id: productId,
        customer_name: customerName,
        rating,
        comment,
        order_id: orderId || null,
        is_approved: false,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ review: data })
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 })
  }
}
