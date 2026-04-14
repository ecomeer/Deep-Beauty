'use client'

import Link from 'next/link'
import { useState } from 'react'
import { CheckCircleIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'
import { PaymentIconsRow } from './PaymentIcons'

// ─── Social Icon Components ────────────────────────────────────────────────
function IconInstagram({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  )
}

function IconSnapchat({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.329 4.quale-.074.806.785.953 1.43.953.233 0 .481-.04.698-.121.104.177.104.406.104.406-.104.527-.715 1.02-1.456 1.144-.075.017-.155.026-.235.034-.174.018-.347.039-.51.069-.225.038-.425.109-.589.219-.384.243-.505.7-.457 1.148.122 1.134.578 2.138 1.116 2.986.276.439.589.826.93 1.145.253.238.521.44.799.592.252.14.506.251.764.334.258.083.466.14.665.178-.044.21-.122.535-.299.862-.198.375-.488.719-.873.979-.344.229-.734.399-1.175.503-.47.109-.971.131-1.497.063-.488-.063-.96-.197-1.37-.392-.423-.199-.793-.454-1.117-.745-.302-.271-.584-.576-.85-.878-.246-.278-.467-.553-.677-.816-.214-.266-.421-.517-.623-.744-.226-.254-.461-.46-.707-.606-.239-.143-.498-.225-.764-.225-.266 0-.525.082-.764.225-.246.146-.481.352-.707.606-.202.227-.409.478-.623.744-.21.263-.431.538-.677.816-.266.302-.548.607-.85.878-.324.291-.694.546-1.117.745-.41.195-.882.329-1.37.392-.526.068-1.027.046-1.497-.063-.441-.104-.831-.274-1.175-.503-.385-.26-.675-.604-.873-.979-.177-.327-.255-.652-.299-.862.199-.038.407-.095.665-.178.258-.083.512-.194.764-.334.278-.152.546-.354.799-.592.341-.319.654-.706.93-1.145.538-.848.994-1.852 1.116-2.986.048-.448-.073-.905-.457-1.148-.164-.11-.364-.181-.589-.219-.163-.03-.336-.051-.51-.069-.08-.008-.16-.017-.235-.034-.741-.124-1.352-.617-1.456-1.144 0 0 0-.229.104-.406.217.081.465.121.698.121.645 0 1.504-.147 1.43-.953-.074-1.001-.2-3.027.329-4.220C7.859 1.069 11.216.793 12.206.793z"/>
    </svg>
  )
}

function IconWhatsApp({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

function IconTikTok({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
    </svg>
  )
}

// ─── Footer Data ──────────────────────────────────────────────────────────
const STORE_LINKS = [
  { href: '/products', label: 'جميع المنتجات' },
  { href: '/products?category=سيروم', label: 'سيروم' },
  { href: '/products?category=عناية+بالبشرة', label: 'عناية بالبشرة' },
  { href: '/products?category=مقشرات', label: 'مقشرات' },
  { href: '/products?category=تونر', label: 'تونر' },
]

const SUPPORT_LINKS = [
  { href: '/faq', label: 'الأسئلة الشائعة' },
  { href: '/shipping', label: 'الشحن والاسترجاع' },
  { href: '/track', label: 'تتبع الطلب' },
  { href: '/privacy', label: 'سياسة الخصوصية' },
  { href: '/terms', label: 'شروط الخدمة' },
]

const SOCIAL = [
  { href: 'https://instagram.com', label: 'انستغرام', Icon: IconInstagram },
  { href: 'https://snapchat.com', label: 'سناب شات', Icon: IconSnapchat },
  { href: 'https://wa.me', label: 'واتساب', Icon: IconWhatsApp },
  { href: 'https://tiktok.com', label: 'تيك توك', Icon: IconTikTok },
]

export default function StitchFooter() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || loading) return
    setLoading(true)
    try {
      await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
    } catch {}
    setSubscribed(true)
    setEmail('')
    setLoading(false)
  }

  return (
    <footer style={{ background: 'var(--text-dark)', color: 'rgba(255,255,255,0.85)' }}>

      {/* ─── Main Grid ─── */}
      <div className="max-w-[var(--container-max)] mx-auto px-5 md:px-8 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8">

          {/* ── Brand Column ── */}
          <div className="md:col-span-4">
            <div className="mb-5">
              <img
                src="/logo.png"
                alt="Deep Beauty"
                style={{ height: '52px', objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 0.9 }}
              />
            </div>
            <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.6)' }}>
              ولدت في قلب الكويت بمهمة تقديم أرقى طقوس العناية بالبشرة. نجمع بين الحكمة العربية القديمة والعلوم الحديثة لمنتجات طبيعية 100٪.
            </p>

            {/* Social Links */}
            <div>
              <p className="text-[10px] uppercase tracking-widest font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
                تابعينا
              </p>
              <div className="flex items-center gap-2">
                {SOCIAL.map(({ href, label, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.65)',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLAnchorElement).style.background = 'var(--primary)'
                      ;(e.currentTarget as HTMLAnchorElement).style.color = 'white'
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.08)'
                      ;(e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.65)'
                    }}
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* ── Store Links ── */}
          <div className="md:col-span-2">
            <h5 className="text-xs uppercase tracking-widest font-bold mb-5" style={{ color: 'rgba(255,255,255,0.45)' }}>
              المتجر
            </h5>
            <ul className="space-y-3">
              {STORE_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm transition-colors"
                    style={{ color: 'rgba(255,255,255,0.6)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary-light)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Support Links ── */}
          <div className="md:col-span-2">
            <h5 className="text-xs uppercase tracking-widest font-bold mb-5" style={{ color: 'rgba(255,255,255,0.45)' }}>
              الدعم
            </h5>
            <ul className="space-y-3">
              {SUPPORT_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm transition-colors"
                    style={{ color: 'rgba(255,255,255,0.6)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary-light)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Newsletter ── */}
          <div className="md:col-span-4">
            <h5 className="text-xs uppercase tracking-widest font-bold mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
              النشرة البريدية
            </h5>
            <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.55)' }}>
              احصلي على أحدث العروض والمنتجات الجديدة مباشرة في بريدك.
            </p>

            {subscribed ? (
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
                style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80' }}
              >
                <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
                تم الاشتراك بنجاح! شكراً لكِ.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <label htmlFor="footer-newsletter-email" className="sr-only">
                  البريد الإلكتروني للاشتراك
                </label>
                <input
                  id="footer-newsletter-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="البريد الإلكتروني"
                  required
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'white',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.border = '1px solid var(--primary)'
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                  }}
                  onBlur={e => {
                    e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)'
                    e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
                  }}
                />
                <button
                  type="submit"
                  disabled={loading}
                  aria-label="اشتركي في النشرة"
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-50"
                  style={{ background: 'var(--primary)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--primary-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--primary)')}
                >
                  {loading ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <PaperAirplaneIcon className="w-4 h-4 text-white -rotate-45" />
                  )}
                </button>
              </form>
            )}

            {/* Trust Badges */}
            <div className="flex items-center gap-3 mt-5">
              {['🔒 دفع آمن', '🚚 شحن سريع', '✅ منتجات أصلية'].map((badge) => (
                <span
                  key={badge}
                  className="text-[10px] font-medium"
                  style={{ color: 'rgba(255,255,255,0.35)' }}
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Divider ─── */}
        <div
          className="my-10"
          style={{ height: '1px', background: 'rgba(255,255,255,0.08)' }}
        />

        {/* ─── Bottom Bar ─── */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            <p>© {new Date().getFullYear()} Deep Beauty. جميع الحقوق محفوظة.</p>
            <span aria-hidden="true">·</span>
            <p>صُنع بـ ❤️ في الكويت</p>
          </div>
          <PaymentIconsRow />
        </div>
      </div>
    </footer>
  )
}
