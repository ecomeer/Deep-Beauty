const CACHE_NAME = 'deep-beauty-v3'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  // Clear all old caches
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
  )
  self.clients.claim()
})

// Push notifications
self.addEventListener('push', (event) => {
  let data = {
    title: 'Deep Beauty',
    body: 'إشعار جديد',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    url: '/admin/orders',
  }
  try {
    data = { ...data, ...event.data.json() }
  } catch (_) {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      dir: 'rtl',
      lang: 'ar',
      vibrate: [200, 100, 200],
      data: { url: data.url },
      actions: [
        { action: 'open', title: 'عرض' },
        { action: 'close', title: 'إغلاق' },
      ],
    })
  )
})

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/admin/orders'
  if (event.action === 'close') return
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if (client.url.includes('/admin') && 'focus' in client) {
            client.navigate(url)
            return client.focus()
          }
        }
        return self.clients.openWindow(url)
      })
  )
})
