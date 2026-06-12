'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Product } from '@/types'
import { useCartContext } from '@/context/CartContext'
import { useWishlistContext } from '@/context/WishlistContext'
import { useCountry } from '@/context/CountryContext'
import {
  ShoppingBagIcon,
  HeartIcon,
  EyeIcon,
  SparklesIcon,
  CheckIcon,
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid'
import { useState, lazy, Suspense } from 'react'
import toast from 'react-hot-toast'

// Lazy-load QuickViewModal — only loaded when user actually clicks "نظرة سريعة"
const QuickViewModal = lazy(() => import('./QuickViewModal'))

interface Props {
  product: Product
  salePercentage?: number
  index?: number
}

export default function EnhancedProductCard({ product, salePercentage, index = 0 }: Props) {
  const { addItem } = useCartContext()
  const { isInWishlist, toggleItem } = useWishlistContext()
  const { formatPrice } = useCountry()
  const [adding, setAdding] = useState(false)
  const [quickViewOpen, setQuickViewOpen] = useState(false)
  const isWishlisted = isInWishlist(product.id)

  const displayPrice = product.sale_price
    ?? (salePercentage ? product.price * (1 - salePercentage / 100) : product.price)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (product.stock_quantity === 0) return
    setAdding(true)
    addItem({
      id: product.id,
      name_ar: product.name_ar,
      name_en: product.name_en,
      price: displayPrice,
      image: product.images?.[0] || '',
      quantity: 1,
      slug: product.slug,
    })
    toast.success('أُضيف للسلة 🛒', { duration: 2000, position: 'bottom-center' })
    setTimeout(() => setAdding(false), 1500)
  }

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleItem({
      id: product.id,
      name_ar: product.name_ar,
      name_en: product.name_en,
      price: displayPrice,
      image: product.images?.[0] || '',
      slug: product.slug,
    })
    toast.success(isWishlisted ? 'أُزيل من المفضلة' : 'أُضيف للمفضلة ❤️')
  }

  const discountPercentage = product.sale_price
    ? Math.round((1 - product.sale_price / product.price) * 100)
    : salePercentage || (product.compare_price
      ? Math.round((1 - product.price / product.compare_price) * 100)
      : 0)

  return (
    <>
      {/* Pure CSS card — no framer-motion overhead */}
      <div
        className="opacity-0 animate-fadeInUp"
        style={{ animationDelay: `${Math.min(index * 60, 400)}ms`, animationFillMode: 'forwards' }}
      >
        <Link href={`/products/${product.slug}`} className="group block">
          <div className="relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300">

            {/* Image Container */}
            <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-[var(--beige)] to-[var(--dark-beige)]">
              {product.images?.[0] ? (
                <Image
                  src={product.images[0]}
                  alt={product.name_ar}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  loading={index < 4 ? 'eager' : 'lazy'}
                  quality={80}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <SparklesIcon className="w-16 h-16 text-primary/30" />
                </div>
              )}

              {/* Gradient on hover — CSS only */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Badges */}
              <div className="absolute top-3 right-3 flex flex-col gap-2">
                {discountPercentage > 0 && (
                  <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg">
                    -{discountPercentage}%
                  </span>
                )}
                {product.is_featured && !discountPercentage && (
                  <span className="px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1">
                    <SparklesIcon className="w-3 h-3" />
                    مميز
                  </span>
                )}
                {product.stock_quantity === 0 && (
                  <span className="px-3 py-1 bg-gray-500 text-white text-xs font-bold rounded-full shadow-lg">
                    نفذت الكمية
                  </span>
                )}
              </div>

              {/* Wishlist Button */}
              <button
                onClick={handleToggleWishlist}
                className={`absolute top-3 left-3 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors duration-200 ${
                  isWishlisted
                    ? 'bg-rose-500 text-white'
                    : 'bg-white/90 text-gray-600 hover:bg-rose-500 hover:text-white'
                }`}
                aria-label={isWishlisted ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
              >
                {isWishlisted ? <HeartSolid className="w-5 h-5" /> : <HeartIcon className="w-5 h-5" />}
              </button>

              {/* Quick View — appears on hover via CSS */}
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQuickViewOpen(true) }}
                aria-label={`نظرة سريعة على ${product.name_ar}`}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full bg-white text-gray-800 text-sm font-medium shadow-lg hover:bg-gray-50 transition-all duration-300 flex items-center gap-2 opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 focus-visible:opacity-100 focus-visible:translate-y-0"
              >
                <EyeIcon className="w-4 h-4" />
                نظرة سريعة
              </button>

              {/* Mobile add-to-cart — 44×44px touch target + aria-label */}
              <button
                onClick={handleAddToCart}
                disabled={product.stock_quantity === 0 || adding}
                aria-label={product.stock_quantity === 0 ? 'نفذت الكمية' : `إضافة ${product.name_ar} للسلة`}
                className="md:hidden absolute bottom-2 right-2 w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center shadow-lg disabled:bg-gray-400 transition-colors"
              >
                {adding ? <CheckIcon className="w-5 h-5" /> : <ShoppingBagIcon className="w-5 h-5" />}
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              {product.category && (
                <p className="text-xs text-primary font-medium mb-1.5">{product.category}</p>
              )}
              <h3
                className="font-bold text-base mb-1.5 leading-tight line-clamp-2 min-h-[2.5rem]"
                style={{ fontFamily: 'var(--font-cormorant), serif', color: 'var(--text-dark)' }}
              >
                {product.name_ar}
              </h3>
              <p className="text-xs text-gray-500 mb-3 line-clamp-2 min-h-[2rem]">
                {product.description_ar || 'منتج طبيعي فاخر للعناية بالبشرة'}
              </p>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-primary" dir="ltr">
                    {formatPrice(displayPrice)}
                  </span>
                  {(product.sale_price || product.compare_price) && (
                    <span className="text-xs text-gray-400 line-through" dir="ltr">
                      {formatPrice(product.sale_price ? product.price : product.compare_price!)}
                    </span>
                  )}
                </div>

                {/* Desktop Add to Cart */}
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock_quantity === 0 || adding}
                  className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors duration-200 ${
                    product.stock_quantity === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : adding
                      ? 'bg-green-500 text-white'
                      : 'bg-primary text-white hover:bg-[var(--primary-hover)]'
                  }`}
                >
                  {adding ? (
                    <><CheckIcon className="w-4 h-4" /> تمت الإضافة</>
                  ) : (
                    <><ShoppingBagIcon className="w-4 h-4" /> أضف للسلة</>
                  )}
                </button>
              </div>

              {product.stock_quantity > 0 && product.stock_quantity <= 5 && (
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                  <SparklesIcon className="w-3 h-3" />
                  بقي {product.stock_quantity} قطع فقط!
                </p>
              )}
            </div>
          </div>
        </Link>
      </div>

      {/* Lazy-load modal only when opened */}
      {quickViewOpen && (
        <Suspense fallback={null}>
          <QuickViewModal
            product={product}
            isOpen={quickViewOpen}
            onClose={() => setQuickViewOpen(false)}
          />
        </Suspense>
      )}
    </>
  )
}
