'use client'

import { useCartContext } from '@/context/CartContext'
import { toArabicPrice } from '@/lib/utils'
import { TrashIcon, PlusIcon, MinusIcon, ShoppingBagIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import Image from 'next/image'

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal } = useCartContext()
  const SHIPPING_COST = 1.5
  const FREE_SHIPPING = 20
  const shipping = subtotal >= FREE_SHIPPING ? 0 : SHIPPING_COST
  const total = subtotal + shipping

  if (items.length === 0) return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 px-6">
      <ShoppingBagIcon className="w-24 h-24 opacity-20" style={{ color: 'var(--primary)' }} />
      <h2 className="text-3xl font-bold" style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--text-dark)' }}>سلتك فارغة</h2>
      <p className="opacity-60">أضيفي منتجات لتبدأ تجربة التسوق</p>
      <Link href="/products" className="btn-primary px-10 py-4">تسوق الآن ✦</Link>
    </div>
  )

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6" style={{ background: 'var(--off-white)' }}>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-10" style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--text-dark)' }}>
          سلة التسوق
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl p-5 flex gap-4 shadow-sm">
                <div className="w-20 h-20 rounded-xl flex-shrink-0 overflow-hidden relative" style={{ background: 'var(--beige)' }}>
                  {item.image ? (
                    <Image src={item.image} alt={item.name_ar} fill sizes="80px" className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">🧴</div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold mb-1" style={{ color: 'var(--text-dark)' }}>{item.name_ar}</h3>
                  <p className="text-sm opacity-60 mb-3">{item.name_en}</p>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2 border rounded-xl p-1" style={{ borderColor: 'var(--dark-beige)' }}>
                      <button type="button" aria-label="تقليل الكمية" onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 rounded-lg hover:bg-gray-50 flex items-center justify-center">
                        <MinusIcon className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                      <button type="button" aria-label="زيادة الكمية" onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 rounded-lg hover:bg-gray-50 flex items-center justify-center">
                        <PlusIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold" style={{ color: 'var(--primary)' }}>{toArabicPrice(item.price * item.quantity)}</span>
                      <button type="button" aria-label="حذف المنتج" onClick={() => removeItem(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-white rounded-2xl p-6 shadow-sm h-fit sticky top-24">
            <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--text-dark)' }}>ملخص الطلب</h2>
            <div className="space-y-3 mb-6 text-sm">
              <div className="flex justify-between">
                <span className="opacity-60">المجموع الجزئي</span>
                <span className="font-semibold">{toArabicPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60">الشحن</span>
                <span className={shipping === 0 ? 'text-green-600 font-semibold' : 'font-semibold'}>
                  {shipping === 0 ? 'مجاني 🎉' : toArabicPrice(shipping)}
                </span>
              </div>
              {/* Free shipping progress bar */}
              <div>
                <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--primary)' }}>
                  {subtotal >= FREE_SHIPPING ? (
                    <span className="font-bold">🎉 حصلتِ على شحن مجاني!</span>
                  ) : (
                    <>
                      <span>أضيفي {toArabicPrice(FREE_SHIPPING - subtotal)} للشحن المجاني</span>
                      <span>{Math.round((subtotal / FREE_SHIPPING) * 100)}%</span>
                    </>
                  )}
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--beige)' }}>
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min((subtotal / FREE_SHIPPING) * 100, 100)}%`,
                      background: subtotal >= FREE_SHIPPING ? '#22c55e' : 'var(--primary)',
                    }}
                  />
                </div>
              </div>
              <div className="pt-3 border-t flex justify-between text-base font-bold" style={{ borderColor: 'var(--beige)', color: 'var(--text-dark)' }}>
                <span>الإجمالي</span>
                <span style={{ color: 'var(--primary)' }}>{toArabicPrice(total)}</span>
              </div>
            </div>
            <Link href="/checkout" className="btn-primary w-full text-center py-4 font-bold">إتمام الطلب ←</Link>
            <Link href="/products" className="btn-ghost w-full text-center mt-3 text-sm">متابعة التسوق</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
