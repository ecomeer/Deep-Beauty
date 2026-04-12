import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all' // all, pending, approved
    
    const supabase = supabaseAdmin
    
    let query = supabase
      .from('reviews')
      .select(`
        *,
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
  } catch (error: any) {
    console.error('Reviews fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
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
  } catch (error: any) {
    console.error('Review update error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
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
  } catch (error: any) {
    console.error('Review delete error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
