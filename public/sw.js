const CACHE_NAME = 'deep-beauty-admin-v1'
const OFFLINE_URL = '/admin/dashboard'

// Install — cache offline page
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll([OFFLINE_URL, '/manifest.json'])
    )
  )
  self.skipWaiting()
})

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch — network first, fallback to cache
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  )
})

// Push notifications
self.addEventListener('push', (event) => {
  let data = { title: 'Deep Beauty', body: 'إشعار جديد', icon: '/icon-192.png', badge: '/icon-192.png', url: '/admin/orders' }
  try { data = { ...data, ...event.data.json() } } catch (_) {}

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

// Notification click — open the relevant admin page
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/admin/orders'

  if (event.action === 'close') return

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
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
