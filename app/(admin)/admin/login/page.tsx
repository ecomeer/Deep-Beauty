'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
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

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      toast.error('البريد الإلكتروني أو كلمة المرور غير صحيحة')
    } else {
      router.push('/admin/dashboard')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center -m-6" style={{ background: 'var(--beige)' }}>
      <div className="bg-white rounded-3xl p-10 w-full max-w-md shadow-xl text-center">
        <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-white font-bold font-en text-2xl mb-4" style={{ background: 'var(--primary)' }}>BD</div>
        <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--text-dark)' }}>Deep Beauty Admin</h1>
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
            {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    </div>
  )
}
