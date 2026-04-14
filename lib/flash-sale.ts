import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * Returns the active flash sale discount percentage (0 if none active).
 * Fetches the highest-priority (largest discount) active flash sale.
 */
export async function getActiveFlashDiscount(): Promise<number> {
  const now = new Date().toISOString()
  const { data } = await supabaseAdmin
    .from('flash_sales')
    .select('discount_percentage')
    .eq('is_active', true)
    .lte('starts_at', now)
    .gte('ends_at', now)
    .order('discount_percentage', { ascending: false })
    .limit(1)
    .single()

  return data?.discount_percentage ?? 0
}

/**
 * Applies flash sale discount to a price.
 * Returns null if no discount.
 */
export function applyDiscount(price: number, discountPct: number): number | null {
  if (!discountPct) return null
  return Math.round(price * (1 - discountPct / 100) * 1000) / 1000
}
