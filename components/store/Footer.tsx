'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { PaperAirplaneIcon } from '@heroicons/react/24/solid'

export default function Footer() {
  const [whatsapp, setWhatsapp] = useState('96522289182')
  const [instagram, setInstagram] = useState('https://instagram.com/deepbeautykw')
  const [tiktok, setTiktok] = useState('')
  const [snapchat, setSnapchat] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.ok ? r.json() : null)
      .then((json: { settings: { key: string; value: string }[] } | null) => {
        if (!json?.settings) return
        for (const row of json.settings) {
          if (row.key === 'whatsapp_number' && row.value) setWhatsapp(row.value)
          if (row.key === 'instagram_url' && row.value) setInstagram(row.value)
          if (row.key === 'tiktok_url' && row.value) setTiktok(row.value)
          if (row.key === 'snapchat_url' && row.value) setSnapchat(row.value)
        }
      })
      .catch(() => {})
  }, [])

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    // Newsletter subscription logic
    alert('شكراً للاشتراك في النشرة البريدية!')
    setEmail('')
  }

  return (
    <footer className="bg-[#FFF5F7] text-gray-700">
      {/* Newsletter Section */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm">
          <div className="max-w-2xl">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
              اشترك في النشرة البريدية
            </h3>
            <p className="text-gray-500 mb-6">
              احصل على أحدث العروض والمنتجات الجديدة مباشرة في بريدك الإلكتروني.
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <input
                  type="email"
                  placeholder="البريد الإلكتروني"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-5 py-4 rounded-xl border border-gray-200 outline-none focus:border-[#FF6B9D] transition-colors text-gray-700 bg-gray-50"
                />
              </div>
              <button
                type="submit"
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-white transition-all hover:opacity-90"
                style={{ background: '#FF6B9D' }}
              >
                <PaperAirplaneIcon className="w-5 h-5" />
                <span className="sm:hidden">اشتراك</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <h2 className="text-3xl font-bold mb-4" style={{ color: '#FF6B9D' }}>بينكش</h2>
            <p className="text-sm leading-7 text-gray-500 mb-6">
              ولدت بينكش في قلب الكويت بمهمة تقديم أرقى طقوس العناية بالبشرة إلى دول الخليج. نحن نجمع بين الحكمة والتقنية...
            </p>
            {/* Social Links */}
            <div className="flex gap-3">
              <a href={instagram} target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all hover:opacity-80 bg-white shadow-sm text-gray-600"
              >
                IN
              </a>
              {tiktok && (
                <a href={tiktok} target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all hover:opacity-80 bg-white shadow-sm text-gray-600"
                >TK</a>
              )}
              {snapchat && (
                <a href={snapchat} target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all hover:opacity-80 bg-white shadow-sm text-gray-600"
                >SN</a>
              )}
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all hover:opacity-80 bg-white shadow-sm text-gray-600"
              >
                WA
              </a>
            </div>
          </div>

          {/* Links - Two Columns */}
          <div className="md:col-span-2 grid grid-cols-2 gap-8">
            {/* المتجر */}
            <div>
              <h4 className="font-bold mb-4 text-gray-800 text-lg">المتجر</h4>
              <ul className="space-y-3 text-sm text-gray-500">
                <li><Link href="/products?category=سيروم" className="hover:text-[#FF6B9D] transition-colors">سيروم</Link></li>
                <li><Link href="/products?category=عناية بالبشرة" className="hover:text-[#FF6B9D] transition-colors">عناية بالبشرة</Link></li>
                <li><Link href="/products?category=مقشرات" className="hover:text-[#FF6B9D] transition-colors">مقشرات</Link></li>
                <li><Link href="/products?category=تونر" className="hover:text-[#FF6B9D] transition-colors">تونر</Link></li>
              </ul>
            </div>

            {/* الدعم */}
            <div>
              <h4 className="font-bold mb-4 text-gray-800 text-lg">الدعم</h4>
              <ul className="space-y-3 text-sm text-gray-500">
                <li><Link href="/faq" className="hover:text-[#FF6B9D] transition-colors">الأسئلة الشائعة</Link></li>
                <li><Link href="/shipping" className="hover:text-[#FF6B9D] transition-colors">الشحن والاسترجاع</Link></li>
                <li><Link href="/privacy" className="hover:text-[#FF6B9D] transition-colors">سياسة الخصوصية</Link></li>
                <li><Link href="/terms" className="hover:text-[#FF6B9D] transition-colors">شروط الخدمة</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Methods & Copyright */}
      <div className="border-t border-gray-200 px-6 py-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Payment Icons */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">طرق الدفع:</span>
            <div className="flex gap-2">
              {/* KNet */}
              <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-[8px] font-bold">KNet</div>
              {/* Visa */}
              <div className="w-10 h-6 bg-gradient-to-r from-blue-800 to-blue-600 rounded flex items-center justify-center text-white text-[8px] font-bold">VISA</div>
              {/* Mastercard */}
              <div className="w-10 h-6 bg-gradient-to-r from-red-600 to-orange-500 rounded flex items-center justify-center text-white text-[8px] font-bold">MC</div>
            </div>
          </div>
          {/* Copyright */}
          <span className="text-xs text-gray-400">© 2025 بينكش · جميع الحقوق محفوظة</span>
        </div>
      </div>
    </footer>
  )
}
