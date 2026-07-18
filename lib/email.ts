import { STATUS_LABELS, toArabicPrice, formatDateTime, escapeHtml } from '@/lib/utils'
import { CONTACT_INFO } from '@/lib/contact'

// Email delivery via the Resend REST API (no SDK dependency).
// When RESEND_API_KEY is not configured every send becomes a logged no-op,
// so checkout/notify flows keep working and emails switch on the moment
// the key is added.

const RESEND_API_URL = 'https://api.resend.com/emails'

export interface SendEmailResult {
  sent: boolean
  error?: string
}

export interface EmailAttachment {
  filename: string
  content: Buffer
}

export async function sendEmail(params: {
  to: string
  subject: string
  html: string
  replyTo?: string
  attachments?: EmailAttachment[]
}): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not configured — email skipped:', params.subject)
    return { sent: false, error: 'not_configured' }
  }

  const from = process.env.EMAIL_FROM || `Deep Beauty <${CONTACT_INFO.email}>`

  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: params.to,
        subject: params.subject,
        html: params.html,
        ...(params.replyTo ? { reply_to: params.replyTo } : {}),
        ...(params.attachments?.length
          ? { attachments: params.attachments.map((a) => ({ filename: a.filename, content: a.content.toString('base64') })) }
          : {}),
      }),
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error('[email] Resend error', res.status, body)
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

// Site URL is only used to build an absolute logo <img> src — email clients
// can't resolve a relative path. Falls back to a text wordmark when unset.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')

/** A CTA button as an HTML string — reused by every template that needs one. */
function ctaButton(label: string, href: string): string {
  return `<div style="text-align:center;margin:24px 0;">
    <a href="${href}" style="display:inline-block;background:#8B6F5C;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:15px;">
      ${label}
    </a>
  </div>`
}

function emailShell(title: string, bodyHtml: string, preheader?: string): string {
  const logo = SITE_URL
    ? `<img src="${SITE_URL}/logo.png" alt="Deep Beauty" width="44" height="44" style="display:block;margin:0 auto 8px;border-radius:10px;">`
    : ''
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#F5EBE0;font-family:Tahoma,Arial,sans-serif;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${preheader}</div>` : ''}
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
    <div style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #E8DED1;box-shadow:0 2px 10px rgba(139,111,92,0.08);">
      <div style="background:linear-gradient(135deg,#8B6F5C 0%,#6f5647 100%);color:#fff;padding:24px;text-align:center;">
        ${logo}
        <div style="font-size:20px;font-weight:bold;">Deep Beauty | ديب بيوتي</div>
        <div style="font-size:14px;opacity:.85;margin-top:6px;">${title}</div>
      </div>
      <div style="padding:28px 24px;color:#3d3d3d;font-size:15px;line-height:1.8;">
        ${bodyHtml}
      </div>
      <div style="padding:20px 24px;background:#FAF6F1;border-top:1px solid #E8DED1;font-size:12px;color:#8a8a8a;text-align:center;line-height:1.9;">
        <div>
          <a href="${CONTACT_INFO.whatsappHref}" style="color:#8B6F5C;text-decoration:none;">واتساب</a>
          &nbsp;·&nbsp;
          <a href="${CONTACT_INFO.phoneHref}" style="color:#8B6F5C;text-decoration:none;" dir="ltr">${CONTACT_INFO.phone}</a>
          &nbsp;·&nbsp;
          <a href="${CONTACT_INFO.emailHref}" style="color:#8B6F5C;text-decoration:none;">${CONTACT_INFO.email}</a>
        </div>
        <div style="margin-top:4px;">${CONTACT_INFO.location} · ${CONTACT_INFO.hours}</div>
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
    html: emailShell('تأكيد الطلب', body, `تم استلام طلبك ${order.order_number} وسنبدأ بتجهيزه فوراً`),
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
    html: emailShell('تحديث حالة الطلب', body, `طلبك ${order.order_number} الآن: ${statusLabel}`),
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
    ${ctaButton('إكمال الطلب', checkoutUrl)}
  `
  return {
    subject: 'نسيتِ شيئاً بسلتك 🌸 — Deep Beauty',
    html: emailShell('سلتك بانتظارك', body, 'منتجاتك بانتظارك — أكملي طلبك قبل نفاد الكمية'),
  }
}

export function contactNotificationEmail(data: { name: string; email: string; message: string }): { subject: string; html: string } {
  const name = escapeHtml(data.name)
  const email = escapeHtml(data.email)
  const message = escapeHtml(data.message)
  const body = `
    <p>رسالة جديدة من نموذج "تواصلي معنا":</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
      <tr><td style="padding:6px 12px;font-weight:bold;width:100px;">الاسم</td><td style="padding:6px 12px;">${name}</td></tr>
      <tr><td style="padding:6px 12px;font-weight:bold;">البريد</td><td style="padding:6px 12px;" dir="ltr">${email}</td></tr>
    </table>
    <div style="background:#FAF6F1;border-radius:8px;padding:14px 18px;white-space:pre-wrap;">${message}</div>
    <p style="margin-top:16px;font-size:13px;color:#8a8a8a;">للرد، فقط اضغطي "رد" على هذا الإيميل.</p>
  `
  return {
    subject: `رسالة جديدة من ${name} — نموذج التواصل`,
    html: emailShell('رسالة تواصل جديدة', body),
  }
}

export function backInStockEmail(productName: string, productUrl: string): { subject: string; html: string } {
  const body = `
    <p>مرحباً،</p>
    <p>المنتج الذي طلبتِ إشعارك عنه متوفر الآن بالمخزون:</p>
    <div style="background:#FAF6F1;border-radius:8px;padding:14px 18px;text-align:center;font-size:17px;font-weight:bold;color:#8B6F5C;margin:12px 0;">
      ${productName}
    </div>
    ${ctaButton('تسوقي الآن', productUrl)}
  `
  return {
    subject: `${productName} متوفر الآن! — Deep Beauty`,
    html: emailShell('المنتج متوفر الآن', body, `${productName} متوفر الآن بالمخزون — تسوقي قبل نفاد الكمية`),
  }
}

export function welcomeEmail(name: string | null): { subject: string; html: string } {
  const greeting = name ? `أهلاً بك ${name}!` : 'أهلاً بك!'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
  const body = `
    <p style="font-size:17px;font-weight:bold;color:#8B6F5C;">${greeting} 🌸</p>
    <p>سعيدون بانضمامك إلى عائلة Deep Beauty. حسابك جاهز الآن ويمكنك:</p>
    <ul style="padding-right:20px;line-height:2;">
      <li>متابعة طلباتك وتاريخ مشترياتك</li>
      <li>حفظ عناوين التوصيل لتسريع الدفع</li>
      <li>إضافة منتجاتك المفضلة إلى قائمة الأمنيات</li>
      <li>الحصول على إشعار فوري عند توفر المنتجات النافدة</li>
    </ul>
    ${siteUrl ? ctaButton('ابدئي التسوق', siteUrl) : ''}
    <p style="margin-top:16px;font-size:13px;color:#8a8a8a;">لأي استفسار، فريقنا على واتساب جاهز لمساعدتك.</p>
  `
  return {
    subject: 'أهلاً بك في عائلة Deep Beauty! 🌸',
    html: emailShell('أهلاً بك', body, 'حسابك جاهز الآن — تسوقي أحدث منتجات العناية والجمال'),
  }
}
