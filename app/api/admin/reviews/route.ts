import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-admin'

export async function GET(request: NextRequest) {
  const _authErr = await requireAdmin(request)
  if (_authErr) return _authErr
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all' // all, pending, approved
    
    const supabase = supabaseAdmin
    
    let query = supabase
      .from('reviews')
      .select(`
        id, product_id, user_id, rating, comment, is_approved, created_at,
        products:product_id (name_ar, images)
      `)
      .order('created_at', { ascending: false })
    
    if (status === 'pending') {
      query = query.eq('is_approved', false)
    } else if (status === 'approved') {
      query = query.eq('is_approved', true)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    return NextResponse.json({ reviews: data || [] })
  } catch (error: unknown) {
    console.error('Reviews fetch error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Reviews fetch failed' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  const _authErr = await requireAdmin(request)
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
      .select('id, product_id, user_id, rating, comment, is_approved, created_at')
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ review: data })
  } catch (error: unknown) {
    console.error('Review update error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Review update failed' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const _authErr = await requireAdmin(request)
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Review delete failed' },
      { status: 500 }
    )
  }
}
