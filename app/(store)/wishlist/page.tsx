'use client'

import { useWishlistContext } from '@/context/WishlistContext'
import { useCartContext } from '@/context/CartContext'
import { useCountry } from '@/context/CountryContext'
import { HeartIcon, ShoppingBagIcon, TrashIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid'
import Image from 'next/image'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function WishlistPage() {
  const { items, removeItem, clearWishlist, isLoaded } = useWishlistContext()
  const { addItem } = useCartContext()
  const { formatPrice } = useCountry()

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface pt-32">
        <div className="animate-spin w-10 h-10 rounded-full border-4 border-primary border-t-transparent" />
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
    <div className="min-h-screen py-12 bg-surface pt-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-headline text-on-surface">
            المفضلة
            <span className="text-lg mr-3 text-on-surface-variant">({items.length})</span>
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
          <div className="text-center py-24 rounded-3xl bg-surface-container-low">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center bg-surface">
              <HeartSolid className="w-12 h-12 text-outline" />
            </div>
            <h2 className="text-2xl font-headline mb-2 text-on-surface">
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
                    <Image src={item.image} alt={item.name_ar} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" />
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
                    <h3 className="font-bold mb-1 text-on-surface hover:text-primary transition-colors">
                      {item.name_ar}
                    </h3>
                  </Link>
                  <p className="text-sm text-on-surface-variant mb-3">{item.name_en}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-primary">
                      {formatPrice(item.price)}
                    </span>
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white bg-primary hover:bg-primary-container transition-colors"
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
