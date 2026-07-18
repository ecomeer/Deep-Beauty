import { revalidatePath } from 'next/cache'

/**
 * Call after any admin mutation to products/categories/collections so the
 * ISR-cached storefront (home, /products, /collections, category & product
 * detail pages, sitemap) reflects the change immediately instead of waiting
 * out its `revalidate` window (previously up to 10 minutes, plus HTTP
 * stale-while-revalidate headers on the public API routes).
 */
export function revalidateStorefront() {
  revalidatePath('/')
  revalidatePath('/products')
  revalidatePath('/collections')
  revalidatePath('/offers')
  revalidatePath('/sitemap.xml')
}

export function revalidateProduct(slug?: string | null) {
  revalidateStorefront()
  if (slug) revalidatePath(`/products/${slug}`)
}

export function revalidateCollection(slug?: string | null) {
  revalidateStorefront()
  if (slug) revalidatePath(`/collections/${slug}`)
}
