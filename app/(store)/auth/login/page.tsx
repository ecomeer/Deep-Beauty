import { redirect } from 'next/navigation'

export default function AuthLoginAliasPage() {
  // FIXED: required /auth/login route mapped to existing login page.
  redirect('/login')
}
