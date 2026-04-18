import type { Metadata } from 'next'
import { Cormorant_Garamond, Tajawal, Almarai } from 'next/font/google'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

const tajawal = Tajawal({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-tajawal',
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" className={`${cormorant.variable} ${tajawal.variable} ${almarai.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#9C6644" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
