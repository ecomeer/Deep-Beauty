'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { XMarkIcon, GiftIcon, CheckCircleIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const DISMISS_KEY = 'deep-beauty-welcome-popup'
const DISMISS_DAYS = 30
const SHOW_DELAY_MS = 6000

interface Props {
  /** Coupon code revealed after subscribing (admin-configured; empty hides the code step). */
  couponCode?: string
}

/**
 * First-visit newsletter popup: appears once after a short delay, captures
 * the email via /api/newsletter, then reveals the welcome coupon code.
 * Dismissal (or subscribing) is remembered for 30 days. Never shows during
 * checkout to avoid interrupting purchases.
 */
export default function WelcomePopup({ couponCode }: Props) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const pathname = usePathname()
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const stamp = localStorage.getItem(DISMISS_KEY)
      if (stamp && Date.now() - Number(stamp) < DISMISS_DAYS * 86_400_000) return
    } catch { return }
    const timer = setTimeout(() => setOpen(true), SHOW_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') dismiss() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const dismiss = () => {
    setOpen(false)
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())) } catch {}
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) throw new Error()
      setSubscribed(true)
      try { localStorage.setItem(DISMISS_KEY, String(Date.now())) } catch {}
    } catch {
      toast.error('تعذّر الاشتراك — تأكدي من كتابة البريد بشكل صحيح')
    }
    setLoading(false)
  }

  const copyCode = async () => {
    if (!couponCode) return
    try {
      await navigator.clipboard.writeText(couponCode)
      toast.success('تم نسخ الكود 📋')
    } catch {}
  }

  // Never interrupt an active purchase
  if (!open || pathname?.startsWith('/checkout')) return null

  return (
    <div
      className="popup-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="عرض ترحيبي"
      onClick={(e) => { if (e.target === e.currentTarget) dismiss() }}
    >
      <div
        ref={dialogRef}
        className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-xl overflow-hidden animate-fadeInUp"
      >
        <button
          type="button"
          aria-label="إغلاق العرض"
          onClick={dismiss}
          className="absolute top-4 start-4 z-10 p-2 rounded-xl text-on-surface-variant hover:bg-beige transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        <div className="hero-gradient pt-10 pb-6 px-6 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary flex items-center justify-center shadow-primary mb-3">
            <GiftIcon className="w-7 h-7 text-white" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-bold font-headline text-on-surface">
            خصم ١٠٪ على أول طلب
          </h2>
          <p className="text-sm text-on-surface-variant mt-1.5">
            اشتركي في نشرتنا واحصلي على الكود فوراً
          </p>
        </div>

        <div className="p-6 pt-5">
          {subscribed ? (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 text-sm font-medium text-green-600">
                <CheckCircleIcon className="w-5 h-5" aria-hidden="true" />
                تمّ الاشتراك بنجاح
              </div>
              {couponCode ? (
                <button
                  type="button"
                  onClick={copyCode}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-dashed border-primary bg-primary/5 text-primary font-bold tracking-[0.2em] text-lg transition-colors hover:bg-primary/10"
                  aria-label={`نسخ كود الخصم ${couponCode}`}
                  dir="ltr"
                >
                  {couponCode}
                  <ClipboardDocumentIcon className="w-5 h-5" aria-hidden="true" />
                </button>
              ) : (
                <p className="text-sm text-on-surface-variant">ترقبي كود الخصم في بريدك خلال دقائق</p>
              )}
              <button type="button" onClick={dismiss} className="btn-primary w-full">
                تسوّقي الآن
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <label htmlFor="welcome-popup-email" className="sr-only">البريد الإلكتروني</label>
              <input
                id="welcome-popup-email"
                type="email"
                required
                autoComplete="email"
                spellCheck={false}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="بريدك الإلكتروني…"
                className="input-field"
              />
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'جارٍ الاشتراك…' : 'أرسلي لي الكود'}
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="w-full text-xs text-on-surface-variant hover:text-on-surface transition-colors py-1"
              >
                لا شكراً، أتابع التصفح
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
