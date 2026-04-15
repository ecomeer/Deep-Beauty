'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Product } from '@/types'
import { useCartContext } from '@/context/CartContext'
import { useWishlistContext } from '@/context/WishlistContext'
import { useCountry } from '@/context/CountryContext'
import { ShoppingBagIcon, HeartIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolid, CheckIcon, StarIcon } from '@heroicons/react/24/solid'
import { useState } from 'react'
import toast from 'react-hot-toast'
import QuickViewModal from './QuickViewModal'

interface Props {
  product: Product
  salePercentage?: number
}

// Generate consistent rating based on product id
function getProductRating(productId: string): number {
  const ratings = [4.8, 4.9, 5.0, 4.7, 4.9, 5.0, 4.8, 4.9]
  let hash = 0
  for (let i = 0; i < productId.length; i++) {
    hash = ((hash << 5) - hash) + productId.charCodeAt(i)
    hash = hash & hash
  }
  return ratings[Math.abs(hash) % ratings.length]
}

export default function ProductCard({ product, salePercentage }: Props) {
  const { addItem } = useCartContext()
  const { isInWishlist, toggleItem } = useWishlistContext()
  const { formatPrice } = useCountry()
  const [adding, setAdding] = useState(false)
  const [quickViewOpen, setQuickViewOpen] = useState(false)
  const isWishlisted = isInWishlist(product.id)
  const rating = getProductRating(product.id)

  const displayPrice = product.sale_price
    ?? (salePercentage ? product.price * (1 - salePercentage / 100) : product.price)

  const comparePrice = product.sale_price
    ? product.price
    : product.compare_price ?? (salePercentage ? product.price : null)

  const discountPct = salePercentage
    || (product.sale_price ? Math.round((1 - product.sale_price / product.price) * 100) : 0)

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
    toast.success('تم إضافة المنتج للسلة 🛒', { duration: 2000, position: 'bottom-center' })
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
    toast.success(isWishlisted ? 'تم إزالة من المفضلة' : 'تم إضافة للمفضلة ❤️')
  }

  return (
    <>
      <Link href={`/products/${product.slug}`} className="block group">
        <div className="relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">

          {/* Wishlist — top right */}
          <button
            onClick={handleToggleWishlist}
            className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/80 flex items-center justify-center transition-all"
            style={{ color: isWishlisted ? 'var(--primary)' : '#aaa' }}
            aria-label={isWishlisted ? `إزالة ${product.name_ar} من المفضلة` : `إضافة ${product.name_ar} للمفضلة`}
          >
            {isWishlisted ? <HeartSolid className="w-5 h-5" /> : <HeartIcon className="w-5 h-5" />}
          </button>

          {/* Image */}
          <div
            className="relative overflow-hidden"
            style={{ aspectRatio: '1/1', background: 'var(--beige)' }}
          >
            {product.images?.[0] ? (
              <Image
                src={product.images[0]}
                alt={product.name_ar}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                unoptimized={product.images[0].startsWith('http')}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-5xl" aria-hidden="true">🧴</div>
            )}

            {/* Discount badge */}
            {discountPct > 0 && (
              <span
                className="absolute top-3 left-3 text-xs font-bold text-white px-3 py-1 rounded-full"
                style={{ background: 'var(--primary)' }}
              >
                -{discountPct}%
              </span>
            )}

            {/* Out of stock */}
            {product.stock_quantity === 0 && (
              <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                <span className="bg-white text-gray-600 text-xs font-bold px-4 py-2 rounded-full shadow">
                  نفذت الكمية
                </span>
              </div>
            )}

            {/* Add-to-cart circular button — bottom left inside image */}
            <button
              onClick={handleAddToCart}
              disabled={product.stock_quantity === 0 || adding}
              aria-label={product.stock_quantity === 0 ? 'نفذت الكمية' : `إضافة ${product.name_ar} للسلة`}
              className="absolute left-3 bottom-3 z-10 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 disabled:cursor-not-allowed hover:scale-110"
              style={{
                background: product.stock_quantity === 0
                  ? '#C8B8AE'
                  : adding
                  ? '#5a9e6f'
                  : 'var(--primary)',
              }}
            >
              {adding
                ? <CheckIcon className="w-6 h-6 text-white" />
                : <ShoppingBagIcon className="w-6 h-6 text-white" />
              }
            </button>
          </div>

          {/* Content */}
          <div className="px-4 pt-4 pb-4">
            {/* Rating */}
            <div className="flex items-center gap-1 mb-2" aria-label={`تقييم ${rating.toFixed(1)} من 5`}>
              <div className="flex gap-0.5" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon
                    key={star}
                    className="w-3 h-3"
                    style={{
                      color: star <= Math.round(rating) ? '#F59E0B' : '#D1C5BB',
                    }}
                  />
                ))}
              </div>
              <span className="text-xs font-medium" style={{ color: '#9a7a6a' }}>
                {rating.toFixed(1)}
              </span>
            </div>

            <h3
              className="font-bold text-sm mb-2 leading-snug line-clamp-2"
              style={{ color: 'var(--text-dark)' }}
            >
              {product.name_ar}
            </h3>

            <div className="flex items-baseline gap-2">
              <p className="text-base font-bold" style={{ color: 'var(--primary)' }} dir="ltr">
                {formatPrice(displayPrice)}
              </p>
              {comparePrice && comparePrice > displayPrice && (
                <p className="text-xs text-gray-500 line-through" dir="ltr">
                  {formatPrice(comparePrice)}
                </p>
              )}
            </div>
          </div>
        </div>
      </Link>

      <QuickViewModal
        product={product}
        isOpen={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
      />
    </>
  )
}
