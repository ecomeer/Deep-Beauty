import { redirect } from 'next/navigation'

export default function ProfileAliasPage() {
  // FIXED: required /profile route mapped to account hub.
  redirect('/account')
}
