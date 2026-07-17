import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { renderInvoicePdf, type InvoiceOrder, type InvoiceItem } from '@/lib/invoice-pdf'

const INVOICE_COLUMNS = `
  id, order_number, customer_name, customer_phone, customer_email,
  address_area, address_block, address_street, address_house,
  subtotal, shipping_cost, coupon_discount, coupon_code, total,
  status, payment_method, payment_status, created_at, user_id,
  order_items ( id, product_name_ar, quantity, unit_price, total_price )
`

type OrderWithItems = InvoiceOrder & { user_id: string | null; order_items: InvoiceItem[] }

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const orderNumber = req.nextUrl.searchParams.get('num')

  let order: OrderWithItems | null

  if (orderNumber) {
    // Guest access requires id + order number, same tokenized pattern as /api/orders/[id].
    const { data } = await supabaseAdmin
      .from('orders')
      .select(INVOICE_COLUMNS)
      .eq('id', id)
      .eq('order_number', orderNumber)
      .maybeSingle()
    order = data as unknown as OrderWithItems | null
  } else {
    const { user, error: authError } = await requireUser()
    if (authError) return authError

    const { data } = await supabaseAdmin
      .from('orders')
      .select(INVOICE_COLUMNS)
      .eq('id', id)
      .or(`user_id.eq.${user.id},customer_email.eq.${user.email}`)
      .maybeSingle()
    order = data as unknown as OrderWithItems | null
  }

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const items = order.order_items || []
  const pdf = await renderInvoicePdf(order, items)

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${order.order_number}.pdf"`,
    },
  })
}
