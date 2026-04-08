import Navbar from '@/components/store/Navbar'
import Footer from '@/components/store/Footer'
import { CartProvider } from '@/context/CartContext'
import { Toaster } from 'react-hot-toast'
import AnnouncementBanner from '@/components/store/AnnouncementBanner'

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
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
    </CartProvider>
  )
}
