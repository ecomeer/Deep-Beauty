export interface RevenueOrder {
  total: number | string
  status?: string | null
  payment_status?: string | null
  payment_method?: string | null
}

/**
 * A sale is recognized when it has been paid online, or when a cash-on-delivery
 * order has actually been delivered. Cancelled/refunded orders never count.
 */
export function isRecognizedRevenueOrder(order: RevenueOrder): boolean {
  if (
    order.status === 'cancelled' ||
    order.status === 'refunded' ||
    order.payment_status === 'refunded'
  ) {
    return false
  }

  if (order.payment_status === 'paid') return true

  return order.payment_method === 'cod' && order.status === 'delivered'
}

export function filterRecognizedRevenueOrders<T extends RevenueOrder>(
  orders: T[] | null | undefined
): T[] {
  return (orders ?? []).filter(isRecognizedRevenueOrder)
}

export function sumRecognizedRevenue(
  orders: RevenueOrder[] | null | undefined
): number {
  return filterRecognizedRevenueOrders(orders).reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  )
}
