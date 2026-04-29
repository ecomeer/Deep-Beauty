import { supabaseAdmin } from '@/lib/supabase-admin'

type PushPayload = {
  title: string
  body: string
  url?: string
}

export async function sendAdminPushNotification({
  title,
  body,
  url = '/admin/orders',
}: PushPayload): Promise<{ sent: number; total: number }> {
  if (!title || !body) {
    return { sent: 0, total: 0 }
  }

  const vapidSubject = process.env.VAPID_SUBJECT
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY

  if (!vapidSubject || !vapidPublicKey || !vapidPrivateKey) {
    return { sent: 0, total: 0 }
  }

  const webpush = await import('web-push')
  webpush.default.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)

  const { data: subscriptions } = await supabaseAdmin
    .from('push_subscriptions')
    .select('subscription')

  if (!subscriptions || subscriptions.length === 0) {
    return { sent: 0, total: 0 }
  }

  const payload = JSON.stringify({
    title,
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    url,
  })

  const results = await Promise.allSettled(
    subscriptions.map((row: { subscription: string }) => {
      const parsed = JSON.parse(row.subscription)
      return webpush.default.sendNotification(parsed, payload)
    })
  )

  const staleEndpoints: string[] = []
  results.forEach((result, i) => {
    if (
      result.status === 'rejected' &&
      typeof result.reason === 'object' &&
      result.reason !== null &&
      'statusCode' in result.reason &&
      (result.reason.statusCode === 410 || result.reason.statusCode === 404)
    ) {
      try {
        const parsed = JSON.parse(subscriptions[i].subscription)
        if (parsed?.endpoint) staleEndpoints.push(parsed.endpoint)
      } catch {
        // ignore parse errors
      }
    }
  })

  if (staleEndpoints.length > 0) {
    await supabaseAdmin
      .from('push_subscriptions')
      .delete()
      .in('endpoint', staleEndpoints)
  }

  return {
    sent: results.filter((result) => result.status === 'fulfilled').length,
    total: subscriptions.length,
  }
}
