import AdminSidebar from '@/components/admin/AdminSidebar'
import { Toaster } from 'react-hot-toast'

// Auth protection is handled by middleware.ts for all /admin/* routes except /admin/login

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-[#faf7f4]" dir="rtl">
      <Toaster position="top-center" toastOptions={{
        style: {
          fontFamily: 'Tajawal, sans-serif',
          direction: 'rtl',
          borderRadius: '12px',
        }
      }} />
      <AdminSidebar />
      <main className="flex-1 overflow-x-hidden pt-4 pb-10 px-6">
        {children}
      </main>
    </div>
  )
}
