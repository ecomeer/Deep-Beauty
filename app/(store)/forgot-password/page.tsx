'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  EnvelopeIcon,
  ArrowLeftIcon,
  SparklesIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { createClientSupabase } from '@/lib/supabase-client'

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [email, setEmail] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClientSupabase()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`
      })

      if (error) {
        toast.error('حدث خطأ أثناء إرسال البريد. تأكدي من صحة العنوان.')
      } else {
        setSent(true)
      }
    } catch {
      toast.error('حدث خطأ. حاولي مرة أخرى.')
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
          {/* Header */}
          <div className="bg-primary p-8 text-center text-white">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center"
            >
              {sent ? (
                <CheckCircleIcon className="w-8 h-8" />
              ) : (
                <SparklesIcon className="w-8 h-8" />
              )}
            </motion.div>
            <h1 className="text-2xl font-headline mb-2">
              {sent ? 'تم إرسال الرابط!' : 'نسيتِ كلمة المرور؟'}
            </h1>
            <p className="text-white/80 text-sm font-body">
              {sent
                ? `تفقدي بريدك الإلكتروني ${email}`
                : 'أدخلي بريدك وسنرسل لكِ رابط إعادة التعيين'}
            </p>
          </div>

          <div className="p-8">
            {sent ? (
              <div className="text-center space-y-4">
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  أرسلنا رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.
                  تفقدي صندوق الوارد (وربما مجلد الـ Spam).
                </p>
                <button
                  type="button"
                  onClick={() => { setSent(false); setEmail('') }}
                  className="text-sm text-[#9C6644] hover:underline"
                >
                  إعادة الإرسال
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="reset-email" className="block text-sm font-medium text-on-surface-variant mb-2">
                    البريد الإلكتروني
                  </label>
                  <div className="relative">
                    <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="reset-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#9C6644] focus:ring-2 focus:ring-[#9C6644]/20 outline-none transition-all"
                      placeholder="your@email.com"
                      dir="ltr"
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-[#9C6644] text-white rounded-xl font-bold hover:bg-[#7A5235] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <>
                      إرسال رابط الاسترداد
                      <ArrowLeftIcon className="w-5 h-5 rotate-180" />
                    </>
                  )}
                </motion.button>

                <p className="text-center text-sm text-gray-600">
                  تذكرتِ كلمة المرور؟{' '}
                  <Link href="/login" className="text-[#9C6644] font-bold hover:underline">
                    تسجيل الدخول
                  </Link>
                </p>
              </form>
            )}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-6"
        >
          <Link href="/" className="text-gray-500 hover:text-gray-700 flex items-center justify-center gap-2">
            <ArrowLeftIcon className="w-4 h-4" />
            العودة للرئيسية
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}
