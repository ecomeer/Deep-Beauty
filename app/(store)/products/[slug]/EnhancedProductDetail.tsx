'use client'

import { useState, useEffect } from 'react'
import { useParams, notFound } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

import { Product } from '@/types'
import { useCartContext } from '@/context/CartContext'
import { useCountry } from '@/context/CountryContext'
import { 
  MinusIcon, 
  PlusIcon, 
  ShoppingBagIcon, 
  HeartIcon,
  ShareIcon,
  CheckIcon,
  TruckIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid'
import EnhancedProductCard from '@/components/store/EnhancedProductCard'
import ProductReviews from '@/components/store/ProductReviews'
import toast from 'react-hot-toast'
import Image from 'next/image'
import Link from 'next/link'

// Trust Features
const TRUST_FEATURES = [
  { icon: TruckIcon, title: 'شحن مجاني', desc: 'للطلبات فوق 20 د.ك' },
  { icon: ShieldCheckIcon, title: 'ضمان الجودة', desc: 'منتجات طبيعية 100%' },
  { icon: SparklesIcon, title: 'صنع في الكويت', desc: 'بأيدٍ محلية' },
]

export default function EnhancedProductDetail() {
  const params = useParams()
  const slug = params?.slug as string
  const { addItem } = useCartContext()
  const { formatPrice } = useCountry()

  const [product, setProduct] = useState<Product | null>(null)
  const [related, setRelated] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState<'desc' | 'ingredients' | 'how'>('desc')
  const [selectedImage, setSelectedImage] = useState(0)
  const [wishlisted, setWishlisted] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)
  const [addingToCart, setAddingToCart] = useState(false)

  useEffect(() => {
    if (slug) fetchProduct()
  }, [slug])

  async function fetchProduct() {
    setLoading(true)
    try {
      const res = await fetch(`/api/products/${slug}`)
      if (!res.ok) { setLoading(false); return }
      const json = await res.json()
      setProduct(json.product)
      setRelated(json.related || [])
    } catch {
      // product not found
    }
    setLoading(false)
  }

  const handleAddToCart = () => {
    if (!product || product.stock_quantity === 0) return
    
    setAddingToCart(true)
    addItem({
      id: product.id,
      name_ar: product.name_ar,
      name_en: product.name_en,
      price: product.sale_price ?? product.price,
      image: product.images?.[0] || '',
      quantity,
      slug: product.slug,
    })
    
    toast.success(`تم إضافة ${quantity} ${product.name_ar} للسلة 🛍️`, {
      duration: 3000,
      position: 'bottom-center',
    })
    
    setTimeout(() => setAddingToCart(false), 1500)
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('تم نسخ رابط المنتج 📋')
    } catch {
      toast.error('حدث خطأ أثناء النسخ')
    }
  }

  const discountPercentage = product?.compare_price 
    ? Math.round((1 - product.price / product.compare_price) * 100)
    : 0

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-4 border-[#9C6644] border-t-transparent animate-spin" />
    </div>
  )

  if (!product) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="text-6xl">😕</div>
      <h2 className="text-2xl font-bold">المنتج غير موجود</h2>
      <Link href="/products" className="text-[#9C6644] hover:underline">
        عودة للمنتجات
      </Link>
    </div>
  )

  const images = product.images?.length > 0 ? product.images : ['']

  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-[72px]">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-[#9C6644]">الرئيسية</Link>
          <ArrowRightIcon className="w-4 h-4 rotate-180" />
          <Link href="/products" className="hover:text-[#9C6644]">المنتجات</Link>
          {product.category && (
            <>
              <ArrowRightIcon className="w-4 h-4 rotate-180" />
              <span className="hover:text-[#9C6644]">{product.category}</span>
            </>
          )}
          <ArrowRightIcon className="w-4 h-4 rotate-180" />
          <span className="text-gray-900 font-medium">{product.name_ar}</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-20">
          {/* Images Gallery */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            {/* Main Image */}
            <div 
              className="relative rounded-3xl overflow-hidden aspect-square bg-gradient-to-br from-[#F5EBE0] to-[#E8DED1] cursor-zoom-in"
              onClick={() => setIsZoomed(!isZoomed)}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative w-full h-full"
                >
                  {images[selectedImage] ? (
                    <Image
                      src={images[selectedImage]}
                      alt={product.name_ar}
                      fill
                      className={`object-cover transition-transform duration-500 ${isZoomed ? 'scale-150' : 'scale-100'}`}
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      priority
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <SparklesIcon className="w-24 h-24 text-[#9C6644]/30" />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
              
              {/* Discount Badge */}
              {discountPercentage > 0 && (
                <div className="absolute top-4 left-4 px-4 py-2 bg-red-500 text-white rounded-full font-bold shadow-lg">
                  خصم {discountPercentage}%
                </div>
              )}
              
              {/* Zoom Hint */}
              <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/50 text-white text-xs rounded-full">
                انقر للتكبير
              </div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedImage(i)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                      selectedImage === i 
                        ? 'border-[#9C6644] ring-2 ring-[#9C6644]/20' 
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#F5EBE0] to-[#E8DED1]">
                      {img ? (
                        <Image
                          src={img}
                          alt=""
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <SparklesIcon className="w-6 h-6 text-[#9C6644]/30" />
                        </div>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-6"
          >
            {/* Category & Badges */}
            <div className="flex items-center gap-3 flex-wrap">
              {product.category && (
                <span className="px-3 py-1 bg-[#9C6644]/10 text-[#9C6644] text-sm font-medium rounded-full">
                  {product.category}
                </span>
              )}
              {product.is_featured && (
                <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm font-medium rounded-full flex items-center gap-1">
                  <SparklesIcon className="w-4 h-4" />
                  مميز
                </span>
              )}
            </div>

            {/* Title */}
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-2" style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--text-dark)' }}>
                {product.name_ar}
              </h1>
              <p className="text-lg text-gray-500">{product.name_en}</p>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-4">
              <span className="text-4xl md:text-5xl font-bold text-[#9C6644]" dir="ltr">
                {formatPrice(product.sale_price ?? product.price)}
              </span>
              {product.sale_price ? (
                <span className="text-2xl line-through text-gray-400" dir="ltr">
                  {formatPrice(product.price)}
                </span>
              ) : product.compare_price ? (
                <span className="text-2xl line-through text-gray-400" dir="ltr">
                  {formatPrice(product.compare_price)}
                </span>
              ) : null}
            </div>

            {/* Trust Features */}
            <div className="grid grid-cols-3 gap-4 py-4 border-y border-gray-100">
              {TRUST_FEATURES.map((feature, i) => (
                <div key={i} className="text-center">
                  <feature.icon className="w-6 h-6 text-[#9C6644] mx-auto mb-2" />
                  <p className="text-sm font-medium">{feature.title}</p>
                  <p className="text-xs text-gray-500">{feature.desc}</p>
                </div>
              ))}
            </div>

            {/* Short Description */}
            {product.description_ar && (
              <p className="text-gray-600 leading-relaxed">
                {product.description_ar.slice(0, 150)}...
              </p>
            )}

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${product.stock_quantity > 0 ? 'bg-green-500' : 'bg-red-400'} animate-pulse`} />
              <span className={`font-medium ${product.stock_quantity > 0 ? 'text-green-600' : 'text-red-500'}`}>
                {product.stock_quantity > 0 
                  ? `متوفر في المخزن (${product.stock_quantity} قطعة)` 
                  : 'نفذت الكمية'}
              </span>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-4">
              <span className="font-medium">الكمية:</span>
              <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-1">
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                  className="w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <MinusIcon className="w-5 h-5" />
                </motion.button>
                <span className="w-12 text-center font-bold text-lg">{quantity}</span>
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))} 
                  className="w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                  disabled={quantity >= product.stock_quantity}
                >
                  <PlusIcon className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <motion.button 
                onClick={handleAddToCart} 
                disabled={product.stock_quantity === 0 || addingToCart}
                whileHover={{ scale: product.stock_quantity > 0 ? 1.02 : 1 }}
                whileTap={{ scale: 0.98 }}
                className={`flex-1 py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2 transition-all ${
                  product.stock_quantity === 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : addingToCart
                    ? 'bg-green-500 text-white'
                    : 'bg-[#9C6644] text-white hover:bg-[#7A5235] shadow-lg hover:shadow-xl'
                }`}
              >
                {addingToCart ? (
                  <>
                    <CheckIcon className="w-6 h-6" />
                    تمت الإضافة للسلة
                  </>
                ) : (
                  <>
                    <ShoppingBagIcon className="w-6 h-6" />
                    أضف للسلة
                  </>
                )}
              </motion.button>
              
              <motion.button 
                onClick={() => setWishlisted(!wishlisted)} 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-6 py-4 rounded-xl border-2 transition-all ${
                  wishlisted 
                    ? 'border-rose-500 bg-rose-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {wishlisted ? (
                  <HeartSolid className="w-6 h-6 text-rose-500" />
                ) : (
                  <HeartIcon className="w-6 h-6 text-gray-600" />
                )}
              </motion.button>
              
              <motion.button 
                onClick={handleShare}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all"
              >
                <ShareIcon className="w-6 h-6 text-gray-600" />
              </motion.button>
            </div>

            {/* Tabs */}
            <div className="pt-6">
              <div className="flex gap-1 border-b border-gray-200">
                {([
                  ['desc', 'الوصف والتفاصيل'], 
                  ['ingredients', 'المكونات'], 
                  ['how', 'طريقة الاستخدام']
                ] as const).map(([tab, label]) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                      activeTab === tab 
                        ? 'border-[#9C6644] text-[#9C6644]' 
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              
              <AnimatePresence mode="wait">
                <motion.div 
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="py-6 text-gray-600 leading-relaxed"
                >
                  {activeTab === 'desc' && (
                    <div className="space-y-4">
                      <p>{product.description_ar || 'لا يوجد وصف مفصل'}</p>
                      <ul className="list-disc list-inside space-y-2 mr-4">
                        <li>مناسب لجميع أنواع البشرة</li>
                        <li>خالٍ من البارابين والسلفات</li>
                        <li>لم يتم اختباره على الحيوانات</li>
                        <li>تغليف صديق للبيئة</li>
                      </ul>
                    </div>
                  )}
                  {activeTab === 'ingredients' && (
                    <div>
                      <p className="mb-4">{product.ingredients_ar || 'المكونات طبيعية 100%'}</p>
                      <div className="flex flex-wrap gap-2">
                        {['ماء', 'جلسرين', 'زيت الأرغان', 'فيتامين E', 'الصبار'].map((ing) => (
                          <span key={ing} className="px-3 py-1 bg-[#F5EBE0] text-[#9C6644] rounded-full text-sm">
                            {ing}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {activeTab === 'how' && (
                    <ol className="list-decimal list-inside space-y-3 mr-4">
                      <li>نظفي بشرتك جيداً بالغسول المناسب</li>
                      <li>ضعي كمية مناسبة على الوجه والرقبة</li>
                      <li>دلكي بلطف بحركات دائرية صاعدة</li>
                      <li>انتظري حتى الامتصاص الكامل (2-3 دقائق)</li>
                      <li>استخدمي صباحاً ومساءً للحصول على أفضل نتيجة</li>
                    </ol>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* Reviews Section */}
        <ProductReviews productId={product.id} />

        {/* Related Products */}
        {related.length > 0 && (
          <motion.section 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-20"
          >
            <div className="text-center mb-10">
              <span className="text-[#9C6644] text-sm font-medium">قد يعجبك أيضاً</span>
              <h2 className="text-3xl font-bold mt-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                منتجات مشابهة
              </h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {related.map((relProduct, i) => (
                <EnhancedProductCard key={relProduct.id} product={relProduct} index={i} />
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  )
}
