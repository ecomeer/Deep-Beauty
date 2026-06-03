import AdminSidebar from '@/components/admin/AdminSidebar'
import PwaProvider from '@/components/admin/PwaProvider'
import { Toaster } from 'react-hot-toast'

export const metadata = {
  manifest: '/manifest.json',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-[#faf7f4]" dir="rtl">
      <Toaster position="top-center" toastOptions={{
        style: {
          fontFamily: 'var(--font-almarai), sans-serif',
          direction: 'rtl',
          borderRadius: '12px',
        }
      }} />
      <AdminSidebar />
      <main className="flex-1 overflow-x-hidden px-4 md:px-6 pt-20 pb-24 md:pt-6 md:pb-10">
        <div className="flex justify-end mb-4">
          <PwaProvider />
        </div>
        {children}
      </main>
    </div>
  )
}
