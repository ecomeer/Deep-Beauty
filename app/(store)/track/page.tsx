import type { Metadata } from 'next'
import { Suspense } from 'react'
import TrackClient from './TrackClient'

export const metadata: Metadata = {
  title: 'تتبع طلبك | Deep Beauty',
  robots: { index: false, follow: false },
}

export default function TrackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 rounded-full border-4" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
      </div>
    }>
      <TrackClient />
    </Suspense>
  )
}
