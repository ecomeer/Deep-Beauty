import { redirect } from 'next/navigation'

export default function OrdersAliasPage() {
  // FIXED: required /orders route now aliases to account orders.
  redirect('/account/orders')
}
