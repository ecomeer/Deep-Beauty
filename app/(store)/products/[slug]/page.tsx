import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import EnhancedProductDetail from './EnhancedProductDetail'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('products')
    .select('name_ar, description_ar, images')
    .eq('slug', slug)
    .single()

  if (!data) return { title: 'منتج | Deep Beauty' }

  const canonicalUrl = `https://www.deepbeautykw.com/products/${slug}`

  return {
    title: `${data.name_ar} | Deep Beauty`,
    description: data.description_ar ?? undefined,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${data.name_ar} | Deep Beauty`,
      description: data.description_ar ?? undefined,
      url: canonicalUrl,
      images: data.images?.[0]
        ? [{ url: data.images[0], width: 800, height: 800, alt: data.name_ar }]
        : [{ url: 'https://www.deepbeautykw.com/og-image.jpg', width: 1200, height: 630 }],
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('products')
    .select('name_ar, description_ar, images, price, sale_price, stock_quantity')
    .eq('slug', slug)
    .single()

  const jsonLd = data
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: data.name_ar,
        description: data.description_ar ?? undefined,
        image: data.images ?? [],
        url: `https://www.deepbeautykw.com/products/${slug}`,
        brand: { '@type': 'Brand', name: 'Deep Beauty' },
        offers: {
          '@type': 'Offer',
          price: data.sale_price ?? data.price,
          priceCurrency: 'KWD',
          availability:
            (data.stock_quantity ?? 1) > 0
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          url: `https://www.deepbeautykw.com/products/${slug}`,
          seller: { '@type': 'Organization', name: 'Deep Beauty' },
        },
      }
    : null

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <EnhancedProductDetail />
    </>
  )
}
