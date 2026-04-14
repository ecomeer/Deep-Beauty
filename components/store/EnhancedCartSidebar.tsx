'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useCartContext } from '@/context/CartContext'
import { useCountry } from '@/context/CountryContext'
import { 
  XMarkIcon, 
  TrashIcon, 
  PlusIcon, 
  MinusIcon, 
  ShoppingBagIcon,
  GiftIcon,
  TruckIcon,
  SparklesIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'
import { CheckIcon } from '@heroicons/react/24/solid'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'

// Slide animation for the sidebar
const sidebarVariants = {
  hidden: { x: '100%', opacity: 0 },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: { type: 'spring' as const, damping: 25, stiffness: 200 }
  },
  exit: { 
    x: '100%', 
    opacity: 0,
    transition: { type: 'spring' as const, damping: 25, stiffness: 300 }
  }
}

// Overlay animation
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
}

// Item animation
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, x: -100, transition: { duration: 0.3 } }
}

export default function EnhancedCartSidebar() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, subtotal } = useCartContext()
  const { formatPrice, countryConfig } = useCountry()
  const [recentlyRemoved, setRecentlyRemoved] = useState<string | null>(null)

  // Lock body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

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

  const handleRemove = (id: string) => {
    setRecentlyRemoved(id)
    setTimeout(() => {
      removeItem(id)
      setRecentlyRemoved(null)
    }, 300)
  }

  const progressToFreeShipping = freeThreshold 
    ? Math.min(100, (subtotal / freeThreshold) * 100)
    : 100

  const remainingForFreeShipping = freeThreshold 
    ? Math.max(0, freeThreshold - subtotal)
    : 0

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />

          {/* Sidebar */}
          <motion.div
            variants={sidebarVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F5EBE0] flex items-center justify-center">
                  <ShoppingBagIcon className="w-5 h-5 text-[#9C6644]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">سلة التسوق</h2>
                  <p className="text-sm text-gray-500">
                    {items.length} {items.length === 1 ? 'منتج' : 'منتجات'}
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-gray-500" />
              </motion.button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center h-full text-center py-16 gap-6"
                >
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-24 h-24 rounded-full bg-[#F5EBE0] flex items-center justify-center"
                  >
                    <ShoppingBagIcon className="w-12 h-12 text-[#9C6644]/50" />
                  </motion.div>
                  <div className="space-y-2">
                    <p className="text-xl font-bold text-gray-700">سلة التسوق فارغة</p>
                    <p className="text-gray-500">اكتشفي منتجاتنا وابدئي رحلة العناية ببشرتك</p>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsOpen(false)}
                    className="btn-primary px-8 py-3 flex items-center gap-2"
                  >
                    <SparklesIcon className="w-5 h-5" />
                    تسوق الآن
                  </motion.button>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {items.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        variants={itemVariants}
                        initial="hidden"
                        animate={recentlyRemoved === item.id ? "exit" : "visible"}
                        exit="exit"
                        className="flex gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors group"
                      >
                        {/* Product Image */}
                        <Link 
                          href={`/products/${item.slug}`}
                          onClick={() => setIsOpen(false)}
                          className="relative w-20 h-20 rounded-xl overflow-hidden bg-white flex-shrink-0"
                        >
                          {item.image ? (
                            <Image 
                              src={item.image} 
                              alt={item.name_ar} 
                              fill 
                              className="object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl bg-gradient-to-br from-[#F5EBE0] to-[#E8DED1]">
                              <SparklesIcon className="w-8 h-8 text-[#9C6644]/30" />
                            </div>
                          )}
                        </Link>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <Link 
                            href={`/products/${item.slug}`}
                            onClick={() => setIsOpen(false)}
                            className="block"
                          >
                            <p className="font-semibold text-gray-900 truncate hover:text-[#9C6644] transition-colors">
                              {item.name_ar}
                            </p>
                          </Link>
                          <p className="text-sm text-[#9C6644] font-medium mt-1" dir="ltr">
                            {formatPrice(item.price)}
                          </p>
                          
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2 mt-3">
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              onClick={() => item.quantity > 1 && updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:border-[#9C6644] hover:text-[#9C6644] transition-colors disabled:opacity-50"
                            >
                              <MinusIcon className="w-3 h-3" />
                            </motion.button>
                            <span className="text-sm font-bold w-8 text-center">{item.quantity}</span>
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:border-[#9C6644] hover:text-[#9C6644] transition-colors"
                            >
                              <PlusIcon className="w-3 h-3" />
                            </motion.button>
                          </div>
                        </div>

                        {/* Price & Remove */}
                        <div className="flex flex-col items-end justify-between">
                          <motion.button
                            whileHover={{ scale: 1.1, rotate: 10 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleRemove(item.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </motion.button>
                          <p className="text-sm font-bold text-gray-900" dir="ltr">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="p-6 border-t border-gray-100 bg-white"
              >
                {/* Free Shipping Progress */}
                {freeThreshold && remainingForFreeShipping > 0 && (
                  <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100">
                    <div className="flex items-center gap-2 text-sm text-amber-800 mb-2">
                      <GiftIcon className="w-4 h-4" />
                      <span>أضف <strong>{formatPrice(remainingForFreeShipping)}</strong> للحصول على شحن مجاني!</span>
                    </div>
                    <div className="h-2 bg-amber-200 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progressToFreeShipping}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                      />
                    </div>
                  </div>
                )}

                {freeThreshold && remainingForFreeShipping === 0 && (
                  <motion.div 
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className="mb-4 p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-green-800">🎉 تهانينا!</p>
                      <p className="text-sm text-green-700">لقد حصلت على شحن مجاني</p>
                    </div>
                  </motion.div>
                )}

                {/* Summary */}
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">المجموع الجزئي</span>
                    <span className="font-semibold" dir="ltr">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-1">
                      <TruckIcon className="w-4 h-4" />
                      الشحن
                    </span>
                    <span className={shipping === 0 ? 'text-green-600 font-semibold' : 'font-semibold'} dir="ltr">
                      {shipping === 0 ? 'مجاني 🎉' : formatPrice(shipping)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-100">
                    <span>الإجمالي</span>
                    <span className="text-[#9C6644]" dir="ltr">{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Actions */}
                <Link
                  href="/checkout"
                  onClick={() => setIsOpen(false)}
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 bg-[#9C6644] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#7A5235] transition-colors shadow-lg hover:shadow-xl"
                  >
                    إتمام الطلب
                    <ArrowRightIcon className="w-5 h-5" />
                  </motion.button>
                </Link>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsOpen(false)}
                  className="w-full py-3 mt-2 text-gray-500 hover:text-gray-700 font-medium text-sm transition-colors"
                >
                  متابعة التسوق
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
