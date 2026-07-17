import { createClient } from '@supabase/supabase-js'
import StitchHomeContent from '@/components/store/StitchHomeContent'
import { Product, Category } from '@/types'
import { getActiveFlashSales, bestDiscountForProduct, applyDiscount } from '@/lib/flash-sale'

interface Banner {
  id: string
  title_ar: string
  subtitle_ar: string | null
  image_url: string
  link_url: string
  is_active: boolean
  sort_order: number
}

export const revalidate = 300 // revalidate every 5 minutes (was 60s)

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

  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!sbUrl || !sbKey) {
    // During build/prerender without env vars, return empty data
  } else try {
    const supabase = createClient(sbUrl, sbKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const [productsRes, categoriesRes, bannersRes, settingRes, flashSales] = await withTimeout(
      Promise.all([
        supabase
          .from('products')
          .select('id, name_ar, name_en, slug, description_ar, description_en, price, compare_price, images, category, stock_quantity, is_active, is_featured, created_at, updated_at')
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
        getActiveFlashSales(),
      ]),
      12000
    )

    featuredProducts = (productsRes.data || []).map((p) => ({
      ...p,
      sale_price: applyDiscount(p.price, bestDiscountForProduct(p, flashSales)),
    }))
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
