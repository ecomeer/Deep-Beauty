import type { Metadata } from 'next'
import { Suspense } from 'react'
import OrderSuccessClient from './OrderSuccessClient'

export const metadata: Metadata = {
  title: 'تم الطلب بنجاح | Deep Beauty',
  robots: { index: false, follow: false },
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">جاري التحميل...</div>}>
      <OrderSuccessClient />
    </Suspense>
  )
}
