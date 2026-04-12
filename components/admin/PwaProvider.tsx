'use client'

import { useEffect, useState } from 'react'
import { BellIcon, BellSlashIcon } from '@heroicons/react/24/outline'

export default function PwaProvider() {
  const [notifStatus, setNotifStatus] = useState<NotificationPermission | 'unsupported'>('default')
  const [swReady, setSwReady] = useState(false)

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/admin/' })
        .then((reg) => {
          setSwReady(true)
          console.log('[SW] Registered', reg.scope)
        })
        .catch((err) => console.error('[SW] Registration failed', err))
    }

    // Set current notification permission state
    if (!('Notification' in window)) {
      setNotifStatus('unsupported')
    } else {
      setNotifStatus(Notification.permission)
    }
  }, [])

  const requestPermission = async () => {
    if (!('Notification' in window)) return
    const result = await Notification.requestPermission()
    setNotifStatus(result)

    if (result === 'granted' && swReady) {
      // Save subscription to server
      try {
        const reg = await navigator.serviceWorker.ready
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!vapidKey) return

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        })
        await fetch('/api/admin/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sub),
        })
        console.log('[PWA] Push subscription saved')
      } catch (err) {
        console.error('[PWA] Subscribe error', err)
      }
    }
  }

  if (notifStatus === 'unsupported') return null

  return (
    <button
      onClick={notifStatus === 'granted' ? undefined : requestPermission}
      title={notifStatus === 'granted' ? 'الإشعارات مفعّلة' : 'تفعيل إشعارات الطلبات'}
      className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all"
      style={{
        background: notifStatus === 'granted' ? 'rgba(34,197,94,0.1)' : 'rgba(156,102,68,0.1)',
        color: notifStatus === 'granted' ? '#16a34a' : 'var(--primary)',
        cursor: notifStatus === 'granted' ? 'default' : 'pointer',
      }}
    >
      {notifStatus === 'granted' ? (
        <><BellIcon className="w-4 h-4" /> الإشعارات مفعّلة</>
      ) : (
        <><BellSlashIcon className="w-4 h-4" /> تفعيل الإشعارات</>
      )}
    </button>
  )
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}
