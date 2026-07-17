import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-admin'
import { renderInvoicePdf, type InvoiceOrder, type InvoiceItem } from '@/lib/invoice-pdf'
import { sanitizeFilenamePart } from '@/lib/utils'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const _authErr = await requireAdmin(req, 'orders')
  if (_authErr) return _authErr

  const { id } = await params

  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select(`
      id, order_number, customer_name, customer_phone, customer_email,
      address_area, address_block, address_street, address_house,
      subtotal, shipping_cost, coupon_discount, coupon_code, loyalty_points_redeemed, total,
      status, payment_method, payment_status, created_at,
      order_items ( id, product_name_ar, quantity, unit_price, total_price )
    `)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('Admin invoice lookup error:', error)
    return NextResponse.json({ error: 'Failed to load order' }, { status: 500 })
  }
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  const items = (order.order_items || []) as InvoiceItem[]
  const pdf = await renderInvoicePdf(order as InvoiceOrder, items)
  const safeFilename = sanitizeFilenamePart(order.order_number) || order.id

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${safeFilename}.pdf"`,
    },
  })
}
