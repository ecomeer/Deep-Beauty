import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Deep Beauty | ديب بيوتي — جمالك يبدأ من الأعماق',
  description: 'متجر ديب بيوتي — عناية فاخرة بالبشرة مصنوعة في الكويت. منتجات طبيعية 100% للبشرة الصحية المشرقة.',
  keywords: 'ديب بيوتي, عناية بالبشرة, الكويت, منتجات طبيعية, سيروم, مرطب, زيت وجه',
  openGraph: {
    title: 'Deep Beauty | ديب بيوتي',
    description: 'عناية فاخرة بالبشرة مصنوعة في الكويت',
    locale: 'ar_KW',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#9C6644" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="preload"
          as="style"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Tajawal:wght@400;500;700&display=swap"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Tajawal:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
