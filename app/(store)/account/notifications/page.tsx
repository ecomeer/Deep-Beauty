'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRightIcon, BellIcon, CheckIcon, TruckIcon, TagIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { formatDateTime } from '@/lib/utils'

interface Notification {
  id: string
  type: string
  title_ar: string
  body_ar: string
  link: string | null
  is_read: boolean
  created_at: string
}

const TYPE_ICON: Record<string, React.ElementType> = {
  order_status: TruckIcon,
  promo: TagIcon,
  system: InformationCircleIcon,
}

export default function AccountNotificationsPage() {
  const router = useRouter()
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  async function loadNotifs() {
    const r = await fetch('/api/account/notifications')
    if (r.ok) { const d = await r.json(); setNotifs(d.notifications) }
    setLoading(false)
  }

  useEffect(() => {
    fetch('/api/auth/me').then(r => { if (!r.ok) router.push('/login') })
    loadNotifs()
  }, [router])

  async function markAllRead() {
    await fetch('/api/account/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  async function markRead(id: string) {
    if (notifs.find(n => n.id === id)?.is_read) return
    await fetch('/api/account/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: [id] }) })
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const unreadCount = notifs.filter(n => !n.is_read).length

  return (
    <div className="min-h-screen bg-surface pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/account" className="w-9 h-9 rounded-xl bg-white border border-outline-variant flex items-center justify-center">
              <ArrowRightIcon className="w-4 h-4 text-on-surface" />
            </Link>
            <h1 className="font-bold text-lg text-on-surface">
              الإشعارات
              {unreadCount > 0 && <span className="mr-2 text-xs bg-primary text-white px-2 py-0.5 rounded-full">{unreadCount}</span>}
            </h1>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs text-primary flex items-center gap-1">
              <CheckIcon className="w-3.5 h-3.5" />
              تحديد الكل كمقروء
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : notifs.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-outline-variant/50">
            <BellIcon className="w-10 h-10 text-on-surface-variant mx-auto mb-3" />
            <p className="font-bold text-sm mb-1 text-on-surface">لا توجد إشعارات</p>
            <p className="text-xs text-on-surface-variant">ستظهر هنا إشعارات طلباتك وعروضنا الحصرية</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifs.map(n => {
              const Icon = TYPE_ICON[n.type] ?? BellIcon
              const Wrapper = n.link ? Link : 'div'
              return (
                <Wrapper
                  key={n.id}
                  href={n.link || '#'}
                  onClick={() => markRead(n.id)}
                  className={`flex items-start gap-3 p-4 rounded-2xl border transition-colors cursor-pointer ${n.is_read ? 'bg-white border-outline-variant/30' : 'bg-primary/5 border-primary/20'}`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${n.is_read ? 'bg-surface-container' : 'bg-primary/15'}`}>
                    <Icon className={`w-4.5 h-4.5 ${n.is_read ? 'text-on-surface-variant' : 'text-primary'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${n.is_read ? 'text-on-surface' : 'text-on-surface'}`}>{n.title_ar}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{n.body_ar}</p>
                    <p className="text-xs text-on-surface-variant/60 mt-1">{formatDateTime(n.created_at)}</p>
                  </div>
                  {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />}
                </Wrapper>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
