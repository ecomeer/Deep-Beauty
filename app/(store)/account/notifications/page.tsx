'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowPathIcon,
  ArrowRightIcon,
  BellIcon,
  CheckIcon,
  InformationCircleIcon,
  TagIcon,
  TruckIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
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
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)

  const loadNotifications = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const response = await fetch('/api/account/notifications', { cache: 'no-store' })
      if (response.status === 401) {
        router.replace('/login')
        return
      }
      if (!response.ok) throw new Error('Failed to load notifications')
      const data = await response.json()
      setNotifications(data.notifications || [])
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  async function updateRead(ids?: string[]) {
    const response = await fetch('/api/account/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ids ? { ids } : {}),
    })
    if (!response.ok) throw new Error('تعذر تحديث الإشعارات')
  }

  async function markAllRead() {
    setMarkingAll(true)
    try {
      await updateRead()
      setNotifications((current) => current.map((item) => ({ ...item, is_read: true })))
    } catch {
      toast.error('تعذر تحديد الإشعارات كمقروءة')
    } finally {
      setMarkingAll(false)
    }
  }

  async function markRead(id: string) {
    if (notifications.find((item) => item.id === id)?.is_read) return
    try {
      await updateRead([id])
      setNotifications((current) => current.map((item) => (
        item.id === id ? { ...item, is_read: true } : item
      )))
    } catch {
      toast.error('تعذر تحديث الإشعار')
    }
  }

  const unreadCount = notifications.filter((item) => !item.is_read).length

  return (
    <main className="min-h-screen bg-surface pb-16 pt-[var(--nav-height)]">
      <header className="border-b border-outline-variant/50 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-4 sm:py-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/account"
              aria-label="العودة إلى حسابي"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-outline-variant/60"
            >
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <div className="min-w-0">
              <h1 className="flex items-center gap-2 text-xl font-bold text-on-surface">
                الإشعارات
                {unreadCount > 0 && <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-white">{unreadCount}</span>}
              </h1>
              <p className="mt-0.5 text-xs text-on-surface-variant">تحديثات الطلبات والعروض</p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              disabled={markingAll}
              onClick={markAllRead}
              className="flex min-h-10 shrink-0 items-center gap-1 rounded-xl px-2 text-xs font-bold text-primary disabled:opacity-60 sm:px-3"
            >
              {markingAll ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <CheckIcon className="h-4 w-4" />}
              <span className="hidden sm:inline">تحديد الكل كمقروء</span>
              <span className="sm:hidden">قراءة الكل</span>
            </button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-5 sm:py-8">
        {loading ? (
          <div className="space-y-2" aria-label="جارٍ تحميل الإشعارات">
            {[0, 1, 2].map((item) => <div key={item} className="h-24 animate-pulse rounded-2xl bg-white" />)}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
            <p className="font-bold text-on-surface">تعذر تحميل الإشعارات</p>
            <button type="button" onClick={loadNotifications} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white">
              <ArrowPathIcon className="h-4 w-4" />
              إعادة المحاولة
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-2xl border border-outline-variant/50 bg-white p-10 text-center">
            <BellIcon className="mx-auto mb-3 h-10 w-10 text-on-surface-variant" />
            <p className="text-sm font-bold text-on-surface">لا توجد إشعارات</p>
            <p className="mt-1 text-xs text-on-surface-variant">ستظهر هنا تحديثات طلباتك وعروضنا.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => {
              const Icon = TYPE_ICON[notification.type] ?? BellIcon
              const content = (
                <>
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${notification.is_read ? 'bg-surface' : 'bg-primary/15'}`}>
                    <Icon className={`h-[18px] w-[18px] ${notification.is_read ? 'text-on-surface-variant' : 'text-primary'}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-on-surface">{notification.title_ar}</p>
                    <p className="mt-1 text-xs leading-5 text-on-surface-variant">{notification.body_ar}</p>
                    <time className="mt-1 block text-[11px] text-on-surface-variant/70">{formatDateTime(notification.created_at)}</time>
                  </div>
                  {!notification.is_read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="غير مقروء" />}
                </>
              )
              const className = `flex min-h-24 items-start gap-3 rounded-2xl border p-4 text-right transition-colors ${
                notification.is_read ? 'border-outline-variant/30 bg-white' : 'border-primary/20 bg-primary/5'
              }`

              return notification.link ? (
                <Link key={notification.id} href={notification.link} onClick={() => markRead(notification.id)} className={className}>
                  {content}
                </Link>
              ) : (
                <button key={notification.id} type="button" onClick={() => markRead(notification.id)} className={`${className} w-full`}>
                  {content}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
