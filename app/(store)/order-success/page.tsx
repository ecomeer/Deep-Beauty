import type { Metadata } from 'next'
import { Suspense } from 'react'
import OrderSuccessClient from './OrderSuccessClient'

export const metadata: Metadata = {
  title: 'تم الطلب بنجاح | Deep Beauty',
  robots: { index: false },
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 rounded-full border-4" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
      </div>
    }>
      <OrderSuccessClient />
    </Suspense>
  )
}
