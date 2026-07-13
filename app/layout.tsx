import type { Metadata } from 'next'
import { Cormorant_Garamond, Almarai } from 'next/font/google'
import { unstable_cache } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase-admin'
import Pixels from '@/components/Pixels'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

const almarai = Almarai({
  subsets: ['arabic'],
  weight: ['300', '400', '700'],
  variable: '--font-almarai',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://www.deepbeautykw.com'),
  title: 'Deep Beauty | ديب بيوتي — جمالك يبدأ من الأعماق',
  description: 'متجر ديب بيوتي — عناية فاخرة بالبشرة مصنوعة في الكويت. منتجات طبيعية 100% للبشرة الصحية المشرقة.',
  keywords: 'ديب بيوتي, عناية بالبشرة, الكويت, منتجات طبيعية, سيروم, مرطب, زيت وجه, كريم ترطيب بشرة الكويت, واقي شمس SPF الكويت',
  alternates: { canonical: 'https://www.deepbeautykw.com' },
  openGraph: {
    title: 'Deep Beauty | ديب بيوتي — جمالك يبدأ من الأعماق',
    description: 'عناية فاخرة بالبشرة مصنوعة في الكويت. منتجات طبيعية 100% للبشرة الصحية المشرقة.',
    url: 'https://www.deepbeautykw.com',
    siteName: 'Deep Beauty',
    locale: 'ar_KW',
    type: 'website',
    images: [
      {
        url: 'https://www.deepbeautykw.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Deep Beauty — عناية فاخرة بالبشرة من الكويت',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Deep Beauty | ديب بيوتي',
    description: 'عناية فاخرة بالبشرة مصنوعة في الكويت',
    images: ['https://www.deepbeautykw.com/og-image.jpg'],
  },
}

// Cached at the data layer (not per-request) so every page render doesn't
// hit the DB — pixel IDs change rarely, a 5-minute staleness window mirrors
// the public /api/settings endpoint's own cache header.
const getPixelSettings = unstable_cache(
  async () => {
    try {
      const { data } = await supabaseAdmin
        .from('settings')
        .select('key, value')
        .in('key', ['meta_pixel_id', 'snap_pixel_id', 'gtm_id'])
      const map = Object.fromEntries((data || []).map((r) => [r.key, r.value]))
      return {
        metaPixelId: map.meta_pixel_id || null,
        snapPixelId: map.snap_pixel_id || null,
        gtmId: map.gtm_id || null,
      }
    } catch {
      return { metaPixelId: null, snapPixelId: null, gtmId: null }
    }
  },
  ['pixel-settings'],
  { revalidate: 300 }
)

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { metaPixelId, snapPixelId, gtmId } = await getPixelSettings()

  return (
    <html lang="ar" dir="rtl" className={`${cormorant.variable} ${almarai.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#8B5E3C" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        {/* hreflang */}
        <link rel="alternate" hrefLang="ar-KW" href="https://www.deepbeautykw.com/" />
        <link rel="alternate" hrefLang="ar" href="https://www.deepbeautykw.com/" />
        <link rel="alternate" hrefLang="x-default" href="https://www.deepbeautykw.com/" />
        {/* preconnect */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://flagcdn.com" />
      </head>
      <body suppressHydrationWarning>
        <Pixels metaPixelId={metaPixelId} snapPixelId={snapPixelId} gtmId={gtmId} />
        {children}
      </body>
    </html>
  )
}
