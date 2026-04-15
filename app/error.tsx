'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6" style={{ background: 'var(--off-white)' }}>
      <div className="text-center">
        <p className="text-8xl font-bold mb-4" style={{ fontFamily: 'var(--font-cormorant), serif', color: 'var(--primary)' }}>
          خطأ
        </p>
        <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-dark)' }}>
          حدث خطأ غير متوقع
        </h1>
        <p className="opacity-60 mb-8 max-w-sm mx-auto leading-7" style={{ color: 'var(--text-dark)' }}>
          نعتذر عن هذا الخطأ. يمكنك المحاولة مرة أخرى أو العودة للرئيسية.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button onClick={reset} className="btn-primary px-8 py-4">
            حاولي مرة أخرى
          </button>
          <Link href="/" className="btn-outline px-8 py-4">
            العودة للرئيسية
          </Link>
        </div>
      </div>
    </div>
  )
}
