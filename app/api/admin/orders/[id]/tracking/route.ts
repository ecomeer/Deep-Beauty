import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// GET - Get tracking history for an order
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('order_tracking')
      .select('*')
      .eq('order_id', params.id)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    return NextResponse.json({ tracking: data || [] })
  } catch (error: any) {
    console.error('Get tracking error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Add new tracking update
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const supabase = await createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('order_tracking')
      .insert([{
        order_id: params.id,
        status: body.status,
        status_label_ar: body.status_label_ar,
        status_label_en: body.status_label_en,
        description_ar: body.description_ar,
        description_en: body.description_en,
        location: body.location,
        is_customer_visible: body.is_customer_visible ?? true,
        created_by: body.created_by
      }])
      .select()
      .single()
    
    if (error) throw error
    
    // Update order status if needed
    if (body.update_order_status) {
      await supabase
        .from('orders')
        .update({ 
          status: body.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)
    }
    
    return NextResponse.json({ tracking: data }, { status: 201 })
  } catch (error: any) {
    console.error('Add tracking error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH - Update tracking entry
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const supabase = await createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('order_tracking')
      .update({
        status: body.status,
        status_label_ar: body.status_label_ar,
        status_label_en: body.status_label_en,
        description_ar: body.description_ar,
        description_en: body.description_en,
        location: body.location,
        is_customer_visible: body.is_customer_visible
      })
      .eq('id', body.tracking_id)
      .eq('order_id', params.id)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ tracking: data })
  } catch (error: any) {
    console.error('Update tracking error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete tracking entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const trackingId = searchParams.get('tracking_id')
    
    if (!trackingId) {
      return NextResponse.json(
        { error: 'Tracking ID required' },
        { status: 400 }
      )
    }
    
    const supabase = await createServerSupabaseClient()
    
    const { error } = await supabase
      .from('order_tracking')
      .delete()
      .eq('id', trackingId)
      .eq('order_id', params.id)
    
    if (error) throw error
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete tracking error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
