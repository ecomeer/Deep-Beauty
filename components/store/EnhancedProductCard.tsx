'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Product } from '@/types'
import { useCartContext } from '@/context/CartContext'
import { useWishlistContext } from '@/context/WishlistContext'
import { useCountry } from '@/context/CountryContext'
import { 
  ShoppingBagIcon, 
  HeartIcon, 
  EyeIcon,
  SparklesIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid'
import { useState } from 'react'
import toast from 'react-hot-toast'
import QuickViewModal from './QuickViewModal'

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
  const [isHovered, setIsHovered] = useState(false)
  const isWishlisted = isInWishlist(product.id)

  // sale_price from API (flash sale) takes priority over salePercentage prop
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
    
    toast.success('تم إضافة المنتج للسلة 🛒', {
      duration: 2000,
      position: 'bottom-center',
    })
    
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

  const discountPercentage = product.sale_price
    ? Math.round((1 - product.sale_price / product.price) * 100)
    : salePercentage || (product.compare_price
      ? Math.round((1 - product.price / product.compare_price) * 100)
      : 0)

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1, duration: 0.5 }}
      >
        <Link href={`/products/${product.slug}`}>
          <div 
            className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Image Container */}
            <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-[#F5EBE0] to-[#E8DED1]">
              {product.images?.[0] ? (
                <motion.div
                  animate={{ scale: isHovered ? 1.08 : 1 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="relative w-full h-full"
                >
                  <Image
                    src={product.images[0]}
                    alt={product.name_ar}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover"
                  />
                </motion.div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <SparklesIcon className="w-16 h-16 text-[#9C6644]/30" />
                </div>
              )}
              
              {/* Gradient Overlay on Hover */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovered ? 1 : 0 }}
                className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"
              />

              {/* Badges */}
              <div className="absolute top-3 right-3 flex flex-col gap-2">
                {discountPercentage > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg"
                  >
                    -{discountPercentage}%
                  </motion.span>
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
              <motion.button
                onClick={handleToggleWishlist}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`absolute top-3 left-3 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors ${
                  isWishlisted 
                    ? 'bg-rose-500 text-white' 
                    : 'bg-white/90 text-gray-600 hover:bg-rose-500 hover:text-white'
                }`}
                aria-label={isWishlisted ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
              >
                {isWishlisted ? <HeartSolid className="w-5 h-5" /> : <HeartIcon className="w-5 h-5" />}
              </motion.button>

              {/* Quick View Button */}
              <motion.button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setQuickViewOpen(true)
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
                transition={{ duration: 0.3 }}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full bg-white text-gray-800 text-sm font-medium shadow-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <EyeIcon className="w-4 h-4" />
                نظرة سريعة
              </motion.button>

              {/* Add to Cart Button (Mobile) */}
              <button
                onClick={handleAddToCart}
                disabled={product.stock_quantity === 0 || adding}
                className="md:hidden absolute bottom-3 right-3 w-10 h-10 rounded-full bg-[#9C6644] text-white flex items-center justify-center shadow-lg disabled:bg-gray-400"
              >
                {adding ? <CheckIcon className="w-5 h-5" /> : <ShoppingBagIcon className="w-5 h-5" />}
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              {/* Category Tag */}
              {product.category && (
                <p className="text-xs text-[#9C6644] font-medium mb-1.5">{product.category}</p>
              )}
              
              {/* Product Name */}
              <h3 className="font-bold text-base mb-1.5 leading-tight line-clamp-2 min-h-[2.5rem]" style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--text-dark)' }}>
                {product.name_ar}
              </h3>
              
              {/* Description */}
              <p className="text-xs text-gray-500 mb-3 line-clamp-2 min-h-[2rem]">
                {product.description_ar || 'منتج طبيعي فاخر للعناية بالبشرة'}
              </p>

              {/* Price & Add to Cart */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-[#9C6644]" dir="ltr">
                    {formatPrice(displayPrice)}
                  </span>
                  {product.sale_price ? (
                    <span className="text-xs text-gray-400 line-through" dir="ltr">
                      {formatPrice(product.price)}
                    </span>
                  ) : product.compare_price ? (
                    <span className="text-xs text-gray-400 line-through" dir="ltr">
                      {formatPrice(product.compare_price)}
                    </span>
                  ) : null}
                </div>
                
                {/* Desktop Add to Cart */}
                <motion.button
                  onClick={handleAddToCart}
                  disabled={product.stock_quantity === 0 || adding}
                  whileHover={{ scale: product.stock_quantity > 0 ? 1.05 : 1 }}
                  whileTap={{ scale: 0.95 }}
                  className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    product.stock_quantity === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : adding
                      ? 'bg-green-500 text-white'
                      : 'bg-[#9C6644] text-white hover:bg-[#7A5235]'
                  }`}
                >
                  {adding ? (
                    <>
                      <CheckIcon className="w-4 h-4" />
                      تمت الإضافة
                    </>
                  ) : (
                    <>
                      <ShoppingBagIcon className="w-4 h-4" />
                      أضف للسلة
                    </>
                  )}
                </motion.button>
              </div>

              {/* Stock Warning */}
              {product.stock_quantity > 0 && product.stock_quantity <= 5 && (
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                  <SparklesIcon className="w-3 h-3" />
                  بقي {product.stock_quantity} قطع فقط!
                </p>
              )}
            </div>
          </div>
        </Link>
      </motion.div>
      
      <QuickViewModal 
        product={product}
        isOpen={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
      />
    </>
  )
}
