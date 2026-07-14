import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-admin'

const PAGE_SIZE = 20

export async function GET(request: NextRequest) {
  const _authErr = await requireAdmin(request, 'reviews')
  if (_authErr) return _authErr
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all' // all, pending, approved
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    const supabase = supabaseAdmin

    let query = supabase
      .from('reviews')
      .select(
        'id, product_id, customer_name, rating, comment, is_approved, order_id, created_at, updated_at, products:product_id (name_ar, images)',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(from, to)

    if (status === 'pending') {
      query = query.eq('is_approved', false)
    } else if (status === 'approved') {
      query = query.eq('is_approved', true)
    }

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      reviews: data || [],
      total: count ?? 0,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
    })
  } catch (error: unknown) {
    console.error('Reviews fetch error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const _authErr = await requireAdmin(request, 'reviews')
  if (_authErr) return _authErr
  try {
    const body = await request.json()
    const { id, isApproved } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Review ID required' }, { status: 400 })
    }
    
    const supabase = supabaseAdmin
    
    const { data, error } = await supabase
      .from('reviews')
      .update({ is_approved: isApproved })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ review: data })
  } catch (error: unknown) {
    console.error('Review update error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const _authErr = await requireAdmin(request, 'reviews')
  if (_authErr) return _authErr
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Review ID required' }, { status: 400 })
    }
    
    const supabase = supabaseAdmin
    
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Review delete error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
