import { supabaseAdmin } from '@/lib/supabase-admin'

export interface ActiveFlashSale {
  discount_percentage: number
  apply_to: 'all' | 'category' | 'products'
  category_name: string | null
  product_ids: string[]
}

/**
 * Returns every currently-active flash sale with enough targeting info
 * (category name / product ids) to decide, per product, whether it applies.
 */
export async function getActiveFlashSales(): Promise<ActiveFlashSale[]> {
  const now = new Date().toISOString()
  const { data: sales, error: salesError } = await supabaseAdmin
    .from('flash_sales')
    .select('id, discount_percentage, apply_to, category_id, categories(name_ar, name_en)')
    .eq('is_active', true)
    .lte('starts_at', now)
    .gte('ends_at', now)

  if (salesError) {
    console.error('getActiveFlashSales: sales query failed', salesError)
    return []
  }
  if (!sales || sales.length === 0) return []

  const productSaleIds = sales
    .filter((s) => s.apply_to === 'products')
    .map((s) => s.id as string)

  const productIdsBySale: Record<string, string[]> = {}
  if (productSaleIds.length > 0) {
    const { data: links, error: linksError } = await supabaseAdmin
      .from('flash_sale_products')
      .select('flash_sale_id, product_id')
      .in('flash_sale_id', productSaleIds)

    if (linksError) {
      console.error('getActiveFlashSales: flash_sale_products query failed', linksError)
    }

    for (const link of links || []) {
      const key = link.flash_sale_id as string
      ;(productIdsBySale[key] ??= []).push(link.product_id as string)
    }
  }

  return sales.map((s) => {
    const category = s.categories as { name_ar?: string; name_en?: string } | { name_ar?: string; name_en?: string }[] | null
    const categoryRow = Array.isArray(category) ? category[0] : category
    return {
      discount_percentage: s.discount_percentage as number,
      apply_to: s.apply_to as 'all' | 'category' | 'products',
      category_name: categoryRow?.name_ar || categoryRow?.name_en || null,
      product_ids: productIdsBySale[s.id as string] || [],
    }
  })
}

/**
 * Picks the highest discount among active flash sales that actually target
 * this product (apply_to: all / matching category name / listed product id).
 */
export function bestDiscountForProduct(
  product: { id: string; category?: string | null },
  sales: ActiveFlashSale[]
): number {
  let best = 0
  for (const sale of sales) {
    let applies = false
    if (sale.apply_to === 'all') {
      applies = true
    } else if (sale.apply_to === 'category') {
      applies = Boolean(
        sale.category_name && product.category &&
        sale.category_name.toLowerCase() === product.category.toLowerCase()
      )
    } else if (sale.apply_to === 'products') {
      applies = sale.product_ids.includes(product.id)
    }
    if (applies && sale.discount_percentage > best) best = sale.discount_percentage
  }
  return best
}

/**
 * Applies flash sale discount to a price.
 * Returns null if no discount.
 */
export function applyDiscount(price: number, discountPct: number): number | null {
  if (!discountPct) return null
  return Math.round(price * (1 - discountPct / 100) * 1000) / 1000
}
