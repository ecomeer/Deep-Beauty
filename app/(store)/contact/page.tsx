import type { Metadata } from 'next'
import ContactClient from './ContactClient'

export const metadata: Metadata = {
  title: 'تواصلي معنا | Deep Beauty',
  description: 'تواصلي مع فريق Deep Beauty عبر واتساب أو البريد الإلكتروني. نحن هنا للإجابة على أسئلتك.',
  alternates: { canonical: 'https://www.deepbeautykw.com/contact' },
}

export default function ContactPage() {
  return <ContactClient />
}
