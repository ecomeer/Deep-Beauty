import type { Metadata } from 'next'
import RegisterClient from './RegisterClient'

export const metadata: Metadata = {
  title: 'إنشاء حساب | Deep Beauty',
  robots: { index: false, follow: false },
}

export default function RegisterPage() {
  return <RegisterClient />
}
