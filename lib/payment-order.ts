export interface GatewayPaymentOrderState {
  status: string
  payment_status?: string | null
  paid_at?: string | null
  confirmed_at?: string | null
}

export interface PaidOrderPatch {
  payment_status: 'paid'
  status: string
  paid_at: string
  updated_at: string
  confirmed_at?: string
}

/**
 * Build the database patch for a verified gateway payment.
 *
 * Pending orders become confirmed. Orders already processing, shipped, or
 * delivered keep their current lifecycle state so a delayed webhook cannot
 * move them backwards. Cancelled orders are never revived.
 */
export function buildPaidOrderPatch(
  order: GatewayPaymentOrderState,
  now: string = new Date().toISOString()
): PaidOrderPatch | null {
  if (order.status === 'cancelled') return null

  const shouldConfirm = order.status === 'pending'
  const patch: PaidOrderPatch = {
    payment_status: 'paid',
    status: shouldConfirm ? 'confirmed' : order.status,
    paid_at: order.paid_at || now,
    updated_at: now,
  }

  if (shouldConfirm) {
    patch.confirmed_at = order.confirmed_at || now
  }

  return patch
}
