import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-admin'

// GET - Get tracking history for an order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const _authErr = await requireAdmin(request)
  if (_authErr) return _authErr
  try {
    const { id } = await params
    const supabase = supabaseAdmin

    const { data, error } = await supabase
      .from('order_tracking')
      .select('*')
      .eq('order_id', id)
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
  { params }: { params: Promise<{ id: string }> }
) {
  const _authErr = await requireAdmin(request)
  if (_authErr) return _authErr
  try {
    const { id } = await params
    const body = await request.json()
    const supabase = supabaseAdmin

    const { data, error } = await supabase
      .from('order_tracking')
      .insert([{
        order_id: id,
        status: body.status,
        status_label_ar: body.status_label_ar,
        status_label_en: body.status_label_en,
        description_ar: body.description_ar,
        description_en: body.description_en,
        location: body.location,
        is_customer_visible: body.is_customer_visible ?? true,
        created_by: body.created_by,
      }])
      .select()
      .single()

    if (error) throw error

    if (body.update_order_status) {
      await supabase
        .from('orders')
        .update({
          status: body.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
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
  { params }: { params: Promise<{ id: string }> }
) {
  const _authErr = await requireAdmin(request)
  if (_authErr) return _authErr
  try {
    const { id } = await params
    const body = await request.json()
    const supabase = supabaseAdmin

    const { data, error } = await supabase
      .from('order_tracking')
      .update({
        status: body.status,
        status_label_ar: body.status_label_ar,
        status_label_en: body.status_label_en,
        description_ar: body.description_ar,
        description_en: body.description_en,
        location: body.location,
        is_customer_visible: body.is_customer_visible,
      })
      .eq('id', body.tracking_id)
      .eq('order_id', id)
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
  { params }: { params: Promise<{ id: string }> }
) {
  const _authErr = await requireAdmin(request)
  if (_authErr) return _authErr
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const trackingId = searchParams.get('tracking_id')

    if (!trackingId) {
      return NextResponse.json(
        { error: 'Tracking ID required' },
        { status: 400 }
      )
    }

    const supabase = supabaseAdmin

    const { error } = await supabase
      .from('order_tracking')
      .delete()
      .eq('id', trackingId)
      .eq('order_id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete tracking error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
