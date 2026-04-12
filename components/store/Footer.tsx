'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'

export default function Footer() {
  const [whatsapp, setWhatsapp] = useState('96522289182')
  const [instagram, setInstagram] = useState('https://instagram.com/deepbeautykw')
  const [tiktok, setTiktok] = useState('')
  const [snapchat, setSnapchat] = useState('')

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

  return (
    <footer style={{ background: 'var(--text-dark)', color: 'rgba(255,255,255,0.85)' }}>
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <Image src="/logo.png" alt="Deep Beauty" width={200} height={200} className="object-contain" style={{ width: 'auto', height: '64px' }} />
          </div>
          <p className="text-sm leading-7 opacity-70 mb-5">
            عناية فاخرة بالبشرة مصنوعة في الكويت من أجود المكونات الطبيعية. جمالك يبدأ من الأعماق.
          </p>
          {/* Social Links */}
          <div className="flex gap-3">
            <a href={instagram} target="_blank" rel="noopener noreferrer"
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 hover:opacity-100 opacity-70"
              style={{ background: 'rgba(255,255,255,0.1)' }}
            >
              IN
            </a>
            {tiktok && (
              <a href={tiktok} target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 hover:opacity-100 opacity-70"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              >TK</a>
            )}
            {snapchat && (
              <a href={snapchat} target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 hover:opacity-100 opacity-70"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              >SN</a>
            )}
            <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer"
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 hover:opacity-100 opacity-70"
              style={{ background: 'rgba(255,255,255,0.1)' }}
            >
              WA
            </a>
          </div>
        </div>

        {/* Products */}
        <div>
          <h4 className="text-white font-bold mb-4 text-sm tracking-wide">المنتجات</h4>
          <ul className="space-y-2.5 text-sm opacity-70">
            {['السيروم', 'المرطبات', 'زيوت الوجه', 'العناية بالشعر', 'العروض'].map((item) => (
              <li key={item}>
                <Link href="/products" className="hover:opacity-100 transition-opacity">{item}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="text-white font-bold mb-4 text-sm tracking-wide">الشركة</h4>
          <ul className="space-y-2.5 text-sm opacity-70">
            <li><Link href="/about" className="hover:opacity-100 transition-opacity">من نحن</Link></li>
            <li><Link href="/track" className="hover:opacity-100 transition-opacity">تتبع طلبك</Link></li>
            <li><Link href="/terms" className="hover:opacity-100 transition-opacity">الشروط والأحكام</Link></li>
            <li><Link href="/privacy" className="hover:opacity-100 transition-opacity">سياسة الخصوصية</Link></li>
            <li><Link href="/returns" className="hover:opacity-100 transition-opacity">سياسة الاسترجاع</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div id="contact">
          <h4 className="text-white font-bold mb-4 text-sm tracking-wide">تواصل معنا</h4>
          <ul className="space-y-3 text-sm opacity-70">
            <li><a href={`tel:+${whatsapp}`} className="hover:opacity-100">+{whatsapp}</a></li>
            <li><a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="hover:opacity-100">واتساب</a></li>
            <li><a href="mailto:contact@deepbeauty.kw" className="hover:opacity-100">contact@deepbeauty.kw</a></li>
            <li>الكويت - المنقف، قطعة ٦، شارع ١٣</li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t px-6 py-5" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs opacity-50">
          <span>© 2025 Deep Beauty · جميع الحقوق محفوظة</span>
          <span>Designed by Media Trend</span>
        </div>
      </div>
    </footer>
  )
}
