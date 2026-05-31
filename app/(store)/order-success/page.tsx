import type { Metadata } from 'next'
import { Suspense } from 'react'
import OrderSuccessClient from './OrderSuccessClient'

export const metadata: Metadata = {
  title: 'تم استلام طلبك | Deep Beauty',
  robots: { index: false, follow: false },
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
