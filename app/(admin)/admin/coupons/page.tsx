import { redirect } from 'next/navigation'

// Consolidated: the coupons CRUD lives at /admin/marketing/coupons.
export default function AdminCouponsRedirect() {
  redirect('/admin/marketing/coupons')
}
