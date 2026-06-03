import Navbar from '@/components/store/Navbar'
import StitchFooter from '@/components/store/StitchFooter'
import Analytics from '@/components/store/Analytics'
import { CartProvider } from '@/context/CartContext'
import { WishlistProvider } from '@/context/WishlistContext'
import { CountryProvider } from '@/context/CountryContext'
import { Toaster } from 'react-hot-toast'
import { createClient } from '@supabase/supabase-js'

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  // Fetch active categories for footer links
  let footerCategories: { id: string; name_ar: string; slug: string }[] = []
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    )
    const { data } = await supabase
      .from('categories')
      .select('id, name_ar, slug')
      .eq('is_active', true)
      .order('name_ar')
      .limit(8)
    footerCategories = data || []
  } catch {}

  return (
    <CartProvider>
      <WishlistProvider>
        <CountryProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:right-4 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-bold focus:text-white"
            style={{ background: 'var(--primary)' }}
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
          <StitchFooter categories={footerCategories} />
        </CountryProvider>
      </WishlistProvider>
    </CartProvider>
  )
}
