import type { Metadata } from 'next'
import { cache } from 'react'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase-admin'
import EnhancedProductDetail from './EnhancedProductDetail'

const SITE_URL = 'https://www.deepbeautykw.com'

type Props = { params: Promise<{ slug: string }> }

function toAbsoluteUrl(value?: string | null) {
  if (!value) return null
  if (/^https?:\/\//i.test(value)) return value
  return new URL(value.startsWith('/') ? value : `/${value}`, SITE_URL).toString()
}

// Deduped per request: generateMetadata and the page share one DB query.
const getProductBySlug = cache(async (slug: string) => {
  const { data } = await supabaseAdmin
    .from('products')
    .select('name_ar, description_ar, images, image_alt, seo_title, meta_description, price, compare_price, stock_quantity')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()
  return data
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const data = await getProductBySlug(slug)

  if (!data) return { title: 'منتج | Deep Beauty' }

  const canonicalUrl = `${SITE_URL}/products/${slug}`
  const title = data.seo_title || `${data.name_ar} | Deep Beauty`
  const description = data.meta_description || data.description_ar || undefined
  const primaryImage = toAbsoluteUrl(data.images?.[0])

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      images: primaryImage
        ? [{ url: primaryImage, width: 1080, height: 1080, alt: data.image_alt || data.name_ar }]
        : [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: data.name_ar }],
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const data = await getProductBySlug(slug)

  if (!data) notFound()

  const absoluteImages = (data.images || [])
    .map((image) => toAbsoluteUrl(image))
    .filter((image): image is string => Boolean(image))

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: data.name_ar,
    description: data.meta_description || data.description_ar || undefined,
    image: absoluteImages,
    url: `${SITE_URL}/products/${slug}`,
    brand: { '@type': 'Brand', name: 'Deep Beauty' },
    offers: {
      '@type': 'Offer',
      price: data.price,
      priceCurrency: 'KWD',
      availability:
        (data.stock_quantity ?? 0) > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      url: `${SITE_URL}/products/${slug}`,
      seller: { '@type': 'Organization', name: 'Deep Beauty' },
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <EnhancedProductDetail />
    </>
  )
}
