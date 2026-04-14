'use client'

import Link from 'next/link'
import { useState } from 'react'
import { CheckCircleIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'

export default function StitchFooter() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    try {
      await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
    } catch {}
    setSubscribed(true)
    setEmail('')
  }

  return (
    <footer style={{ background: '#f7ede3' }}>
      {/* Main content */}
      <div className="max-w-7xl mx-auto px-6 py-14">

        {/* Top row: brand | store links | support links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-12">

          {/* Brand */}
          <div>
            <div className="mb-4 h-12 flex items-center">
              <img src="/logo.png" alt="Deep Beauty" style={{ height: '48px', objectFit: 'contain' }} />
            </div>
            <p className="text-sm leading-relaxed" style={{ color: '#7a5e4f' }}>
              ولدت في قلب الكويت بمهمة تقديم أرقى طقوس العناية بالبشرة إلى دول الخليج. نحن نجمع بين الحكمة العربية القديمة والعلوم الحديثة.
            </p>
          </div>

          {/* Store links */}
          <div>
            <h5 className="font-bold mb-5 text-base" style={{ color: 'var(--text-dark)' }}>المتجر</h5>
            <ul className="space-y-3 text-sm" style={{ color: '#7a5e4f' }}>
              <li><Link href="/products?category=سيروم" className="hover:text-[#9C6644] transition-colors">سيروم</Link></li>
              <li><Link href="/products?category=عناية+بالبشرة" className="hover:text-[#9C6644] transition-colors">عناية بالبشرة</Link></li>
              <li><Link href="/products?category=مقشرات" className="hover:text-[#9C6644] transition-colors">مقشرات</Link></li>
              <li><Link href="/products?category=تونر" className="hover:text-[#9C6644] transition-colors">تونر</Link></li>
            </ul>
          </div>

          {/* Support links */}
          <div>
            <h5 className="font-bold mb-5 text-base" style={{ color: 'var(--text-dark)' }}>الدعم</h5>
            <ul className="space-y-3 text-sm" style={{ color: '#7a5e4f' }}>
              <li><Link href="/faq" className="hover:text-[#9C6644] transition-colors">الأسئلة الشائعة</Link></li>
              <li><Link href="/shipping" className="hover:text-[#9C6644] transition-colors">الشحن والاسترجاع</Link></li>
              <li><Link href="/privacy" className="hover:text-[#9C6644] transition-colors">سياسة الخصوصية</Link></li>
              <li><Link href="/terms" className="hover:text-[#9C6644] transition-colors">شروط الخدمة</Link></li>
            </ul>
          </div>
        </div>

        {/* Newsletter card */}
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <h3 className="text-xl font-bold mb-2 text-center" style={{ color: 'var(--text-dark)' }}>
            اشترك في النشرة البريدية
          </h3>
          <p className="text-sm text-center mb-6" style={{ color: '#7a5e4f' }}>
            احصل على أحدث العروض والمنتجات الجديدة مباشرة في بريدك الإلكتروني.
          </p>
          {subscribed ? (
            <div className="flex items-center justify-center gap-2 py-3">
              <CheckCircleIcon className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--primary)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--primary)' }}>تم الاشتراك بنجاح! شكراً لك.</span>
            </div>
          ) : (
            <form className="flex gap-3 max-w-md mx-auto" onSubmit={handleSubscribe}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="البريد الإلكتروني"
                required
                className="flex-1 px-4 py-3 rounded-xl border outline-none text-sm"
                style={{ borderColor: 'var(--beige)', color: 'var(--text-dark)' }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--beige)')}
              />
              <button
                type="submit"
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-opacity hover:opacity-90"
                style={{ background: 'var(--primary)' }}
                aria-label="اشترك"
              >
                <PaperAirplaneIcon className="w-5 h-5 text-white -rotate-45" />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid rgba(156,102,68,0.2)' }}>
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-xs" style={{ color: '#9a7a6a' }}>
            <p>جميع الحقوق محفوظة © 2024 Deep Beauty</p>
            <div className="flex items-center gap-3">
              <span className="font-bold tracking-wider text-sm" style={{ color: '#1a1f71' }}>VISA</span>
              <span className="font-bold text-sm" style={{ color: '#eb001b' }}>MC</span>
              <span className="font-bold text-sm" style={{ color: '#00a651' }}>K-net</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
