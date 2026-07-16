import Link from 'next/link'

export default function AdminForbiddenPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center text-center" dir="rtl">
      <div className="max-w-md rounded-2xl border border-[var(--beige)] bg-white p-8 shadow-sm">
        <p className="text-5xl font-bold text-[var(--primary)]">403</p>
        <h1 className="mt-4 text-xl font-bold">لا تملك صلاحية الوصول</h1>
        <p className="mt-2 text-sm opacity-60">حسابك نشط، لكن هذه الصفحة خارج الصلاحيات الممنوحة لك.</p>
        <Link href="/admin/dashboard" className="btn-primary mt-6 inline-block px-5 py-2">العودة للوحة التحكم</Link>
      </div>
    </div>
  )
}
