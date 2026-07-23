'use client'

import { useState } from 'react'
import { ShoppingCartIcon, ChatBubbleLeftRightIcon, XMarkIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useAdminList } from '@/hooks/useAdminList'
import { toArabicPrice, formatDateTime } from '@/lib/utils'

interface CartItem {
  id: string
  name_ar: string
  price: number
  quantity: number
}

interface AbandonedCart {
  id: string
  customer_name: string | null
  customer_phone: string
  customer_email: string | null
  items: CartItem[]
  subtotal: number
  created_at: string
  updated_at: string
}

function recoveryMessage(cart: AbandonedCart): string {
  const itemNames = cart.items.map(i => `${i.name_ar} ×${i.quantity}`).join('، ')
  return `مرحباً ${cart.customer_name || ''}، لاحظنا إنك تركتِ بعض المنتجات بسلتك (${itemNames}) — تحبين نساعدك بإتمام الطلب؟ 🌸`
}

export default function AdminAbandonedCarts() {
  const [page, setPage] = useState(1)
  const { items: carts, raw, setItems: setCarts, loading } = useAdminList<AbandonedCart>(
    `/api/admin/abandoned-carts?page=${page}`,
    (json) => (json as { carts?: AbandonedCart[] }).carts || []
  )
  const totalPages = (raw as { totalPages?: number } | null)?.totalPages ?? 1

  async function dismiss(id: string) {
    const res = await fetch(`/api/admin/abandoned-carts/${id}`, { method: 'PATCH' })
    if (!res.ok) { toast.error('حدث خطأ'); return }
    setCarts(prev => prev.filter(c => c.id !== id))
    toast.success('تم التجاهل')
  }

  const totalValue = carts.reduce((s, c) => s + Number(c.subtotal), 0)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-dark)]">السلات المهملة</h1>
        <p className="text-sm opacity-60">
          سلات بها عملاء أدخلوا رقم هاتفهم ولم يكملوا الطلب ({carts.length}) — إجمالي القيمة المفقودة: {toArabicPrice(totalValue)}
        </p>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="animate-spin w-8 h-8 rounded-full border-4" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
        </div>
      ) : carts.length === 0 ? (
        <div className="bg-white rounded-2xl border p-16 text-center" style={{ borderColor: 'var(--beige)' }}>
          <ShoppingCartIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm opacity-50">لا توجد سلات مهملة حالياً</p>
        </div>
      ) : (
        <div className="space-y-4">
          {carts.map(cart => (
            <div key={cart.id} className="bg-white rounded-2xl shadow-sm border p-5" style={{ borderColor: 'var(--beige)' }}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h3 className="font-bold text-sm text-[var(--text-dark)]">{cart.customer_name || 'عميل غير معروف'}</h3>
                  <p className="text-xs opacity-50 mt-0.5" dir="ltr">{cart.customer_phone}</p>
                  <p className="text-xs opacity-40 mt-1" dir="ltr">آخر نشاط: {formatDateTime(cart.updated_at)}</p>
                </div>
                <div className="text-left flex-shrink-0">
                  <p className="font-bold text-primary">{toArabicPrice(cart.subtotal)}</p>
                  <button
                    type="button"
                    onClick={() => dismiss(cart.id)}
                    className="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <XMarkIcon className="w-3.5 h-3.5" /> تجاهل
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {cart.items.map((item, i) => (
                  <span key={i} className="badge badge-gray text-xs">
                    {item.name_ar} × {item.quantity}
                  </span>
                ))}
              </div>

              <a
                href={`https://wa.me/965${cart.customer_phone.replace(/\D/g, '').slice(-8)}?text=${encodeURIComponent(recoveryMessage(cart))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-2"
              >
                <ChatBubbleLeftRightIcon className="w-4 h-4" /> تواصل عبر واتساب
              </a>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 rounded-xl border text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors"
            style={{ borderColor: 'var(--beige)' }}
          >السابق</button>
          <span className="text-sm opacity-60">صفحة {page} من {totalPages}</span>
          <button
            type="button"
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 rounded-xl border text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors"
            style={{ borderColor: 'var(--beige)' }}
          >التالي</button>
        </div>
      )}
    </div>
  )
}
