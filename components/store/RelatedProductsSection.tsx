'use client'

import { useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ChevronRightIcon, ChevronLeftIcon, ShoppingBagIcon, HeartIcon, StarIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid'
import { Product } from '@/types'
import { useCartContext } from '@/context/CartContext'
import { useWishlistContext } from '@/context/WishlistContext'
import { useCountry } from '@/context/CountryContext'
import toast from 'react-hot-toast'

interface Props {
  related: Product[]
  currentCategory?: string
}

// Consistent star rating based on product id
function getRating(productId: string): number {
  const ratings = [4.7, 4.8, 4.9, 5.0, 4.8, 4.9]
  let hash = 0
  for (let i = 0; i < productId.length; i++) {
    hash = ((hash << 5) - hash) + productId.charCodeAt(i)
    hash = hash & hash
  }
  return ratings[Math.abs(hash) % ratings.length]
}

function RelatedCard({ product, index, currentCategory }: {
  product: Product
  index: number
  currentCategory?: string
}) {
  const { addItem } = useCartContext()
  const { isInWishlist, toggleItem } = useWishlistContext()
  const { formatPrice } = useCountry()
  const [adding, setAdding] = useState(false)
  const isWishlisted = isInWishlist(product.id)
  const isSameCategory = product.category === currentCategory
  const rating = getRating(product.id)
  const displayPrice = product.sale_price ?? product.price
  const originalPrice = product.sale_price ? product.price : product.compare_price
  const discountPct = originalPrice ? Math.round((1 - displayPrice / originalPrice) * 100) : 0

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (product.stock_quantity === 0 || adding) return
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
    toast.success('تم إضافة المنتج للسلة 🛒', { duration: 2000, position: 'bottom-center' })
    setTimeout(() => setAdding(false), 1500)
  }

  const handleWishlist = (e: React.MouseEvent) => {
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
    toast.success(isWishlisted ? 'تم الإزالة من المفضلة' : 'تم الإضافة للمفضلة ❤️', {
      position: 'bottom-center',
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="flex-shrink-0 w-56 sm:w-64"
    >
      <Link href={`/products/${product.slug}`} className="block group">
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-transparent hover:border-[var(--beige)]">

          {/* Image */}
          <div className="relative overflow-hidden" style={{ aspectRatio: '4/3', background: 'linear-gradient(135deg, var(--beige), var(--dark-beige))' }}>
            {product.images?.[0] ? (
              <Image
                src={product.images[0]}
                alt={product.name_ar}
                fill
                sizes="260px"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-5xl">🧴</div>
            )}

            {/* Badges overlay */}
            <div className="absolute top-2 right-2 flex flex-col gap-1.5">
              {isSameCategory && product.category && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full text-white" style={{ background: 'var(--primary)' }}>
                  {product.category}
                </span>
              )}
              {discountPct > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500 text-white">
                  -{discountPct}%
                </span>
              )}
            </div>

            {/* Wishlist */}
            <button
              onClick={handleWishlist}
              aria-label={isWishlisted ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
              className="absolute top-2 left-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200"
              style={{ color: isWishlisted ? 'var(--primary)' : '#aaa' }}
            >
              {isWishlisted
                ? <HeartSolid className="w-4 h-4" />
                : <HeartIcon className="w-4 h-4" />
              }
            </button>

            {/* Quick add overlay */}
            <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <button
                onClick={handleAdd}
                disabled={product.stock_quantity === 0 || adding}
                className="w-full py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-colors"
                style={{ background: adding ? '#22c55e' : 'var(--primary)' }}
              >
                {adding ? (
                  '✓ تمت الإضافة'
                ) : product.stock_quantity === 0 ? (
                  'نفذت الكمية'
                ) : (
                  <>
                    <ShoppingBagIcon className="w-4 h-4" />
                    أضف للسلة
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="p-3 space-y-1.5">
            {/* Rating */}
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(s => (
                <StarIcon
                  key={s}
                  className={`w-3 h-3 ${s <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                />
              ))}
              <span className="text-[10px] text-gray-500 mr-0.5">{rating}</span>
            </div>

            {/* Name */}
            <p className="text-sm font-semibold leading-snug line-clamp-2" style={{ color: 'var(--text-dark)' }}>
              {product.name_ar}
            </p>
            {product.name_en && (
              <p className="text-[10px]" style={{ color: 'var(--on-surface-variant)' }}>
                {product.name_en}
              </p>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-2 pt-0.5">
              <span className="text-base font-bold" style={{ color: 'var(--primary)' }} dir="ltr">
                {formatPrice(displayPrice)}
              </span>
              {originalPrice && (
                <span className="text-xs text-gray-400 line-through" dir="ltr">
                  {formatPrice(originalPrice)}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default function RelatedProductsSection({ related, currentCategory }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 10)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10)
  }, [])

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    const amount = el.clientWidth * 0.75
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
    setTimeout(updateScrollState, 400)
  }

  return (
    <section className="mt-16 pb-4">
      {/* Header */}
      <div className="flex items-end justify-between mb-7">
        <div>
          <p className="text-xs uppercase tracking-widest font-semibold mb-1.5" style={{ color: 'var(--primary)' }}>
            قد يعجبك أيضاً
          </p>
          <h2
            className="text-3xl md:text-4xl font-bold leading-tight"
            style={{ fontFamily: 'var(--font-cormorant), serif', color: 'var(--text-dark)' }}
          >
            منتجات مشابهة
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Nav arrows */}
          <div className="flex gap-2">
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollLeft}
              aria-label="السابق"
              className="w-9 h-9 rounded-full border flex items-center justify-center transition-all disabled:opacity-30 hover:bg-[var(--beige)]"
              style={{ borderColor: 'var(--dark-beige)' }}
            >
              <ChevronRightIcon className="w-4 h-4" style={{ color: 'var(--text-dark)' }} />
            </button>
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollRight}
              aria-label="التالي"
              className="w-9 h-9 rounded-full border flex items-center justify-center transition-all disabled:opacity-30 hover:bg-[var(--beige)]"
              style={{ borderColor: 'var(--dark-beige)' }}
            >
              <ChevronLeftIcon className="w-4 h-4" style={{ color: 'var(--text-dark)' }} />
            </button>
          </div>

          <Link
            href="/products"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-medium py-2 px-4 rounded-xl border transition-all hover:bg-[var(--beige)]"
            style={{ color: 'var(--primary)', borderColor: 'var(--dark-beige)' }}
          >
            عرض الكل
            <ChevronLeftIcon className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Decorative line */}
      <div className="h-px mb-7" style={{ background: 'linear-gradient(to left, transparent, var(--dark-beige), transparent)' }} />

      {/* Scrollable track */}
      <div
        ref={scrollRef}
        onScroll={updateScrollState}
        className="flex gap-4 overflow-x-auto pb-4 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        dir="rtl"
      >
        {related.map((p, i) => (
          <RelatedCard
            key={p.id}
            product={p}
            index={i}
            currentCategory={currentCategory}
          />
        ))}
      </div>

      {/* Mobile "view all" */}
      <div className="mt-4 flex justify-center sm:hidden">
        <Link
          href="/products"
          className="text-sm font-medium py-2.5 px-6 rounded-xl border transition-all"
          style={{ color: 'var(--primary)', borderColor: 'var(--dark-beige)' }}
        >
          عرض كل المنتجات
        </Link>
      </div>
    </section>
  )
}
