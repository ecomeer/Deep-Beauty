import Navbar from '@/components/store/Navbar'
import StitchFooter from '@/components/store/StitchFooter'
import WhatsAppButton from '@/components/store/WhatsAppButton'
import Analytics from '@/components/store/Analytics'
import { CartProvider } from '@/context/CartContext'
import { WishlistProvider } from '@/context/WishlistContext'
import { CountryProvider } from '@/context/CountryContext'
import { Toaster } from 'react-hot-toast'
import { createClient } from '@supabase/supabase-js'
import { EXCHANGE_RATE_SETTING_KEYS, parseExchangeRateSettings, type ExchangeRates } from '@/lib/currency'

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  // Fetch active categories for footer links + admin-managed exchange rates
  let footerCategories: { id: string; name_ar: string; slug: string }[] = []
  let exchangeRates: ExchangeRates | undefined
  let socialSettings: Record<string, string> = {}
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (sbUrl && sbKey) {
    try {
      const supabase = createClient(sbUrl, sbKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
      const [{ data }, { data: rateRows }, { data: socialRows }] = await Promise.all([
        supabase
          .from('categories')
          .select('id, name_ar, slug')
          .eq('is_active', true)
          .order('name_ar')
          .limit(8),
        supabase
          .from('settings')
          .select('key, value')
          .in('key', Object.keys(EXCHANGE_RATE_SETTING_KEYS)),
        supabase
          .from('settings')
          .select('key, value')
          .in('key', ['whatsapp_number', 'instagram_url', 'tiktok_url', 'snapchat_url']),
      ])
      footerCategories = data || []
      exchangeRates = parseExchangeRateSettings(rateRows)
      socialSettings = Object.fromEntries((socialRows || []).map((r) => [r.key, r.value]))
    } catch {}
  }

  return (
    <CartProvider>
      <WishlistProvider>
        <CountryProvider initialRates={exchangeRates}>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:right-4 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-bold focus:text-white bg-primary"
          >
            تخطي إلى المحتوى الرئيسي
          </a>
          <Toaster position="top-center" toastOptions={{
            style: {
              fontFamily: 'var(--font-almarai), sans-serif',
              direction: 'rtl',
              borderRadius: '12px',
            }
          }} />
          <Analytics />
          <Navbar />
          <main id="main-content">
            {children}
          </main>
          <StitchFooter categories={footerCategories} social={socialSettings} />
          <WhatsAppButton whatsappNumber={socialSettings.whatsapp_number} />
        </CountryProvider>
      </WishlistProvider>
    </CartProvider>
  )
}
