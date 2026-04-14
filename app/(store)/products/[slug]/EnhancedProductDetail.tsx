'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Product } from '@/types'
import { useCartContext } from '@/context/CartContext'
import { useCountry } from '@/context/CountryContext'
import { useWishlistContext } from '@/context/WishlistContext'
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
  SparklesIcon,
  MagnifyingGlassPlusIcon,
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolid, StarIcon } from '@heroicons/react/24/solid'
import EnhancedProductCard from '@/components/store/EnhancedProductCard'
import ProductReviews from '@/components/store/ProductReviews'
import { PaymentIconsRow } from '@/components/store/PaymentIcons'
import toast from 'react-hot-toast'

// ─── Trust Features ────────────────────────────────────────────────────────
const TRUST = [
  { Icon: TruckIcon,      title: 'شحن مجاني',     desc: 'للطلبات فوق 20 د.ك' },
  { Icon: ShieldCheckIcon, title: 'ضمان الجودة',   desc: '100٪ طبيعي' },
  { Icon: SparklesIcon,   title: 'صنع في الكويت',  desc: 'بأيدٍ محلية' },
]

// ─── Loading Skeleton ──────────────────────────────────────────────────────
function ProductSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--off-white)] pt-[var(--nav-height)]">
      <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="skeleton aspect-square rounded-3xl" />
          <div className="space-y-4">
            <div className="skeleton h-6 w-24 rounded-full" />
            <div className="skeleton h-12 w-3/4 rounded-xl" />
            <div className="skeleton h-8 w-1/3 rounded-xl" />
            <div className="skeleton h-32 rounded-xl" />
            <div className="skeleton h-12 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EnhancedProductDetail() {
  const params = useParams()
  const slug = params?.slug as string
  const { addItem } = useCartContext()
  const { formatPrice } = useCountry()
  const { isInWishlist, toggleItem } = useWishlistContext()

  const [product, setProduct] = useState<Product | null>(null)
  const [related, setRelated] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState<'desc' | 'ingredients' | 'how'>('desc')
  const [selectedImage, setSelectedImage] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [addingToCart, setAddingToCart] = useState(false)

  const isWishlisted = product ? isInWishlist(product.id) : false

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
    toast.success(`تم إضافة ${product.name_ar} للسلة 🛍️`, {
      duration: 2500,
      position: 'bottom-center',
      style: {
        background: '#3a2a1e',
        color: 'white',
        borderRadius: '12px',
      },
    })
    setTimeout(() => setAddingToCart(false), 1500)
  }

  const handleToggleWishlist = () => {
    if (!product) return
    toggleItem({
      id: product.id,
      name_ar: product.name_ar,
      name_en: product.name_en,
      price: product.sale_price ?? product.price,
      image: product.images?.[0] || '',
      slug: product.slug,
    })
    toast.success(isWishlisted ? 'تم الإزالة من المفضلة' : 'تم الإضافة للمفضلة ❤️', {
      position: 'bottom-center',
    })
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: product?.name_ar,
          url: window.location.href,
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        toast.success('تم نسخ رابط المنتج 📋', { position: 'bottom-center' })
      }
    } catch { /* user cancelled */ }
  }

  if (loading) return <ProductSkeleton />

  if (!product) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-[var(--off-white)]" style={{ paddingTop: 'var(--nav-height)' }}>
      <div className="text-6xl">🌸</div>
      <h2 className="text-2xl font-bold text-[var(--text-dark)]">المنتج غير موجود</h2>
      <Link
        href="/products"
        className="px-6 py-3 rounded-xl text-white font-medium transition-opacity hover:opacity-90"
        style={{ background: 'var(--primary)' }}
      >
        العودة للمنتجات
      </Link>
    </div>
  )

  const images = product.images?.length > 0 ? product.images : ['']
  const displayPrice = product.sale_price ?? product.price
  const originalPrice = product.sale_price ? product.price : product.compare_price
  const discountPct = originalPrice
    ? Math.round((1 - displayPrice / originalPrice) * 100)
    : 0

  const TABS: Array<['desc' | 'ingredients' | 'how', string]> = [
    ['desc', 'الوصف'],
    ['ingredients', 'المكونات'],
    ['how', 'طريقة الاستخدام'],
  ]

  return (
    <div
      className="min-h-screen bg-[var(--off-white)]"
      style={{ paddingTop: 'var(--nav-height)' }}
    >
      {/* ─── Breadcrumb ─── */}
      <nav
        aria-label="مسار التنقل"
        className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 py-3"
      >
        <ol className="flex items-center gap-2 text-xs text-[var(--on-surface-variant)] flex-wrap">
          {[
            { href: '/', label: 'الرئيسية' },
            { href: '/products', label: 'المنتجات' },
            ...(product.category ? [{ href: `/products?category=${encodeURIComponent(product.category)}`, label: product.category }] : []),
          ].map(({ href, label }, i) => (
            <li key={href} className="flex items-center gap-2">
              {i > 0 && <ArrowRightIcon className="w-3 h-3 rotate-180 opacity-40" aria-hidden="true" />}
              <Link href={href} className="hover:text-[var(--primary)] transition-colors">
                {label}
              </Link>
            </li>
          ))}
          <li className="flex items-center gap-2">
            <ArrowRightIcon className="w-3 h-3 rotate-180 opacity-40" aria-hidden="true" />
            <span className="text-[var(--text-dark)] font-medium truncate max-w-[200px]">
              {product.name_ar}
            </span>
          </li>
        </ol>
      </nav>

      {/* ─── Main Content ─── */}
      <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14">

          {/* ── Gallery ── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-3"
          >
            {/* Main Image */}
            <div
              className="relative rounded-3xl overflow-hidden aspect-square bg-gradient-to-br cursor-zoom-in select-none"
              style={{ background: 'linear-gradient(135deg, var(--beige), var(--dark-beige))' }}
              onClick={() => setIsZoomed(v => !v)}
              role="button"
              aria-label={isZoomed ? 'تصغير الصورة' : 'تكبير الصورة'}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="relative w-full h-full"
                >
                  {images[selectedImage] ? (
                    <Image
                      src={images[selectedImage]}
                      alt={product.name_ar}
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className={`object-cover transition-transform duration-500 ${isZoomed ? 'scale-150' : 'scale-100'}`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <SparklesIcon className="w-24 h-24 opacity-20 text-[var(--primary)]" />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Discount Badge */}
              {discountPct > 0 && (
                <div className="absolute top-4 right-4 px-3 py-1.5 bg-red-500 text-white rounded-full text-sm font-bold shadow-lg">
                  خصم {discountPct}٪
                </div>
              )}

              {/* Zoom hint */}
              <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/40 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
                <MagnifyingGlassPlusIcon className="w-3.5 h-3.5" />
                {isZoomed ? 'اضغطي للتصغير' : 'اضغطي للتكبير'}
              </div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1" role="list" aria-label="معرض الصور">
                {images.map((img, i) => (
                  <motion.button
                    key={i}
                    role="listitem"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setSelectedImage(i); setIsZoomed(false) }}
                    aria-label={`صورة ${i + 1}`}
                    aria-pressed={selectedImage === i}
                    className={`relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 border-2 transition-all`}
                    style={{
                      borderColor: selectedImage === i ? 'var(--primary)' : 'transparent',
                      boxShadow: selectedImage === i ? '0 0 0 3px rgba(156,102,68,0.2)' : 'none',
                    }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{ background: 'linear-gradient(135deg, var(--beige), var(--dark-beige))' }}
                    >
                      {img && (
                        <Image src={img} alt="" fill className="object-cover" />
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>

          {/* ── Product Info ── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-5"
          >
            {/* Category + Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {product.category && (
                <Link
                  href={`/products?category=${encodeURIComponent(product.category)}`}
                  className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
                  style={{ background: 'var(--beige)', color: 'var(--primary)' }}
                >
                  {product.category}
                </Link>
              )}
              {product.is_featured && (
                <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full flex items-center gap-1">
                  <SparklesIcon className="w-3.5 h-3.5" />
                  مميز
                </span>
              )}
              {product.stock_quantity === 0 && (
                <span className="px-3 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                  نفذت الكمية
                </span>
              )}
            </div>

            {/* Title */}
            <div>
              <h1
                className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-1"
                style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--text-dark)' }}
              >
                {product.name_ar}
              </h1>
              {product.name_en && (
                <p className="text-sm font-medium" style={{ color: 'var(--on-surface-variant)' }}>
                  {product.name_en}
                </p>
              )}
            </div>

            {/* Rating Mock */}
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1,2,3,4,5].map(i => (
                  <StarIcon key={i} className="w-4 h-4 text-amber-400" />
                ))}
              </div>
              <span className="text-sm font-medium text-[var(--text-dark)]">4.9</span>
              <span className="text-sm text-[var(--on-surface-variant)]">(+١٢٠ تقييم)</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span
                className="text-4xl md:text-5xl font-bold"
                style={{ color: 'var(--primary)', fontFamily: 'Cormorant Garamond, serif' }}
                dir="ltr"
              >
                {formatPrice(displayPrice)}
              </span>
              {originalPrice && (
                <span className="text-xl text-gray-400 line-through" dir="ltr">
                  {formatPrice(originalPrice)}
                </span>
              )}
              {discountPct > 0 && (
                <span className="px-2 py-0.5 bg-red-100 text-red-600 text-sm font-bold rounded-lg">
                  -{discountPct}٪
                </span>
              )}
            </div>

            {/* Trust Features */}
            <div
              className="grid grid-cols-3 gap-3 py-4 border-y"
              style={{ borderColor: 'var(--beige)' }}
            >
              {TRUST.map((f, i) => (
                <div key={i} className="text-center">
                  <f.Icon className="w-5 h-5 mx-auto mb-1.5 text-[var(--primary)]" />
                  <p className="text-xs font-semibold text-[var(--text-dark)]">{f.title}</p>
                  <p className="text-[10px] text-[var(--on-surface-variant)] mt-0.5">{f.desc}</p>
                </div>
              ))}
            </div>

            {/* Short Description */}
            {product.description_ar && (
              <p className="text-sm leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>
                {product.description_ar.slice(0, 180)}
                {product.description_ar.length > 180 && '...'}
              </p>
            )}

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  product.stock_quantity > 10
                    ? 'bg-green-500'
                    : product.stock_quantity > 0
                    ? 'bg-amber-500'
                    : 'bg-red-500'
                } animate-pulse`}
              />
              <span
                className={`text-sm font-medium ${
                  product.stock_quantity > 10
                    ? 'text-green-600'
                    : product.stock_quantity > 0
                    ? 'text-amber-600'
                    : 'text-red-500'
                }`}
              >
                {product.stock_quantity > 10
                  ? 'متوفر في المخزن'
                  : product.stock_quantity > 0
                  ? `بقي ${product.stock_quantity} قطع فقط!`
                  : 'نفذت الكمية'}
              </span>
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-[var(--text-dark)]">الكمية:</span>
              <div
                className="inline-flex items-center rounded-xl border overflow-hidden"
                style={{ borderColor: 'var(--dark-beige)' }}
              >
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  aria-label="تقليل الكمية"
                  className="w-10 h-10 flex items-center justify-center transition-colors hover:bg-[var(--beige)] disabled:opacity-30"
                >
                  <MinusIcon className="w-4 h-4 text-[var(--text-dark)]" />
                </motion.button>
                <span className="w-12 text-center font-bold text-[var(--text-dark)]">
                  {quantity}
                </span>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setQuantity(q => Math.min(product.stock_quantity, q + 1))}
                  disabled={quantity >= product.stock_quantity}
                  aria-label="زيادة الكمية"
                  className="w-10 h-10 flex items-center justify-center transition-colors hover:bg-[var(--beige)] disabled:opacity-30"
                >
                  <PlusIcon className="w-4 h-4 text-[var(--text-dark)]" />
                </motion.button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <motion.button
                onClick={handleAddToCart}
                disabled={product.stock_quantity === 0 || addingToCart}
                whileHover={{ scale: product.stock_quantity > 0 && !addingToCart ? 1.01 : 1 }}
                whileTap={{ scale: 0.98 }}
                className={`flex-1 py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2 transition-all ${
                  product.stock_quantity === 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : addingToCart
                    ? 'bg-green-500 text-white'
                    : 'text-white'
                }`}
                style={
                  product.stock_quantity > 0 && !addingToCart
                    ? { background: 'var(--primary)', boxShadow: 'var(--shadow-primary)' }
                    : {}
                }
              >
                {addingToCart ? (
                  <>
                    <CheckIcon className="w-5 h-5" />
                    تمت الإضافة!
                  </>
                ) : product.stock_quantity === 0 ? (
                  'نفذت الكمية'
                ) : (
                  <>
                    <ShoppingBagIcon className="w-5 h-5" />
                    أضف للسلة
                  </>
                )}
              </motion.button>

              <motion.button
                onClick={handleToggleWishlist}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={isWishlisted ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                aria-pressed={isWishlisted}
                className={`w-14 rounded-xl border-2 flex items-center justify-center transition-all ${
                  isWishlisted
                    ? 'border-rose-400 bg-rose-50'
                    : 'border-[var(--beige)] hover:border-rose-300'
                }`}
              >
                {isWishlisted
                  ? <HeartSolid className="w-6 h-6 text-rose-500" />
                  : <HeartIcon className="w-6 h-6 text-[var(--on-surface-variant)]" />
                }
              </motion.button>

              <motion.button
                onClick={handleShare}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="مشاركة المنتج"
                className="w-14 rounded-xl border-2 border-[var(--beige)] flex items-center justify-center hover:border-[var(--primary)] transition-all"
              >
                <ShareIcon className="w-6 h-6 text-[var(--on-surface-variant)]" />
              </motion.button>
            </div>

            {/* Payment Methods */}
            <div
              className="pt-4 border-t"
              style={{ borderColor: 'var(--beige)' }}
            >
              <p className="text-[11px] text-[var(--on-surface-variant)] uppercase tracking-wider font-semibold mb-2">
                طرق الدفع المقبولة
              </p>
              <PaymentIconsRow />
            </div>
          </motion.div>
        </div>

        {/* ─── Product Tabs ─── */}
        <div className="mt-12">
          {/* Tab Headers */}
          <div
            className="flex border-b"
            style={{ borderColor: 'var(--beige)' }}
            role="tablist"
            aria-label="تفاصيل المنتج"
          >
            {TABS.map(([tab, label]) => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                aria-controls={`tab-panel-${tab}`}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3.5 text-sm font-medium transition-all border-b-2 -mb-px ${
                  activeTab === tab
                    ? 'border-[var(--primary)] text-[var(--primary)]'
                    : 'border-transparent text-[var(--on-surface-variant)] hover:text-[var(--text-dark)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              id={`tab-panel-${activeTab}`}
              role="tabpanel"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="py-7"
              style={{ color: 'var(--on-surface-variant)' }}
            >
              {activeTab === 'desc' && (
                <div className="space-y-4 max-w-2xl">
                  <p className="leading-relaxed text-sm">
                    {product.description_ar || 'لا يوجد وصف مفصل لهذا المنتج.'}
                  </p>
                  <ul className="space-y-2 mt-4">
                    {['مناسب لجميع أنواع البشرة', 'خالٍ من البارابين والسلفات', 'لم يُختبر على الحيوانات', 'تغليف صديق للبيئة', 'مُختبر طبياً'].map(item => (
                      <li key={item} className="flex items-center gap-2.5 text-sm">
                        <CheckIcon className="w-4 h-4 text-[var(--primary)] flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {activeTab === 'ingredients' && (
                <div className="max-w-2xl space-y-4">
                  <p className="text-sm leading-relaxed">
                    {product.ingredients_ar || 'مكونات طبيعية 100٪ مختارة بعناية.'}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {['ماء', 'جلسرين', 'زيت الأرغان', 'فيتامين E', 'مستخلص الصبار', 'زيت جوز الهند', 'نياسيناميد'].map(ing => (
                      <span
                        key={ing}
                        className="px-3 py-1.5 rounded-full text-xs font-medium"
                        style={{ background: 'var(--beige)', color: 'var(--primary)' }}
                      >
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'how' && (
                <ol className="space-y-4 max-w-2xl">
                  {[
                    'نظفي بشرتك جيداً بالغسول المناسب لنوعها',
                    'ضعي كمية صغيرة (حجم الحمصة) على الوجه والرقبة',
                    'دلكي بلطف بحركات دائرية تصاعدية',
                    'انتظري حتى الامتصاص الكامل (٢-٣ دقائق)',
                    'استخدمي صباحاً ومساءً للحصول على أفضل النتائج',
                  ].map((step, i) => (
                    <li key={i} className="flex gap-4">
                      <span
                        className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold mt-0.5"
                        style={{ background: 'var(--primary)' }}
                      >
                        {i + 1}
                      </span>
                      <p className="text-sm leading-relaxed pt-1">{step}</p>
                    </li>
                  ))}
                </ol>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ─── Reviews ─── */}
        <div className="mt-8 border-t pt-12" style={{ borderColor: 'var(--beige)' }}>
          <ProductReviews productId={product.id} />
        </div>

        {/* ─── Related Products ─── */}
        {related.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16"
          >
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: 'var(--primary)' }}>
                  قد يعجبك أيضاً
                </p>
                <h2
                  className="text-3xl font-bold"
                  style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--text-dark)' }}
                >
                  منتجات مشابهة
                </h2>
              </div>
              <Link
                href="/products"
                className="text-sm font-medium hover:underline"
                style={{ color: 'var(--primary)' }}
              >
                عرض الكل
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {related.slice(0, 4).map((p, i) => (
                <EnhancedProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  )
}
