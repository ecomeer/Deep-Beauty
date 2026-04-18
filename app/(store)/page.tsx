import { createServerSupabaseClient } from '@/lib/supabase-server'
import StitchHomeContent from '@/components/store/StitchHomeContent'
import { Product, Category } from '@/types'

interface Banner {
  id: string
  title_ar: string
  subtitle_ar: string | null
  image_url: string
  link_url: string
  is_active: boolean
  sort_order: number
}

export const revalidate = 60 // revalidate every 60 seconds

// Timeout wrapper to prevent infinite loading
function withTimeout<T>(promise: Promise<T>, ms = 5000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout')), ms)
    ),
  ])
}

export default async function HomePage() {
  let featuredProducts: Product[] = []
  let categories: Category[] = []
  let banners: Banner[] = []
  let announcementText = '🚚 شحن مجاني للطلبات فوق ٢٠ د.ك'

  try {
    const supabase = await createServerSupabaseClient()

    const [productsRes, categoriesRes, bannersRes, settingRes] = await withTimeout(
      Promise.all([
        supabase
          .from('products')
          .select('*')
          .eq('is_featured', true)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(8),
        supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(4),
        supabase
          .from('banners')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
        supabase
          .from('settings')
          .select('value')
          .eq('key', 'announcement_text')
          .maybeSingle(),
      ]),
      12000
    )

    featuredProducts = productsRes.data || []
    categories = categoriesRes.data || []
    banners = bannersRes.data || []
    if (settingRes.data?.value) announcementText = settingRes.data.value
  } catch (e) {
    console.error('Failed to fetch home data:', e)
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://www.deepbeautykw.com/#organization',
        name: 'Deep Beauty',
        url: 'https://www.deepbeautykw.com',
        logo: 'https://www.deepbeautykw.com/icon-192.png',
        description: 'متجر عناية فاخرة بالبشرة — منتجات طبيعية 100% من الكويت',
        address: { '@type': 'PostalAddress', addressCountry: 'KW' },
        sameAs: [
          'https://instagram.com/deepbeautykw',
          'https://tiktok.com/@deepbeautykw',
          'https://snapchat.com/add/deepbeautykw',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': 'https://www.deepbeautykw.com/#website',
        url: 'https://www.deepbeautykw.com',
        name: 'Deep Beauty | ديب بيوتي',
        inLanguage: 'ar',
        publisher: { '@id': 'https://www.deepbeautykw.com/#organization' },
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://www.deepbeautykw.com/products?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Store',
        '@id': 'https://www.deepbeautykw.com/#store',
        name: 'Deep Beauty',
        url: 'https://www.deepbeautykw.com',
        image: 'https://www.deepbeautykw.com/og-image.jpg',
        description: 'متجر عناية فاخرة بالبشرة — منتجات طبيعية 100% مصنوعة في الكويت',
        priceRange: '$$',
        currenciesAccepted: 'KWD',
        paymentAccepted: 'Credit Card, Debit Card, Apple Pay, K-Net',
        address: { '@type': 'PostalAddress', addressCountry: 'KW', addressRegion: 'Kuwait' },
        parentOrganization: { '@id': 'https://www.deepbeautykw.com/#organization' },
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <StitchHomeContent
        featuredProducts={featuredProducts}
        categories={categories}
        banners={banners}
        announcementText={announcementText}
      />
    </>
  )
}
