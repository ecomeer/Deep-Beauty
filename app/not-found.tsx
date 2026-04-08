import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6" style={{ background: 'var(--off-white)' }}>
      <div className="text-center">
        <p className="text-8xl font-bold mb-4" style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--primary)' }}>
          404
        </p>
        <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-dark)' }}>
          الصفحة غير موجودة
        </h1>
        <p className="opacity-60 mb-8 max-w-sm mx-auto leading-7" style={{ color: 'var(--text-dark)' }}>
          يبدو أن هذه الصفحة غير موجودة أو تم نقلها. ابدئي من جديد.
        </p>
        <Link href="/" className="btn-primary px-10 py-4">
          العودة للرئيسية ✦
        </Link>
      </div>
    </div>
  )
}
