import { redirect } from 'next/navigation'

export default function AdminRootPage() {
  // FIXED: ensure /admin exists and lands on dashboard.
  redirect('/admin/dashboard')
}
