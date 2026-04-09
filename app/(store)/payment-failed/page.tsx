'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ExclamationCircleIcon, ArrowPathIcon, CreditCardIcon } from '@heroicons/react/24/outline'

const ERROR_MESSAGES: Record<string, string> = {
  missing_id: 'لم يتم العثور على معلومات الدفع',
  verification_failed: 'فشل التحقق من الدفع',
  database_error: 'حدث خطأ في تحديث الطلب',
  error: 'حدث خطأ غير متوقع',
  cancelled: 'تم إلغاء عملية الدفع',
  unknown_error: 'حدث خطأ غير معروف',
}

export default function PaymentFailedPage() {
  const searchParams = useSearchParams()
  const reason = searchParams.get('reason') || 'unknown_error'
  const errorMessage = ERROR_MESSAGES[reason] || ERROR_MESSAGES.unknown_error

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
          <ExclamationCircleIcon className="w-10 h-10 text-red-600" />
        </div>

        <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-dark)' }}>
          فشلت عملية الدفع
        </h1>

        <p className="text-gray-600 mb-2">{errorMessage}</p>
        <p className="text-sm text-gray-500 mb-8">
          لا تقلق، لم يتم خصم أي مبلغ من حسابك
        </p>

        <div className="space-y-3">
          <Link
            href="/checkout"
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <ArrowPathIcon className="w-5 h-5" />
            إعادة المحاولة
          </Link>

          <Link
            href="/products"
            className="btn-outline w-full flex items-center justify-center gap-2"
          >
            <CreditCardIcon className="w-5 h-5" />
            الدفع عند الاستلام
          </Link>
        </div>

        <div className="mt-8 p-4 rounded-xl bg-gray-50 text-right">
          <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-dark)' }}>
            هل تحتاج مساعدة؟
          </p>
          <p className="text-xs text-gray-600">
            يمكنك التواصل معنا عبر الواتساب: 965xxxxxxxxx+
          </p>
        </div>
      </div>
    </div>
  )
}
