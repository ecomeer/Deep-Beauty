import { redirect } from 'next/navigation'

export default function AuthSignupAliasPage() {
  // FIXED: required /auth/signup route mapped to existing register page.
  redirect('/register')
}
