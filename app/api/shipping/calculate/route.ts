import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { calculateShipping, DEFAULT_SHIPPING_ZONES, ShippingZone } from '@/lib/shipping'
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

    let shippingZones: ShippingZone[]

    try {
      const { data: zones, error } = await supabaseAdmin
        .from('shipping_zones')
        .select('id,name_ar,name_en,countries,base_rate,free_shipping_threshold,estimated_days_min,estimated_days_max,is_active')
        .eq('is_active', true)

      if (error || !zones?.length) throw error || new Error('No zones')
      shippingZones = zones as unknown as ShippingZone[]
    } catch {
      shippingZones = DEFAULT_SHIPPING_ZONES.map((z, i) => ({ ...z, id: `default-${i}` }))
    }

    const result = calculateShipping(
      countryCode as GulfCountry,
      subtotalKWD,
      shippingZones
    )

    return NextResponse.json({
      cost: result.rate,
      isFree: result.isFree,
      freeThresholdKWD: result.zone?.free_shipping_threshold ?? null,
      zone: result.zone ?? null,
    })
  } catch (error: unknown) {
    console.error('Shipping calculation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Shipping calculation failed' },
      { status: 500 }
    )
  }
}
