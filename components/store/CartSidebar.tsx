'use client'

import { useCartContext } from '@/context/CartContext'
import { useCountry } from '@/context/CountryContext'
import { XMarkIcon, TrashIcon, PlusIcon, MinusIcon, ShoppingBagIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import Image from 'next/image'

export default function CartSidebar() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, subtotal } = useCartContext()
  const { formatPrice, countryConfig } = useCountry()

  // Shipping costs based on country (in KWD, will be converted)
  const SHIPPING_COSTS: Record<string, number> = {
    'KW': 0,      // Free shipping in Kuwait
    'SA': 2.5,
    'AE': 2.5,
    'QA': 3,
    'BH': 2.5,
    'OM': 3.5
  }
  
  // Free shipping thresholds based on country (in KWD)
  const FREE_SHIPPING_THRESHOLDS: Record<string, number | null> = {
    'KW': null,   // Always free in Kuwait
    'SA': 50,
    'AE': 50,
    'QA': 50,
    'BH': 50,
    'OM': 60
  }
  
  const countryCode = countryConfig.code
  const shippingCost = SHIPPING_COSTS[countryCode] ?? 2.5
  const freeThreshold = FREE_SHIPPING_THRESHOLDS[countryCode]
  const shipping = freeThreshold && subtotal >= freeThreshold ? 0 : shippingCost
  const total = subtotal + shipping

  if (!isOpen) return null

  return (
    <>
      <div className="cart-overlay" onClick={() => setIsOpen(false)} />
      <div className="cart-drawer flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--beige)' }}>
          <div className="flex items-center gap-2">
            <ShoppingBagIcon className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            <h2 className="text-lg font-bold" style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--text-dark)' }}>
              سلة التسوق
            </h2>
            {items.length > 0 && (
              <span className="badge badge-primary">{items.length}</span>
            )}
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16 gap-4">
              <ShoppingBagIcon className="w-16 h-16" style={{ color: 'var(--dark-beige)' }} />
              <p className="text-gray-500">سلة التسوق فارغة</p>
              <button onClick={() => setIsOpen(false)} className="btn-primary text-sm px-5 py-2">
                تسوق الآن
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-3 p-3 rounded-xl" style={{ background: 'var(--off-white)' }}>
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 relative" style={{ background: 'var(--beige)' }}>
                  {item.image ? (
                    <Image src={item.image} alt={item.name_ar} fill sizes="64px" className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🧴</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-dark)' }}>{item.name_ar}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--primary)' }} dir="ltr">{formatPrice(item.price)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-6 h-6 rounded-full border flex items-center justify-center transition-colors hover:border-[#9C6644]"
                      style={{ borderColor: 'var(--dark-beige)' }}
                    >
                      <MinusIcon className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-6 h-6 rounded-full border flex items-center justify-center transition-colors hover:border-[#9C6644]"
                      style={{ borderColor: 'var(--dark-beige)' }}
                    >
                      <PlusIcon className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                  <p className="text-sm font-bold" style={{ color: 'var(--text-dark)' }} dir="ltr">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 border-t space-y-3" style={{ borderColor: 'var(--beige)' }}>
            {freeThreshold && subtotal < freeThreshold && (
              <div className="text-xs text-center py-2 px-3 rounded-lg" style={{ background: 'rgba(156,102,68,0.08)', color: 'var(--primary)' }}>
                أضف {formatPrice(freeThreshold - subtotal)} للحصول على شحن مجاني! 🎁
              </div>
            )}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: '#7a6055' }}>المجموع الجزئي</span>
                <span className="font-semibold" dir="ltr">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#7a6055' }}>الشحن</span>
                <span className={shipping === 0 ? 'text-green-600 font-semibold' : 'font-semibold'} dir="ltr">
                  {shipping === 0 ? 'مجاني 🎉' : formatPrice(shipping)}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold pt-2 border-t" style={{ borderColor: 'var(--beige)', color: 'var(--text-dark)' }}>
                <span>الإجمالي</span>
                <span style={{ color: 'var(--primary)' }} dir="ltr">{formatPrice(total)}</span>
              </div>
            </div>
            <Link
              href="/checkout"
              onClick={() => setIsOpen(false)}
              className="btn-primary w-full text-center py-4 font-bold text-sm"
            >
              إتمام الطلب ←
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              className="btn-ghost w-full text-sm py-2"
            >
              متابعة التسوق
            </button>
          </div>
        )}
      </div>
    </>
  )
}
