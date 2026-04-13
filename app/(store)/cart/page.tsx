'use client'

import { useCartContext } from '@/context/CartContext'
import { useCountry } from '@/context/CountryContext'
import { TrashIcon, PlusIcon, MinusIcon, ShoppingBagIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import Image from 'next/image'

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal } = useCartContext()
  const { formatPrice } = useCountry()
  const SHIPPING_COST = 1.5
  const FREE_SHIPPING = 20
  const shipping = subtotal >= FREE_SHIPPING ? 0 : SHIPPING_COST
  const total = subtotal + shipping

  if (items.length === 0) return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 px-6 bg-surface">
      <div className="w-24 h-24 rounded-full bg-surface-container flex items-center justify-center">
        <ShoppingBagIcon className="w-12 h-12 text-outline" />
      </div>
      <h2 className="text-3xl font-headline text-on-surface">سلتك فارغة</h2>
      <p className="text-on-surface-variant">أضيفي منتجات لتبدأ تجربة التسوق</p>
      <Link href="/products" className="bg-primary text-white px-8 py-3 rounded-xl font-medium hover:bg-primary-container transition-colors inline-flex items-center gap-2">
        <ArrowLeftIcon className="w-4 h-4" />
        تسوق الآن
      </Link>
    </div>
  )

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 bg-surface pt-32">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-headline mb-10 text-on-surface">
          سلة التسوق
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-surface rounded-2xl p-5 flex gap-4 shadow-editorial border border-outline-variant/50">
                <div className="w-20 h-20 rounded-xl flex-shrink-0 overflow-hidden relative bg-surface-container">
                  {item.image ? (
                    <Image src={item.image} alt={item.name_ar} fill sizes="80px" className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">🧴</div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold mb-1 text-on-surface">{item.name_ar}</h3>
                  <p className="text-sm text-on-surface-variant mb-3">{item.name_en}</p>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2 border border-outline-variant rounded-xl p-1 bg-surface-container-low">
                      <button type="button" aria-label="تقليل الكمية" onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 rounded-lg hover:bg-gray-50 flex items-center justify-center">
                        <MinusIcon className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                      <button type="button" aria-label="زيادة الكمية" onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 rounded-lg hover:bg-gray-50 flex items-center justify-center">
                        <PlusIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-primary">{formatPrice(item.price * item.quantity)}</span>
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
          <div className="bg-surface rounded-2xl p-6 shadow-editorial h-fit sticky top-32 border border-outline-variant/50">
            <h2 className="text-xl font-headline mb-6 text-on-surface">ملخص الطلب</h2>
            <div className="space-y-3 mb-6 text-sm">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">المجموع الجزئي</span>
                <span className="font-semibold text-on-surface">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">الشحن</span>
                <span className={shipping === 0 ? 'text-green-600 font-semibold' : 'font-semibold text-on-surface'}>
                  {shipping === 0 ? 'مجاني 🎉' : formatPrice(shipping)}
                </span>
              </div>
              {/* Free shipping progress bar */}
              <div>
                <div className="flex justify-between text-xs mb-1.5 text-primary">
                  {subtotal >= FREE_SHIPPING ? (
                    <span className="font-bold">🎉 حصلتِ على شحن مجاني!</span>
                  ) : (
                    <>
                      <span>أضيفي {formatPrice(FREE_SHIPPING - subtotal)} للشحن المجاني</span>
                      <span>{Math.round((subtotal / FREE_SHIPPING) * 100)}%</span>
                    </>
                  )}
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden bg-surface-container">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min((subtotal / FREE_SHIPPING) * 100, 100)}%`,
                      background: subtotal >= FREE_SHIPPING ? '#22c55e' : '#6f4627',
                    }}
                  />
                </div>
              </div>
              <div className="pt-3 border-t border-outline-variant flex justify-between text-base font-bold text-on-surface">
                <span>الإجمالي</span>
                <span className="text-primary">{formatPrice(total)}</span>
              </div>
            </div>
            <Link href="/checkout" className="block w-full text-center py-4 bg-primary text-white rounded-xl font-medium hover:bg-primary-container transition-colors">
              إتمام الطلب
            </Link>
            <Link href="/products" className="block w-full text-center mt-3 py-3 text-sm text-primary hover:text-primary-container transition-colors">
              متابعة التسوق
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
