'use client'

import { useEffect, useState } from 'react'
import { Product } from '@/types'
import { toArabicPrice } from '@/lib/utils'
import { useCartContext } from '@/context/CartContext'
import { useWishlistContext } from '@/context/WishlistContext'
import { useCountry } from '@/context/CountryContext'
import { XMarkIcon, ShoppingBagIcon, HeartIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid'
import Image from 'next/image'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Props {
  product: Product | null
  isOpen: boolean
  onClose: () => void
}

export default function QuickViewModal({ product, isOpen, onClose }: Props) {
  const [quantity, setQuantity] = useState(1)
  const { addItem } = useCartContext()
  const { isInWishlist, toggleItem } = useWishlistContext()
  const { formatPrice } = useCountry()

  useEffect(() => {
    if (isOpen) {
      setQuantity(1)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!product || !isOpen) return null

  const isWishlisted = isInWishlist(product.id)

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name_ar: product.name_ar,
      name_en: product.name_en,
      price: product.price,
      image: product.images?.[0] || '',
      quantity,
      slug: product.slug,
    })
    toast.success(`تم إضافة ${quantity} من ${product.name_ar} للسلة 🛍️`)
    onClose()
  }

  const handleToggleWishlist = () => {
    toggleItem({
      id: product.id,
      name_ar: product.name_ar,
      name_en: product.name_en,
      price: product.price,
      image: product.images?.[0] || '',
      slug: product.slug,
    })
    toast.success(isWishlisted ? 'تم إزالة من المفضلة' : 'تم إضافة للمفضلة ❤️')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-sm transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Image */}
          <div className="relative aspect-square md:aspect-auto md:h-full" style={{ background: 'var(--beige)', minHeight: '300px' }}>
            {product.images?.[0] ? (
              <Image
                src={product.images[0]}
                alt={product.name_ar}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-8xl">🧴</div>
            )}
            {product.stock_quantity === 0 && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="bg-white px-4 py-2 rounded-full font-bold">نفذت الكمية</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6 md:p-8 flex flex-col">
            {product.category && (
              <span className="text-xs font-medium mb-2" style={{ color: 'var(--primary)' }}>
                {product.category}
              </span>
            )}
            
            <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-cormorant), serif' }}>
              {product.name_ar}
            </h2>
            <p className="text-sm opacity-60 mb-4">{product.name_en}</p>

            <div className="text-3xl font-bold mb-6" style={{ color: 'var(--primary)' }} dir="ltr">
              {formatPrice(product.price)}
              {product.compare_price && product.compare_price > product.price && (
                <span className="text-lg line-through mr-3 opacity-40">
                  {formatPrice(product.compare_price)}
                </span>
              )}
            </div>

            {product.description_ar && (
              <p className="text-sm leading-relaxed opacity-80 mb-6 line-clamp-3">
                {product.description_ar}
              </p>
            )}

            {/* Stock */}
            <div className="flex items-center gap-2 mb-6">
              <div className={`w-2 h-2 rounded-full ${product.stock_quantity > 0 ? 'bg-green-500' : 'bg-red-400'}`} />
              <span className="text-sm opacity-70">
                {product.stock_quantity > 0 ? `متوفر (${product.stock_quantity} قطعة)` : 'نفذت الكمية'}
              </span>
            </div>

            {/* Quantity */}
            {product.stock_quantity > 0 && (
              <div className="flex items-center gap-4 mb-6">
                <span className="text-sm font-medium">الكمية:</span>
                <div className="flex items-center gap-2 border rounded-xl p-1" style={{ borderColor: 'var(--dark-beige)' }}>
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-lg hover:bg-gray-50 flex items-center justify-center"
                  >
                    <MinusIcon className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-bold">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                    className="w-8 h-8 rounded-lg hover:bg-gray-50 flex items-center justify-center"
                  >
                    <PlusIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-auto">
              <button
                onClick={handleAddToCart}
                disabled={product.stock_quantity === 0}
                className="btn-primary flex-1 py-4 gap-2 disabled:opacity-50"
              >
                <ShoppingBagIcon className="w-5 h-5" />
                أضف للسلة
              </button>
              <button
                onClick={handleToggleWishlist}
                className={`btn-outline px-4 py-4 ${isWishlisted ? 'text-rose-500 border-rose-500' : ''}`}
              >
                {isWishlisted ? <HeartSolid className="w-5 h-5" /> : <HeartIcon className="w-5 h-5" />}
              </button>
            </div>

            <Link 
              href={`/products/${product.slug}`}
              onClick={onClose}
              className="text-center text-sm mt-4 opacity-60 hover:opacity-100 transition-opacity"
            >
              عرض تفاصيل أكثر ←
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
