import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { calculateShipping } from '@/lib/shipping'
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

    const { data: zones, error } = await supabaseAdmin
      .from('shipping_zones')
      .select('id,country_code,name,base_rate,free_threshold,is_active')
      .eq('is_active', true)

    if (error) throw error

    const result = calculateShipping(
      countryCode as GulfCountry,
      subtotalKWD,
      (zones || []) as ShippingZone[]
    )

    return NextResponse.json({
      cost: result.rate,
      isFree: result.isFree,
      freeThresholdKWD: result.zone?.free_shipping_threshold ?? null,
      zone: result.zone
        ? {
            id: result.zone.id,
            name_ar: result.zone.name_ar,
            name_en: result.zone.name_en,
            estimated_days_min: result.zone.estimated_days_min,
            estimated_days_max: result.zone.estimated_days_max,
          }
        : null,
    })
  } catch (error: unknown) {
    console.error('Shipping calculation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Shipping calculation failed' },
      { status: 500 }
    )
  }
}
