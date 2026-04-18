import type { MetadataRoute } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const BASE_URL = 'https://www.deepbeautykw.com'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/products`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/shipping`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/returns`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/track`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/login`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/register`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]

  let dynamicRoutes: MetadataRoute.Sitemap = []
  try {
    const supabase = await createServerSupabaseClient()
    const [{ data: products }, { data: categories }] = await Promise.all([
      supabase.from('products').select('slug, updated_at').eq('is_active', true),
      supabase.from('categories').select('slug, updated_at').eq('is_active', true),
    ])

    const productRoutes: MetadataRoute.Sitemap = (products ?? []).map((p: { slug: string; updated_at: string | null }) => ({
      url: `${BASE_URL}/products/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }))

    const categoryRoutes: MetadataRoute.Sitemap = (categories ?? []).map((c: { slug: string; updated_at: string | null }) => ({
      url: `${BASE_URL}/products?category=${c.slug}`,
      lastModified: c.updated_at ? new Date(c.updated_at) : now,
      changeFrequency: 'weekly',
      priority: 0.7,
    }))

    dynamicRoutes = [...productRoutes, ...categoryRoutes]
  } catch (e) {
    console.error('sitemap: failed to fetch dynamic routes', e)
  }

  return [...staticRoutes, ...dynamicRoutes]
}
