import path from 'path'
import { Document, Page, Text, View, Image, StyleSheet, Font, renderToBuffer } from '@react-pdf/renderer'
import type { Style } from '@react-pdf/types'
import { STATUS_LABELS } from '@/lib/utils'
import { CONTACT_INFO } from '@/lib/contact'

// @react-pdf/renderer's bidi/shaping pass reliably breaks in two situations
// verified by hand: (1) Arabic-Indic digits sitting next to punctuation
// (".", ":", "/", "٫") in the same text run, and (2) ASCII digits scattered
// more than once through an otherwise-Arabic sentence in a single run (e.g.
// a full address or date built as one string). It is fine with: ASCII
// digits + punctuation alone (money), Arabic-Indic digits + spaces only, no
// other punctuation (a plain date), and a single Latin/ASCII value tacked
// onto an Arabic label ("رقم الطلب: DB-123"). So: money always uses ASCII
// digits; anything that would otherwise interleave multiple numbers through
// Arabic words (address, date) is split into separate <Text> spans — one
// per token — inside a row-reverse <View> instead of one interpolated string.
const toArabicIndic = (s: string | number) => String(s).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[+d])
const money = (n: number) => `${n.toFixed(3)} د.ك`

const AR_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']

function kuwaitDateParts(dateStr: string): { dateAr: string; timeAr: string } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kuwait',
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  }).formatToParts(new Date(dateStr))
  const get = (type: string) => parts.find((p) => p.type === type)?.value || ''
  // Pure Arabic-Indic digits + spaces only (no separators) — safe as one run.
  const dateAr = toArabicIndic(get('day')) + ' ' + AR_MONTHS[Number(get('month')) - 1] + ' ' + toArabicIndic(get('year'))
  // ASCII digits + colon — also safe as one run, kept separate from dateAr.
  const timeAr = `${get('hour')}:${get('minute')} ${get('dayPeriod') === 'PM' ? 'م' : 'ص'}`
  return { dateAr, timeAr }
}

let fontsRegistered = false
function ensureFontsRegistered() {
  if (fontsRegistered) return
  Font.register({
    family: 'Almarai',
    fonts: [
      // @react-pdf/renderer cannot parse WOFF2 — registering the .woff2 files
      // silently drops every Arabic glyph from the rendered PDF. Keep these as TTF.
      { src: path.join(process.cwd(), 'public/fonts/almarai-400.ttf'), fontWeight: 'normal' },
      { src: path.join(process.cwd(), 'public/fonts/almarai-700.ttf'), fontWeight: 'bold' },
    ],
  })
  fontsRegistered = true
}

export interface InvoiceOrder {
  id: string
  order_number: string
  customer_name: string
  customer_phone: string
  customer_email?: string | null
  address_area?: string | null
  address_block?: string | null
  address_street?: string | null
  address_house?: string | null
  subtotal: number
  shipping_cost: number
  coupon_discount?: number | null
  coupon_code?: string | null
  loyalty_points_redeemed?: number | null
  total: number
  status: string
  payment_method: string
  payment_status: string
  created_at: string
}

export interface InvoiceItem {
  id: string
  product_name_ar: string
  quantity: number
  unit_price: number
  total_price: number
}

const styles = StyleSheet.create({
  page: { fontFamily: 'Almarai', direction: 'rtl', padding: 32, fontSize: 11, color: '#3d3d3d' },
  header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: '#E8DED1', paddingBottom: 16, marginBottom: 16 },
  brand: { fontSize: 18, fontWeight: 'bold', color: '#8B6F5C' },
  muted: { color: '#8a8a8a', fontSize: 10 },
  invoiceTitle: { fontSize: 14, fontWeight: 'bold', textAlign: 'left' },
  // Plain 'row' (not 'row-reverse') — @react-pdf/renderer's Yoga layout
  // mis-positions a nested flex row inside a flex:1 column that itself sits
  // inside a 'row-reverse' container (content escapes into the sibling
  // column). Column order is manually reversed in JSX instead to get the
  // same right-to-left visual arrangement.
  row: { flexDirection: 'row', marginBottom: 16 },
  col: { flex: 1 },
  sectionLabel: { fontSize: 10, color: '#8a8a8a', marginBottom: 4, fontWeight: 'bold' },
  table: { marginBottom: 16, borderWidth: 1, borderColor: '#E8DED1', borderRadius: 4 },
  tableHeaderRow: { flexDirection: 'row-reverse', backgroundColor: '#FAF6F1', borderBottomWidth: 1, borderBottomColor: '#E8DED1' },
  tableRow: { flexDirection: 'row-reverse', borderBottomWidth: 1, borderBottomColor: '#F0EAE2' },
  th: { padding: 8, fontWeight: 'bold', fontSize: 10 },
  td: { padding: 8, fontSize: 10 },
  cellProduct: { flex: 3 },
  cellQty: { flex: 1, textAlign: 'center' },
  cellPrice: { flex: 1.5, textAlign: 'center' },
  cellTotal: { flex: 1.5, textAlign: 'left' },
  totals: { width: 220, marginRight: 'auto', marginLeft: 0 },
  totalsRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: 3 },
  totalsBold: { fontWeight: 'bold', fontSize: 13, borderTopWidth: 1, borderTopColor: '#E8DED1', paddingTop: 6, marginTop: 4 },
  footer: { position: 'absolute', bottom: 24, left: 32, right: 32, textAlign: 'center', fontSize: 9, color: '#8a8a8a', borderTopWidth: 1, borderTopColor: '#E8DED1', paddingTop: 10 },
  tokenRow: { flexDirection: 'row' },
  tokenRowReverse: { flexDirection: 'row-reverse' },
})

// Renders an address/date-like line as one <Text> span per token instead of
// one interpolated string — see the note above ensureFontsRegistered.
function TokenLine({ tokens, style }: { tokens: string[]; style?: Style }) {
  const reversed = [...tokens].reverse()
  return (
    <View style={styles.tokenRow}>
      {reversed.map((tok, i) => (
        <Text key={i} style={style}>{tok}</Text>
      ))}
    </View>
  )
}

export async function renderInvoicePdf(order: InvoiceOrder, items: InvoiceItem[]): Promise<Buffer> {
  ensureFontsRegistered()

  const logoPath = path.join(process.cwd(), 'public/logo.png')

  // create_order_atomic_secure deducts the redeemed-points value from
  // (subtotal - coupon_discount + shipping_cost) to arrive at `total`.
  // Derive that amount here so the line items add up to the printed total.
  const preLoyaltyTotal = order.subtotal - (order.coupon_discount || 0) + order.shipping_cost
  const loyaltyDiscount = order.loyalty_points_redeemed
    ? Math.max(0, Math.round((preLoyaltyTotal - order.total) * 1000) / 1000)
    : 0

  const { dateAr, timeAr } = kuwaitDateParts(order.created_at)

  // Each label and its number are separate tokens (not "قطعة 4" as one
  // string) — an Arabic word immediately touching an ASCII digit in the
  // same run is exactly the pattern that breaks react-pdf's bidi pass.
  const addressTokens = [
    order.address_block ? ['قطعة', ` ${order.address_block}`] : null,
    order.address_street ? ['، شارع', ` ${order.address_street}`] : null,
    order.address_house ? ['، منزل', ` ${order.address_house}`] : null,
  ].filter((t): t is string[] => Boolean(t)).flat()

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image, not an HTML img; no alt prop exists */}
            <Image src={logoPath} style={{ width: 48, height: 48, marginBottom: 6 }} />
            <Text style={styles.brand}>Deep Beauty | ديب بيوتي</Text>
            <TokenLine tokens={[CONTACT_INFO.location, '  ·  ', CONTACT_INFO.phone]} style={styles.muted} />
            <Text style={styles.muted}>{CONTACT_INFO.email}</Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>فاتورة</Text>
            <Text style={{ fontSize: 11 }}>{order.order_number}</Text>
            <Text style={styles.muted}>{dateAr}</Text>
            <Text style={styles.muted}>{timeAr}</Text>
            <Text style={{ fontSize: 10, marginTop: 2 }}>{STATUS_LABELS[order.status] || order.status}</Text>
          </View>
        </View>

        <View style={styles.row}>
          {/* JSX order is address-then-customer (not the RTL reading order)
              because `row` is a plain row — see the note on styles.row. */}
          <View style={styles.col}>
            <Text style={styles.sectionLabel}>عنوان التوصيل</Text>
            <Text>{order.address_area || ''}</Text>
            {addressTokens.length > 0 && <TokenLine tokens={addressTokens} />}
          </View>
          <View style={styles.col}>
            <Text style={styles.sectionLabel}>العميل</Text>
            <Text style={{ fontWeight: 'bold' }}>{order.customer_name}</Text>
            <Text>{order.customer_phone}</Text>
            {order.customer_email ? <Text>{order.customer_email}</Text> : null}
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.th, styles.cellProduct]}>المنتج</Text>
            <Text style={[styles.th, styles.cellQty]}>الكمية</Text>
            <Text style={[styles.th, styles.cellPrice]}>سعر الوحدة</Text>
            <Text style={[styles.th, styles.cellTotal]}>الإجمالي</Text>
          </View>
          {items.map((item) => (
            <View style={styles.tableRow} key={item.id}>
              <Text style={[styles.td, styles.cellProduct]}>{item.product_name_ar}</Text>
              <Text style={[styles.td, styles.cellQty]}>{item.quantity}</Text>
              <Text style={[styles.td, styles.cellPrice]}>{money(item.unit_price)}</Text>
              <Text style={[styles.td, styles.cellTotal]}>{money(item.total_price)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalsRow}>
            <Text>المجموع الجزئي</Text>
            <Text>{money(order.subtotal)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text>الشحن</Text>
            <Text>{order.shipping_cost === 0 ? 'مجاني' : money(order.shipping_cost)}</Text>
          </View>
          {order.coupon_discount ? (
            <View style={styles.totalsRow}>
              <Text>الخصم {order.coupon_code ? `(${order.coupon_code})` : ''}</Text>
              <Text>- {money(order.coupon_discount)}</Text>
            </View>
          ) : null}
          {loyaltyDiscount > 0 ? (
            <View style={styles.totalsRow}>
              <View style={styles.tokenRowReverse}>
                <Text>خصم نقاط الولاء</Text>
                <Text>{` (${toArabicIndic(order.loyalty_points_redeemed!)} نقطة)`}</Text>
              </View>
              <Text>- {money(loyaltyDiscount)}</Text>
            </View>
          ) : null}
          <View style={[styles.totalsRow, styles.totalsBold]}>
            <Text>الإجمالي</Text>
            <Text>{money(order.total)}</Text>
          </View>
          <Text style={{ fontSize: 9, color: '#8a8a8a', marginTop: 8 }}>
            طريقة الدفع: {order.payment_method === 'cod' ? 'دفع عند الاستلام' : 'دفع إلكتروني'} — {order.payment_status === 'paid' ? 'مدفوع' : 'غير مدفوع'}
          </Text>
        </View>

        <Text style={styles.footer}>شكراً لتسوقكم مع Deep Beauty</Text>
      </Page>
    </Document>
  )

  return renderToBuffer(doc)
}
