import Navbar from '@/components/store/Navbar'
import StitchFooter from '@/components/store/StitchFooter'
import { CartProvider } from '@/context/CartContext'
import { WishlistProvider } from '@/context/WishlistContext'
import { CountryProvider } from '@/context/CountryContext'
import { Toaster } from 'react-hot-toast'

export default function StoreLayout({ children }: { children: React.ReactNode }) {
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
              fontFamily: 'var(--font-almarai), var(--font-tajawal), sans-serif',
              direction: 'rtl',
              borderRadius: '12px',
            }
          }} />
          <Navbar />
          <main id="main-content">
            {children}
          </main>
          <StitchFooter />
        </CountryProvider>
      </WishlistProvider>
    </CartProvider>
  )
}
