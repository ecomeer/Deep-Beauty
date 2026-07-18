import { revalidatePath } from 'next/cache'

/**
 * Call after any admin mutation to products/categories so the ISR-cached
 * storefront (home, /products, category & product detail pages, sitemap)
 * reflects the change immediately instead of waiting out its `revalidate`
 * window (previously up to 10 minutes, plus HTTP stale-while-revalidate
 * headers on the public API routes).
 */
export function revalidateStorefront() {
  revalidatePath('/')
  revalidatePath('/products')
  revalidatePath('/offers')
  revalidatePath('/sitemap.xml')
}

export function revalidateProduct(slug?: string | null) {
  revalidateStorefront()
  if (slug) revalidatePath(`/products/${slug}`)
}
