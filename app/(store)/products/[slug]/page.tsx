'use client'

import { useState, useEffect } from 'react'
import { useParams, notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Product } from '@/types'
import { toArabicPrice } from '@/lib/utils'
import { useCartContext } from '@/context/CartContext'
import { MinusIcon, PlusIcon, ShoppingBagIcon, HeartIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid'
import ProductCard from '@/components/store/ProductCard'
import toast from 'react-hot-toast'

export default function ProductDetailPage() {
  const params = useParams()
  const slug = params?.slug as string
  const { addItem } = useCartContext()

  const [product, setProduct] = useState<Product | null>(null)
  const [related, setRelated] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState<'desc' | 'ingredients' | 'how'>('desc')
  const [selectedImage, setSelectedImage] = useState(0)
  const [wishlisted, setWishlisted] = useState(false)

  useEffect(() => {
    if (slug) fetchProduct()
  }, [slug])

  async function fetchProduct() {
    const { data } = await supabase.from('products').select('*').eq('slug', slug).single()
    if (!data) { setLoading(false); return }
    setProduct(data)

    const { data: rel } = await supabase
      .from('products')
      .select('*')
      .eq('category', data.category)
      .neq('id', data.id)
      .eq('is_active', true)
      .limit(3)
    setRelated(rel || [])
    setLoading(false)
  }

  const handleAddToCart = () => {
    if (!product) return
    addItem({
      id: product.id,
      name_ar: product.name_ar,
      name_en: product.name_en,
      price: product.price,
      image: product.images?.[0] || '',
      quantity,
      slug: product.slug,
    })
    toast.success(`تم إضافة ${product.name_ar} للسلة 🛍️`)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
    </div>
  )

  if (!product) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="text-6xl">😕</div>
      <h2 className="text-2xl font-bold">المنتج غير موجود</h2>
    </div>
  )

  const images = product.images?.length > 0 ? product.images : ['']

  return (
    <div className="min-h-screen" style={{ background: 'var(--off-white)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Images */}
          <div className="space-y-3">
            <div className="rounded-3xl overflow-hidden aspect-square flex items-center justify-center" style={{ background: 'var(--beige)' }}>
              {images[selectedImage] ? (
                <img src={images[selectedImage]} alt={product.name_ar} className="w-full h-full object-cover" />
              ) : (
                <div className="text-8xl">🧴</div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${selectedImage === i ? 'border-[#9C6644]' : 'border-transparent'}`}
                    style={{ background: 'var(--beige)' }}
                  >
                    {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">🧴</div>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-6">
            {product.category && (
              <span className="badge badge-primary">{product.category}</span>
            )}
            <h1 className="text-4xl md:text-5xl font-bold leading-tight" style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--text-dark)' }}>
              {product.name_ar}
            </h1>
            <p className="text-lg opacity-60 font-en" style={{ color: 'var(--text-dark)' }}>{product.name_en}</p>

            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold" style={{ color: 'var(--primary)', fontFamily: 'Cormorant Garamond, serif' }}>
                {toArabicPrice(product.price)}
              </span>
              {product.compare_price && (
                <span className="text-xl line-through opacity-40" style={{ color: 'var(--text-dark)' }}>
                  {toArabicPrice(product.compare_price)}
                </span>
              )}
            </div>

            {product.description_ar && (
              <p className="leading-8 opacity-80 text-sm" style={{ color: 'var(--text-dark)' }}>{product.description_ar}</p>
            )}

            {/* Stock */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${product.stock_quantity > 0 ? 'bg-green-500' : 'bg-red-400'}`} />
              <span className="text-sm opacity-70">
                {product.stock_quantity > 0 ? `متوفر (${product.stock_quantity} قطعة)` : 'نفذت الكمية'}
              </span>
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium" style={{ color: 'var(--text-dark)' }}>الكمية:</span>
              <div className="flex items-center gap-2 border rounded-xl p-1" style={{ borderColor: 'var(--dark-beige)' }}>
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 rounded-lg hover:bg-gray-50 flex items-center justify-center">
                  <MinusIcon className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-bold">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))} className="w-8 h-8 rounded-lg hover:bg-gray-50 flex items-center justify-center">
                  <PlusIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button onClick={handleAddToCart} disabled={product.stock_quantity === 0} className="btn-primary flex-1 py-4 text-base gap-2">
                <ShoppingBagIcon className="w-5 h-5" />
                أضف للسلة
              </button>
              <button onClick={() => setWishlisted(!wishlisted)} className="btn-outline px-4 py-4">
                {wishlisted ? <HeartSolid className="w-5 h-5 text-red-500" /> : <HeartIcon className="w-5 h-5" />}
              </button>
            </div>

            {/* Tabs */}
            <div className="border-t pt-6" style={{ borderColor: 'var(--beige)' }}>
              <div className="flex gap-1 mb-4 border-b" style={{ borderColor: 'var(--beige)' }}>
                {([['desc', 'الوصف'], ['ingredients', 'المكونات'], ['how', 'طريقة الاستخدام']] as const).map(([tab, label]) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === tab ? 'border-[#9C6644] text-[#9C6644]' : 'border-transparent opacity-60'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="text-sm leading-8 opacity-80" style={{ color: 'var(--text-dark)' }}>
                {activeTab === 'desc' && (product.description_ar || 'لا يوجد وصف')}
                {activeTab === 'ingredients' && (product.ingredients_ar || 'لا توجد مكونات مضافة')}
                {activeTab === 'how' && 'ضعي كمية مناسبة على البشرة النظيفة ودلكي بلطف بحركات دائرية حتى الامتصاص الكامل.'}
              </div>
            </div>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div>
            <h2 className="section-title mb-8">منتجات مشابهة</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
