import type { Metadata } from 'next'
import EnhancedCheckoutPage from './EnhancedCheckoutPage'

export const metadata: Metadata = {
  title: 'إتمام الطلب | Deep Beauty',
  robots: { index: false, follow: false },
}

export default function CheckoutPage() {
  return <EnhancedCheckoutPage />
}
