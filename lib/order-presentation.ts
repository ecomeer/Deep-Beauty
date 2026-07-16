export const ORDER_ITEM_IMAGE_FALLBACK = '/images/product-placeholder.svg'

export interface SnapshotOrderItem {
  quantity?: number | null
  product_image_url?: string | null
  total_price?: number | null
}

export function getOrderItemImage(imageUrl?: string | null): string {
  return imageUrl?.trim() || ORDER_ITEM_IMAGE_FALLBACK
}

export function getOrderItemQuantityTotal(items: SnapshotOrderItem[] | null | undefined): number {
  return (items ?? []).reduce((sum, item) => sum + Number(item.quantity || 0), 0)
}

export interface HistoricalReorderItem {
  product_id?: string | null
  product_name_ar?: string | null
  quantity?: number | null
}

export interface CurrentReorderProduct {
  id: string
  name_ar: string
  name_en: string
  slug: string
  price: number
  images?: string[] | null
  stock_quantity?: number | null
  is_active?: boolean | null
}

export interface ReorderCartItem {
  id: string
  name_ar: string
  name_en: string
  slug: string
  price: number
  image: string
  quantity: number
}

export interface ReorderSkippedItem {
  name: string
  reason: string
}

export function buildReorderCart(
  historicalItems: HistoricalReorderItem[] | null | undefined,
  currentProducts: CurrentReorderProduct[] | null | undefined
): { added: ReorderCartItem[]; skipped: ReorderSkippedItem[] } {
  const requested = new Map<string, { quantity: number; historicalName: string }>()
  for (const item of historicalItems ?? []) {
    if (!item.product_id) continue
    const current = requested.get(item.product_id) ?? { quantity: 0, historicalName: item.product_name_ar || 'منتج سابق' }
    current.quantity += Number(item.quantity || 0)
    requested.set(item.product_id, current)
  }

  if (requested.size === 0) {
    return { added: [], skipped: [{ name: 'كل المنتجات', reason: 'لا يمكن ربط منتجات هذا الطلب بمنتجات حالية' }] }
  }

  const productMap = new Map((currentProducts ?? []).map((product) => [product.id, product]))
  const added: ReorderCartItem[] = []
  const skipped: ReorderSkippedItem[] = []

  for (const [productId, requestedItem] of requested) {
    const product = productMap.get(productId)
    if (!product) { skipped.push({ name: requestedItem.historicalName, reason: 'المنتج لم يعد متوفراً' }); continue }
    if (!product.is_active) { skipped.push({ name: product.name_ar, reason: 'المنتج غير نشط حالياً' }); continue }
    if ((product.stock_quantity ?? 0) <= 0) { skipped.push({ name: product.name_ar, reason: 'المنتج غير متوفر بالمخزون' }); continue }

    const quantity = Math.min(requestedItem.quantity, product.stock_quantity ?? 0)
    added.push({
      id: product.id,
      name_ar: product.name_ar,
      name_en: product.name_en,
      slug: product.slug,
      price: product.price,
      image: product.images?.[0] || '',
      quantity,
    })
    if (quantity < requestedItem.quantity) skipped.push({ name: product.name_ar, reason: `تمت إضافة ${quantity} فقط حسب المخزون الحالي` })
  }

  return { added, skipped }
}
