import Navbar from '@/components/store/Navbar'
import Footer from '@/components/store/Footer'
import { CartProvider } from '@/context/CartContext'
import { WishlistProvider } from '@/context/WishlistContext'
import { CountryProvider } from '@/context/CountryContext'
import { Toaster } from 'react-hot-toast'
import AnnouncementBanner from '@/components/store/AnnouncementBanner'

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <WishlistProvider>
        <CountryProvider>
          <Toaster position="top-center" toastOptions={{
            style: {
              fontFamily: 'Tajawal, sans-serif',
              direction: 'rtl',
              borderRadius: '12px',
            }
          }} />
          <AnnouncementBanner />
          <Navbar />
          <main className="pt-20">
            {children}
          </main>
          <Footer />
        </CountryProvider>
      </WishlistProvider>
    </CartProvider>
  )
}
