import path from 'path'
import { Document, Page, Text, View, Image, StyleSheet, Font, renderToBuffer } from '@react-pdf/renderer'
import { toArabicPrice, formatDateTime, STATUS_LABELS } from '@/lib/utils'
import { CONTACT_INFO } from '@/lib/contact'

let fontsRegistered = false
function ensureFontsRegistered() {
  if (fontsRegistered) return
  Font.register({
    family: 'Almarai',
    fonts: [
      { src: path.join(process.cwd(), 'public/fonts/almarai-400.woff2'), fontWeight: 'normal' },
      { src: path.join(process.cwd(), 'public/fonts/almarai-700.woff2'), fontWeight: 'bold' },
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
  row: { flexDirection: 'row-reverse', marginBottom: 16 },
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
})

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

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image, not an HTML img; no alt prop exists */}
            <Image src={logoPath} style={{ width: 48, height: 48, marginBottom: 6 }} />
            <Text style={styles.brand}>Deep Beauty | ديب بيوتي</Text>
            <Text style={styles.muted}>{CONTACT_INFO.location} · {CONTACT_INFO.phone}</Text>
            <Text style={styles.muted}>{CONTACT_INFO.email}</Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>فاتورة</Text>
            <Text style={{ fontSize: 11 }}>{order.order_number}</Text>
            <Text style={styles.muted}>{formatDateTime(order.created_at)}</Text>
            <Text style={{ fontSize: 10, marginTop: 2 }}>{STATUS_LABELS[order.status] || order.status}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.sectionLabel}>العميل</Text>
            <Text style={{ fontWeight: 'bold' }}>{order.customer_name}</Text>
            <Text>{order.customer_phone}</Text>
            {order.customer_email ? <Text>{order.customer_email}</Text> : null}
          </View>
          <View style={styles.col}>
            <Text style={styles.sectionLabel}>عنوان التوصيل</Text>
            <Text>{order.address_area || ''}</Text>
            {(order.address_block || order.address_street || order.address_house) && (
              <Text>
                {[
                  order.address_block ? `قطعة ${order.address_block}` : null,
                  order.address_street ? `شارع ${order.address_street}` : null,
                  order.address_house ? `منزل ${order.address_house}` : null,
                ].filter(Boolean).join('، ')}
              </Text>
            )}
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
              <Text style={[styles.td, styles.cellPrice]}>{toArabicPrice(item.unit_price)}</Text>
              <Text style={[styles.td, styles.cellTotal]}>{toArabicPrice(item.total_price)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalsRow}>
            <Text>المجموع الجزئي</Text>
            <Text>{toArabicPrice(order.subtotal)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text>الشحن</Text>
            <Text>{order.shipping_cost === 0 ? 'مجاني' : toArabicPrice(order.shipping_cost)}</Text>
          </View>
          {order.coupon_discount ? (
            <View style={styles.totalsRow}>
              <Text>الخصم {order.coupon_code ? `(${order.coupon_code})` : ''}</Text>
              <Text>- {toArabicPrice(order.coupon_discount)}</Text>
            </View>
          ) : null}
          {loyaltyDiscount > 0 ? (
            <View style={styles.totalsRow}>
              <Text>خصم نقاط الولاء ({order.loyalty_points_redeemed} نقطة)</Text>
              <Text>- {toArabicPrice(loyaltyDiscount)}</Text>
            </View>
          ) : null}
          <View style={[styles.totalsRow, styles.totalsBold]}>
            <Text>الإجمالي</Text>
            <Text>{toArabicPrice(order.total)}</Text>
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
