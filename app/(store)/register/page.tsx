'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  EyeIcon, 
  EyeSlashIcon,
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  PhoneIcon,
  ArrowLeftIcon,
  SparklesIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  const [agreeTerms, setAgreeTerms] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (form.password !== form.confirmPassword) {
      toast.error('كلمتا المرور غير متطابقتين')
      return
    }

    if (!agreeTerms) {
      toast.error('يجب الموافقة على الشروط والأحكام')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password
        })
      })

      const data = await res.json()

      if (res.ok) {
        setStep('success')
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } else {
        toast.error(data.error || 'حدث خطأ أثناء التسجيل')
      }
    } catch {
      toast.error('حدث خطأ أثناء التسجيل')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5EBE0] to-[#E8DED1] flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl shadow-xl p-12 text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center"
          >
            <CheckCircleIcon className="w-10 h-10 text-green-600" />
          </motion.div>
          <h2 className="text-2xl font-bold mb-2">تم إنشاء الحساب بنجاح!</h2>
          <p className="text-gray-500 mb-6">
            تم إرسال رسالة تأكيد إلى بريدك الإلكتروني. سيتم تحويلك إلى صفحة الدخول...
          </p>
          <Link href="/login" className="btn-primary inline-block px-8 py-3">
            تسجيل الدخول الآن
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 py-8 pt-32">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-surface rounded-3xl shadow-editorial overflow-hidden border border-outline-variant">
          {/* Header */}
          <div className="bg-primary p-6 text-center text-white">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center"
            >
              <SparklesIcon className="w-8 h-8" />
            </motion.div>
            <h1 className="text-2xl font-headline">إنشاء حساب جديد</h1>
            <p className="text-white/80 text-sm">انضمي إلى عائلة Deep Beauty</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الاسم الكامل *
              </label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#9C6644] focus:ring-2 focus:ring-[#9C6644]/20 outline-none transition-all"
                  placeholder="الاسم الكامل"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                البريد الإلكتروني *
              </label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#9C6644] focus:ring-2 focus:ring-[#9C6644]/20 outline-none transition-all"
                  placeholder="your@email.com"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رقم الهاتف
              </label>
              <div className="relative">
                <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#9C6644] focus:ring-2 focus:ring-[#9C6644]/20 outline-none transition-all"
                  placeholder="+965 XXXX XXXX"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                كلمة المرور *
              </label>
              <div className="relative">
                <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full pl-12 pr-12 py-3 rounded-xl border border-gray-200 focus:border-[#9C6644] focus:ring-2 focus:ring-[#9C6644]/20 outline-none transition-all"
                  placeholder="8 أحرف على الأقل"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                تأكيد كلمة المرور *
              </label>
              <div className="relative">
                <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#9C6644] focus:ring-2 focus:ring-[#9C6644]/20 outline-none transition-all"
                  placeholder="أعد إدخال كلمة المرور"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-gray-300 text-[#9C6644] focus:ring-[#9C6644]"
              />
              <label htmlFor="terms" className="text-sm text-gray-600">
                أوافق على{' '}
                <Link href="/terms" className="text-[#9C6644] hover:underline">الشروط والأحكام</Link>
                {' '}و{' '}
                <Link href="/privacy" className="text-[#9C6644] hover:underline">سياسة الخصوصية</Link>
              </label>
            </div>

            {/* Submit */}
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
                  إنشاء الحساب
                  <ArrowLeftIcon className="w-5 h-5 rotate-180" />
                </>
              )}
            </motion.button>

            {/* Login Link */}
            <p className="text-center text-sm text-gray-600">
              لديكِ حساب بالفعل؟{' '}
              <Link href="/login" className="text-[#9C6644] font-bold hover:underline">
                سجلي دخولك
              </Link>
            </p>
          </form>
        </div>

        {/* Back Link */}
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
