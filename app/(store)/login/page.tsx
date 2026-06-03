import type { Metadata } from 'next'
import LoginClient from './LoginClient'

export const metadata: Metadata = {
  title: 'تسجيل الدخول | Deep Beauty',
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  return <LoginClient />
}
