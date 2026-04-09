import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { calculateShipping, ShippingZone } from '@/lib/shipping'
import { GulfCountry } from '@/lib/currency'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { countryCode, subtotalKWD } = body
    
    if (!countryCode || typeof subtotalKWD !== 'number') {
      return NextResponse.json(
        { error: 'Country code and subtotal required' },
        { status: 400 }
      )
    }
    
    const supabase = await createServerSupabaseClient()
    
    // Fetch shipping zones from database
    const { data: zones, error } = await supabase
      .from('shipping_zones')
      .select('*')
      .eq('is_active', true)
    
    if (error) throw error
    
    // Calculate shipping
    const result = calculateShipping(
      countryCode as GulfCountry,
      subtotalKWD,
      zones || []
    )
    
    return NextResponse.json({
      ...result,
      zone: result.zone ? {
        id: result.zone.id,
        name_ar: result.zone.name_ar,
        name_en: result.zone.name_en,
        estimated_days_min: result.zone.estimated_days_min,
        estimated_days_max: result.zone.estimated_days_max
      } : null
    })
  } catch (error: any) {
    console.error('Shipping calculation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
