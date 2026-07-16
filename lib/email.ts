import { STATUS_LABELS, toArabicPrice, formatDateTime } from '@/lib/utils'
import { CONTACT_INFO } from '@/lib/contact'

// Email delivery via the Resend REST API (no SDK dependency).
// Both RESEND_API_KEY and EMAIL_FROM must be configured. Requiring an explicit
// sender prevents production from silently falling back to an unverified domain
// and returning Resend 403 errors.

const RESEND_API_URL = 'https://api.resend.com/emails'

export interface SendEmailResult {
  sent: boolean
  error?: string
}

export async function sendEmail(params: {
  to: string
  subject: string
  html: string
}): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not configured — email skipped:', params.subject)
    return { sent: false, error: 'not_configured' }
  }

  const from = process.env.EMAIL_FROM?.trim()
  if (!from) {
    console.error('[email] EMAIL_FROM not configured — email skipped:', params.subject)
    return { sent: false, error: 'from_not_configured' }
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to: params.to, subject: params.subject, html: params.html }),
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error('[email] Resend error', res.status, body.slice(0, 500))
      return { sent: false, error: `resend_${res.status}` }
    }

    return { sent: true }
  } catch (err) {
    console.error('[email] send failed:', err)
    return { sent: false, error: 'network' }
  }
}

// ─── Arabic RTL templates ──────────────────────────────────────────

interface OrderEmailData {
  order_number: string
  customer_name?: string | null
  total: number
  subtotal?: number | null
  shipping_cost?: number | null
  coupon_discount?: number | null
  status?: string | null
  created_at?: string | null
}

interface OrderEmailItem {
  product_name_ar?: string | null
  quantity: number
  total_price: number
}

function emailShell(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<body style="margin:0;padding:0;background:#F5EBE0;font-family:Tahoma,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
    <div style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #E8DED1;">
      <div style="background:#8B6F5C;color:#fff;padding:20px 24px;text-align:center;">
        <div style="font-size:22px;font-weight:bold;">Deep Beauty | ديب بيوتي</div>
        <div style="font-size:14px;opacity:.85;margin-top:4px;">${title}</div>
      </div>
      <div style="padding:24px;color:#3d3d3d;font-size:15px;line-height:1.8;">
        ${bodyHtml}
      </div>
      <div style="padding:16px 24px;background:#FAF6F1;border-top:1px solid #E8DED1;font-size:12px;color:#8a8a8a;text-align:center;">
        ${CONTACT_INFO.location} · ${CONTACT_INFO.phone} · ${CONTACT_INFO.email}
      </div>
    </div>
  </div>
</body>
</html>`
}

function itemsTable(items: OrderEmailItem[]): string {
  if (!items.length) return ''
  const rows = items
    .map(
      (item) => `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">${item.product_name_ar ?? ''} × ${item.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:left;direction:ltr;">${toArabicPrice(item.total_price)}</td>
      </tr>`
    )
    .join('')
  return `<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">${rows}</table>`
}

function totalsBlock(order: OrderEmailData): string {
  const line = (label: string, value: string, bold = false) =>
    `<tr><td style="padding:4px 12px;${bold ? 'font-weight:bold;font-size:16px;' : ''}">${label}</td>
     <td style="padding:4px 12px;text-align:left;direction:ltr;${bold ? 'font-weight:bold;font-size:16px;' : ''}">${value}</td></tr>`

  let rows = ''
  if (order.subtotal != null) rows += line('المجموع', toArabicPrice(order.subtotal))
  if (order.shipping_cost != null) rows += line('الشحن', order.shipping_cost === 0 ? 'مجاني' : toArabicPrice(order.shipping_cost))
  if (order.coupon_discount) rows += line('الخصم', `- ${toArabicPrice(order.coupon_discount)}`)
  rows += line('الإجمالي', toArabicPrice(order.total), true)
  return `<table style="width:100%;border-collapse:collapse;background:#FAF6F1;border-radius:8px;">${rows}</table>`
}

export function orderConfirmationEmail(order: OrderEmailData, items: OrderEmailItem[]): { subject: string; html: string } {
  const greeting = order.customer_name ? `مرحباً ${order.customer_name}،` : 'مرحباً،'
  const body = `
    <p>${greeting}</p>
    <p>شكراً لطلبك من Deep Beauty! تم استلام طلبك رقم <strong dir="ltr">${order.order_number}</strong> وسنبدأ بتجهيزه فوراً.</p>
    ${order.created_at ? `<p style="font-size:13px;color:#8a8a8a;">تاريخ الطلب: ${formatDateTime(order.created_at)}</p>` : ''}
    ${itemsTable(items)}
    ${totalsBlock(order)}
    <p style="margin-top:16px;">سنرسل لك تحديثاً عند شحن الطلب. لأي استفسار تواصلي معنا عبر واتساب.</p>
  `
  return {
    subject: `تأكيد طلبك ${order.order_number} — Deep Beauty`,
    html: emailShell('تأكيد الطلب', body),
  }
}

export function orderStatusEmail(order: OrderEmailData, message?: string): { subject: string; html: string } {
  const statusLabel = (order.status && STATUS_LABELS[order.status]) || order.status || ''
  const greeting = order.customer_name ? `مرحباً ${order.customer_name}،` : 'مرحباً،'
  const body = `
    <p>${greeting}</p>
    <p>تم تحديث حالة طلبك رقم <strong dir="ltr">${order.order_number}</strong>:</p>
    <div style="background:#FAF6F1;border-radius:8px;padding:14px 18px;text-align:center;font-size:17px;font-weight:bold;color:#8B6F5C;margin:12px 0;">
      ${statusLabel}
    </div>
    ${message ? `<p>${message}</p>` : ''}
    <p>لأي استفسار تواصلي معنا عبر واتساب.</p>
  `
  return {
    subject: `تحديث طلبك ${order.order_number}: ${statusLabel} — Deep Beauty`,
    html: emailShell('تحديث حالة الطلب', body),
  }
}

export function newsletterEmail(subject: string, contentHtml: string): { subject: string; html: string } {
  return { subject, html: emailShell(subject, contentHtml) }
}

export function abandonedCartEmail(
  customerName: string | null,
  items: { name_ar: string; quantity: number }[],
  checkoutUrl: string
): { subject: string; html: string } {
  const greeting = customerName ? `مرحباً ${customerName}،` : 'مرحباً،'
  const itemsList = items.map((i) => `<li>${i.name_ar} × ${i.quantity}</li>`).join('')
  const body = `
    <p>${greeting}</p>
    <p>لاحظنا إنك تركتِ بعض المنتجات بسلتك ولم تكملي الطلب:</p>
    <ul style="padding-right:20px;">${itemsList}</ul>
    <p style="margin-top:16px;">
      <a href="${checkoutUrl}" style="display:inline-block;background:#8B6F5C;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">
        إكمال الطلب
      </a>
    </p>
  `
  return {
    subject: 'نسيتِ شيئاً بسلتك 🌸 — Deep Beauty',
    html: emailShell('سلتك بانتظارك', body),
  }
}

export function backInStockEmail(productName: string, productUrl: string): { subject: string; html: string } {
  const body = `
    <p>مرحباً،</p>
    <p>المنتج الذي طلبتِ إشعارك عنه متوفر الآن بالمخزون:</p>
    <div style="background:#FAF6F1;border-radius:8px;padding:14px 18px;text-align:center;font-size:17px;font-weight:bold;color:#8B6F5C;margin:12px 0;">
      ${productName}
    </div>
    <p style="margin-top:16px;">
      <a href="${productUrl}" style="display:inline-block;background:#8B6F5C;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">
        تسوقي الآن
      </a>
    </p>
  `
  return {
    subject: `${productName} متوفر الآن! — Deep Beauty`,
    html: emailShell('المنتج متوفر الآن', body),
  }
}
