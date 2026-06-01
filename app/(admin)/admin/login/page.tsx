'use client'

import { useState } from 'react'
import { createClientSupabase } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClientSupabase()

      // Step 1: Authenticate
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) {
        toast.error('البريد الإلكتروني أو كلمة المرور غير صحيحة')
        setLoading(false)
        return
      }

      // Step 2: Verify admin role via API
      const check = await fetch('/api/admin/dashboard', { method: 'GET' })
      if (check.status === 401 || check.status === 403) {
        // Not admin — sign out immediately
        await supabase.auth.signOut()
        toast.error('هذا الحساب لا يملك صلاحية الدخول إلى لوحة التحكم')
        setLoading(false)
        return
      }

      toast.success('تم تسجيل الدخول بنجاح')
      window.location.href = '/admin/dashboard'
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
