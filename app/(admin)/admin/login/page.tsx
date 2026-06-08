'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (res.status === 401) {
        toast.error('البريد الإلكتروني أو كلمة المرور غير صحيحة')
        setLoading(false)
        return
      }
      if (res.status === 403) {
        toast.error('هذا الحساب لا يملك صلاحية الدخول إلى لوحة التحكم')
        setLoading(false)
        return
      }
      if (!res.ok) {
        toast.error('حدث خطأ أثناء تسجيل الدخول')
        setLoading(false)
        return
      }

      toast.success('تم تسجيل الدخول')
      router.refresh()
      router.push('/admin/dashboard')
    } catch {
      toast.error('حدث خطأ أثناء تسجيل الدخول')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center -m-6" style={{ background: 'var(--beige)' }}>
      <div className="bg-white rounded-3xl p-10 w-full max-w-md shadow-xl text-center">
        <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-white font-bold font-en text-2xl mb-4" style={{ background: 'var(--primary)' }}>BD</div>
        <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-cormorant), serif', color: 'var(--text-dark)' }}>Deep Beauty Admin</h1>
        <p className="text-sm opacity-60 mb-8">قم بتسجيل الدخول للوصول إلى لوحة التحكم</p>

        <form onSubmit={handleLogin} className="space-y-4 text-right">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-dark)' }}>البريد الإلكتروني</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-dark)' }}>كلمة المرور</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              dir="ltr"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full mt-4">
            {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    </div>
  )
}
