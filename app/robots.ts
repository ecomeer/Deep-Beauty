import type { MetadataRoute } from 'next'

const BASE_URL = 'https://www.deepbeautykw.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/account/',
          '/checkout',
          '/cart',
          '/wishlist',
          '/auth/',
          '/order-success',
          '/payment-failed',
          '/forgot-password',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
