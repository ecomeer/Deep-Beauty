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
    <div className="flex min-h-screen bg-surface" dir="rtl">
      <Toaster position="top-center" toastOptions={{
        style: {
          fontFamily: 'var(--font-almarai), sans-serif',
          direction: 'rtl',
          borderRadius: 'var(--radius-md)',
          background: 'var(--white)',
          color: 'var(--on-surface)',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--beige)',
        },
        success: { iconTheme: { primary: 'var(--primary)', secondary: 'var(--white)' } },
      }} />
      <AdminSidebar />
      <main className="flex-1 overflow-x-hidden px-4 md:px-6 pt-20 pb-[calc(7.5rem+env(safe-area-inset-bottom))] md:pt-6 md:pb-10">
        <div className="flex justify-end mb-4">
          <PwaProvider />
        </div>
        {children}
      </main>
    </div>
  )
}
