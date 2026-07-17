'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { LockClosedIcon, SparklesIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { createClientSupabase } from '@/lib/supabase-client'
import { translateAuthError } from '@/lib/auth-errors'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password.length < 8) {
      toast.error('كلمة المرور يجب أن تكون 8 أحرف على الأقل')
      return
    }
    if (password !== confirmPassword) {
      toast.error('كلمتا المرور غير متطابقتين')
      return
    }

    setLoading(true)
    try {
      const supabase = createClientSupabase()
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        toast.error(translateAuthError(error, 'تعذّر تحديث كلمة المرور — قد تكون الجلسة منتهية، اطلبي رابطاً جديداً'))
      } else {
        setDone(true)
        toast.success('تم تحديث كلمة المرور بنجاح')
        setTimeout(() => router.push('/account'), 1500)
      }
    } catch {
      toast.error('حدث خطأ أثناء تحديث كلمة المرور')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 pt-32">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-surface rounded-3xl shadow-editorial overflow-hidden border border-outline-variant">
          <div className="bg-primary p-8 text-center text-white">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center"
            >
              {done ? <CheckCircleIcon className="w-8 h-8" /> : <SparklesIcon className="w-8 h-8" />}
            </motion.div>
            <h1 className="text-2xl font-headline mb-2">
              {done ? 'تم التحديث!' : 'إعادة تعيين كلمة المرور'}
            </h1>
            <p className="text-white/80 text-sm font-body">
              {done ? 'يتم تحويلك إلى حسابك...' : 'أدخلي كلمة المرور الجديدة'}
            </p>
          </div>

          {!done && (
            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium text-on-surface-variant mb-2">
                    كلمة المرور الجديدة
                  </label>
                  <div className="relative">
                    <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="new-password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 outline-none transition-all"
                      placeholder="8 أحرف على الأقل"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-on-surface-variant mb-2">
                    تأكيد كلمة المرور
                  </label>
                  <div className="relative">
                    <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="confirm-password"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 outline-none transition-all"
                      placeholder="أعيدي إدخال كلمة المرور"
                      dir="ltr"
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-[var(--primary)] text-white rounded-xl font-bold hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    'تحديث كلمة المرور'
                  )}
                </motion.button>
              </form>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
