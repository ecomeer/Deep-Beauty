'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Product } from '@/types'
import { toArabicPrice } from '@/lib/utils'
import { useCartContext } from '@/context/CartContext'
import { useWishlistContext } from '@/context/WishlistContext'
import { useCountry } from '@/context/CountryContext'
import { ShoppingBagIcon, HeartIcon, EyeIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid'
import { useState } from 'react'
import toast from 'react-hot-toast'
import QuickViewModal from './QuickViewModal'
import { useRouter } from 'next/navigation'

interface Props {
  product: Product
  salePercentage?: number
}

export default function ProductCard({ product, salePercentage }: Props) {
  const { addItem } = useCartContext()
  const { isInWishlist, toggleItem } = useWishlistContext()
  const { formatPrice } = useCountry()
  const [adding, setAdding] = useState(false)
  const [quickViewOpen, setQuickViewOpen] = useState(false)
  const isWishlisted = isInWishlist(product.id)

  const displayPrice = salePercentage
    ? product.price * (1 - salePercentage / 100)
    : product.price

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
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
    setTimeout(() => setAdding(false), 800)
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

  const router = useRouter()

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on buttons
    if ((e.target as HTMLElement).closest('button')) return
    router.push(`/products/${product.slug}`)
  }

  return (
    <>
      <div className="product-card group cursor-pointer" onClick={handleCardClick}>
        <div className="card-top-border" />
        {/* Image */}
        <div className="relative overflow-hidden" style={{ background: 'var(--beige)', aspectRatio: '1/1' }}>
          {product.images?.[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name_ar}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">🧴</div>
          )}
          {/* Badges */}
          <div className="absolute top-3 right-3 flex flex-col gap-1">
            {salePercentage && (
              <span className="badge badge-danger text-xs font-bold">-{salePercentage}%</span>
            )}
            {product.is_featured && !salePercentage && (
              <span className="badge badge-primary text-xs">مميز</span>
            )}
            {product.stock_quantity === 0 && (
              <span className="badge badge-gray text-xs">نفذت الكمية</span>
            )}
          </div>
          {/* Wishlist Button */}
          <button
            onClick={handleToggleWishlist}
            className={`absolute top-3 left-3 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 ${
              isWishlisted ? 'bg-rose-500 text-white' : 'bg-white/90 text-gray-600 hover:text-rose-500'
            }`}
            aria-label={isWishlisted ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
          >
            {isWishlisted ? <HeartSolid className="w-5 h-5" /> : <HeartIcon className="w-5 h-5" />}
          </button>
          {/* Quick View Button */}
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setQuickViewOpen(true)
            }}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/90 hover:bg-white text-sm font-medium shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1"
          >
            <EyeIcon className="w-4 h-4" />
            نظرة سريعة
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {product.category && (
            <p className="text-xs mb-1 font-medium" style={{ color: 'var(--primary)' }}>{product.category}</p>
          )}
          <h3 className="font-bold text-base mb-1 leading-tight" style={{ color: 'var(--text-dark)', fontFamily: 'Cormorant Garamond, serif' }}>
            {product.name_ar}
          </h3>
          <p className="text-xs opacity-60 mb-3 leading-5 line-clamp-2" style={{ color: 'var(--text-dark)' }}>
            {product.description_ar}
          </p>
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-lg font-bold" style={{ color: 'var(--primary)', fontFamily: 'Cormorant Garamond, serif' }}>
                {formatPrice(displayPrice)}
              </span>
              {(product.compare_price || salePercentage) && (
                <span className="text-xs line-through mr-2 opacity-50">
                  {formatPrice(product.compare_price || product.price)}
                </span>
              )}
            </div>
            <button
              onClick={handleAddToCart}
              disabled={product.stock_quantity === 0 || adding}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                product.stock_quantity === 0
                  ? 'opacity-40 cursor-not-allowed bg-gray-100'
                  : adding
                  ? 'scale-95'
                  : 'hover:scale-105'
              }`}
              style={{
                background: product.stock_quantity > 0 ? 'var(--primary)' : undefined,
                color: product.stock_quantity > 0 ? 'white' : undefined,
              }}
            >
              <ShoppingBagIcon className="w-3.5 h-3.5" />
              {adding ? '✓' : 'أضف للسلة'}
            </button>
          </div>
        </div>
      </div>
      
      <QuickViewModal 
        product={product}
        isOpen={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
      />
    </>
  )
}
