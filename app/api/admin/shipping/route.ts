import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-admin'

// GET - Fetch all shipping zones
export async function GET(request: NextRequest) {
  const _authErr = await requireAdmin(request)
  if (_authErr) return _authErr
  try {
    const supabase = supabaseAdmin
    
    const { data, error } = await supabase
      .from('shipping_zones')
      .select('id,name_ar,name_en,countries,base_rate,free_shipping_threshold,is_active,sort_order,estimated_days_min,estimated_days_max,created_at,updated_at')
      .order('sort_order', { ascending: true })
    
    if (error) throw error
    
    return NextResponse.json({ zones: data || [] })
  } catch (error: unknown) {
    console.error('Shipping zones fetch error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Shipping zones fetch failed' },
      { status: 500 }
    )
  }
}

// POST - Create new shipping zone
export async function POST(request: NextRequest) {
  const _authErr = await requireAdmin(request)
  if (_authErr) return _authErr
  try {
    const body = await request.json()
    const supabase = supabaseAdmin
    
    const { data, error } = await supabase
      .from('shipping_zones')
      .insert([{
        name_ar: body.name_ar,
        name_en: body.name_en,
        countries: body.countries,
        base_rate: body.base_rate,
        free_shipping_threshold: body.free_shipping_threshold,
        estimated_days_min: body.estimated_days_min,
        estimated_days_max: body.estimated_days_max,
        is_active: body.is_active ?? true,
        sort_order: body.sort_order ?? 0
      }])
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ zone: data }, { status: 201 })
  } catch (error: unknown) {
    console.error('Shipping zone create error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Shipping zone create failed' },
      { status: 500 }
    )
  }
}

// PATCH - Update shipping zone
export async function PATCH(request: NextRequest) {
  const _authErr = await requireAdmin(request)
  if (_authErr) return _authErr
  try {
    const body = await request.json()
    const supabase = supabaseAdmin
    
    const { id, ...updates } = body
    
    const { data, error } = await supabase
      .from('shipping_zones')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ zone: data })
  } catch (error: unknown) {
    console.error('Shipping zone update error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Shipping zone update failed' },
      { status: 500 }
    )
  }
}

// DELETE - Delete shipping zone
export async function DELETE(request: NextRequest) {
  const _authErr = await requireAdmin(request)
  if (_authErr) return _authErr
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Zone ID required' }, { status: 400 })
    }
    
    const supabase = supabaseAdmin
    
    const { error } = await supabase
      .from('shipping_zones')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Shipping zone delete error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Shipping zone delete failed' },
      { status: 500 }
    )
  }
}
