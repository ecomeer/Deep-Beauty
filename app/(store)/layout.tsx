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
          <Toaster position="top-center" toastOptions={{
            style: {
              fontFamily: 'var(--font-almarai), var(--font-tajawal), sans-serif',
              direction: 'rtl',
              borderRadius: '12px',
            }
          }} />
          <Navbar />
          <main>
            {children}
          </main>
          <StitchFooter />
        </CountryProvider>
      </WishlistProvider>
    </CartProvider>
  )
}
