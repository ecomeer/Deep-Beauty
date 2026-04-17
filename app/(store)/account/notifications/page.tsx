'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRightIcon, BellIcon } from '@heroicons/react/24/outline'

export default function AccountNotificationsPage() {
  const router = useRouter()

  useEffect(() => {
    fetch('/api/auth/me').then(r => { if (!r.ok) router.push('/login') })
  }, [router])

  return (
    <div className="min-h-screen" style={{ background: 'var(--off-white)', paddingTop: 'var(--nav-height)' }}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/account" className="w-9 h-9 rounded-xl bg-white flex items-center justify-center" style={{ border: '1px solid var(--beige)' }}>
            <ArrowRightIcon className="w-4 h-4" style={{ color: 'var(--text-dark)' }} />
          </Link>
          <h1 className="font-bold text-lg" style={{ color: 'var(--text-dark)' }}>الإشعارات</h1>
        </div>

        <div className="bg-white rounded-2xl p-10 text-center" style={{ border: '1px solid var(--beige)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--beige)' }}>
            <BellIcon className="w-8 h-8" style={{ color: 'var(--primary)' }} />
          </div>
          <h2 className="font-bold text-base mb-2" style={{ color: 'var(--text-dark)' }}>لا توجد إشعارات</h2>
          <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
            ستظهر هنا إشعارات طلباتك وعروضنا الحصرية
          </p>
        </div>
      </div>
    </div>
  )
}
