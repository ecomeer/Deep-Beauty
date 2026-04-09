'use client'

import { useWishlistContext } from '@/context/WishlistContext'
import { useCartContext } from '@/context/CartContext'
import { toArabicPrice } from '@/lib/utils'
import { HeartIcon, ShoppingBagIcon, TrashIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function WishlistPage() {
  const { items, removeItem, clearWishlist, isLoaded } = useWishlistContext()
  const { addItem } = useCartContext()

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--off-white)' }}>
        <div className="animate-spin w-10 h-10 rounded-full border-4" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  const handleAddToCart = (item: typeof items[0]) => {
    addItem({
      id: item.id,
      name_ar: item.name_ar,
      name_en: item.name_en,
      price: item.price,
      image: item.image,
      quantity: 1,
      slug: item.slug,
    })
    toast.success(`تم إضافة ${item.name_ar} للسلة 🛍️`)
  }

  return (
    <div className="min-h-screen py-12" style={{ background: 'var(--off-white)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            المفضلة
            <span className="text-lg mr-3 opacity-60">({items.length})</span>
          </h1>
          {items.length > 0 && (
            <button
              onClick={clearWishlist}
              className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1"
            >
              <TrashIcon className="w-4 h-4" />
              مسح الكل
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-24 rounded-3xl" style={{ background: 'var(--beige)' }}>
            <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: 'var(--off-white)' }}>
              <HeartSolid className="w-12 h-12 opacity-30" />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              قائمة المفضلة فارغة
            </h2>
            <p className="opacity-60 mb-6">ابدئي التسوق وأضفي منتجاتك المفضلة هنا</p>
            <Link href="/products" className="btn-primary inline-flex">
              تصفح المنتجات
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="relative aspect-square" style={{ background: 'var(--beige)' }}>
                  {item.image ? (
                    <img src={item.image} alt={item.name_ar} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">🧴</div>
                  )}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <TrashIcon className="w-5 h-5 text-red-500" />
                  </button>
                </div>
                <div className="p-4">
                  <Link href={`/products/${item.slug}`}>
                    <h3 className="font-bold mb-1 hover:text-[#9C6644] transition-colors">
                      {item.name_ar}
                    </h3>
                  </Link>
                  <p className="text-sm opacity-50 mb-3">{item.name_en}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold" style={{ color: 'var(--primary)', fontFamily: 'Cormorant Garamond, serif' }}>
                      {toArabicPrice(item.price)}
                    </span>
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors"
                      style={{ background: 'var(--primary)' }}
                    >
                      <ShoppingBagIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
