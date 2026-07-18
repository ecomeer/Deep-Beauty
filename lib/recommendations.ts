import { supabaseAdmin } from '@/lib/supabase-admin'
import { getActiveFlashSales, bestDiscountForProduct, applyDiscount } from '@/lib/flash-sale'
import { Product } from '@/types'

// Every recommendation surface must exclude these, per product row:
//   - the product currently being viewed
//   - deleted products (hard-deleted rows simply won't be returned)
//   - unpublished / inactive products (is_active = false)
//   - out-of-stock products (stock_quantity <= 0)
// Bestsellers/new-arrivals intentionally allow out-of-stock so "sold out"
// popular items can still show with a disabled add-to-cart state — callers
// that need strict in-stock-only should filter client-side.
const ACTIVE_IN_STOCK = { is_active: true } as const

export const PRODUCT_COLUMNS =
  'id, name_ar, name_en, slug, description_ar, description_en, price, compare_price, images, category, stock_quantity, is_active, is_featured, created_at, updated_at'

type RawProduct = Record<string, unknown> & { id: string; price: number; category?: string | null }

function withSalePrice<T extends RawProduct>(rows: T[], flashSales: Awaited<ReturnType<typeof getActiveFlashSales>>): Product[] {
  return rows.map((p) => ({
    ...p,
    sale_price: applyDiscount(p.price, bestDiscountForProduct(p, flashSales)),
  })) as unknown as Product[]
}

/** Other active, in-stock products sharing the same category text. */
export async function getSameCategoryProducts(
  category: string | null | undefined,
  excludeIds: string[],
  limit = 6
): Promise<Product[]> {
  if (!category) return []
  const [{ data }, flashSales] = await Promise.all([
    supabaseAdmin
      .from('products')
      .select(PRODUCT_COLUMNS)
      .eq('category', category)
      .match(ACTIVE_IN_STOCK)
      .gt('stock_quantity', 0)
      .not('id', 'in', `(${excludeIds.join(',') || '00000000-0000-0000-0000-000000000000'})`)
      .order('created_at', { ascending: false })
      .limit(limit),
    getActiveFlashSales(),
  ])
  return withSalePrice((data || []) as RawProduct[], flashSales)
}

/** Real order-history bestsellers, falling back to featured products (see get_bestseller_products RPC). */
export async function getBestSellers(excludeIds: string[] = [], limit = 6): Promise<Product[]> {
  const [{ data }, flashSales] = await Promise.all([
    supabaseAdmin.rpc('get_bestseller_products', { p_limit: limit + excludeIds.length }),
    getActiveFlashSales(),
  ])
  const filtered = ((data || []) as RawProduct[]).filter((p) => !excludeIds.includes(p.id)).slice(0, limit)
  return withSalePrice(filtered, flashSales)
}

/** Newest active, in-stock products. */
export async function getNewArrivals(excludeIds: string[] = [], limit = 6): Promise<Product[]> {
  const [{ data }, flashSales] = await Promise.all([
    supabaseAdmin
      .from('products')
      .select(PRODUCT_COLUMNS)
      .match(ACTIVE_IN_STOCK)
      .gt('stock_quantity', 0)
      .not('id', 'in', `(${excludeIds.join(',') || '00000000-0000-0000-0000-000000000000'})`)
      .order('created_at', { ascending: false })
      .limit(limit),
    getActiveFlashSales(),
  ])
  return withSalePrice((data || []) as RawProduct[], flashSales)
}

/**
 * Products frequently bought together with the given product id(s), based
 * on real order co-purchase history. Falls back to same-category products
 * when there isn't enough order history yet (new store / new product).
 */
export async function getFrequentlyBoughtTogether(
  productIds: string[],
  excludeIds: string[],
  limit = 4,
  fallbackCategory?: string | null
): Promise<Product[]> {
  if (productIds.length === 0) return []
  const [{ data }, flashSales] = await Promise.all([
    supabaseAdmin.rpc('get_frequently_bought_together', { p_product_ids: productIds, p_limit: limit + excludeIds.length }),
    getActiveFlashSales(),
  ])
  const filtered = ((data || []) as RawProduct[]).filter((p) => !excludeIds.includes(p.id)).slice(0, limit)

  if (filtered.length >= limit || !fallbackCategory) return withSalePrice(filtered, flashSales)

  const seen = new Set([...excludeIds, ...filtered.map((p) => p.id)])
  const fallback = await getSameCategoryProducts(fallbackCategory, Array.from(seen), limit - filtered.length)
  return [...withSalePrice(filtered, flashSales), ...fallback]
}

/** Real average rating + review count per product, batched (replaces the old fake hash-based stars). */
export async function getProductRatings(productIds: string[]): Promise<Record<string, { average_rating: number; review_count: number }>> {
  if (productIds.length === 0) return {}
  const { data, error } = await supabaseAdmin.rpc('get_product_ratings', { p_product_ids: productIds })
  if (error || !data) return {}
  const map: Record<string, { average_rating: number; review_count: number }> = {}
  for (const row of data as { product_id: string; average_rating: number; review_count: number }[]) {
    map[row.product_id] = { average_rating: row.average_rating, review_count: row.review_count }
  }
  return map
}

export interface ProductRecommendations {
  same_category: Product[]
  frequently_bought_together: Product[]
  best_sellers: Product[]
  new_arrivals: Product[]
}

/**
 * Full sectioned recommendation set for a product detail page. Every
 * section already excludes the current product, and each subsequent
 * section also excludes anything already shown in an earlier section so
 * the same product doesn't repeat across rails. Bundle "collection"
 * products live under the same category as any other product, so viewing
 * one naturally surfaces the other bundles via same_category — no
 * separate collection concept needed.
 */
export async function getProductRecommendations(product: { id: string; category?: string | null }, limitPerSection = 6): Promise<ProductRecommendations> {
  const exclude = [product.id]

  const same_category = await getSameCategoryProducts(product.category, exclude, limitPerSection)
  exclude.push(...same_category.map((p) => p.id))

  const frequently_bought_together = await getFrequentlyBoughtTogether([product.id], exclude, 4, product.category)
  exclude.push(...frequently_bought_together.map((p) => p.id))

  const best_sellers = await getBestSellers(exclude, limitPerSection)
  exclude.push(...best_sellers.map((p) => p.id))

  const new_arrivals = await getNewArrivals(exclude, limitPerSection)

  return { same_category, frequently_bought_together, best_sellers, new_arrivals }
}
