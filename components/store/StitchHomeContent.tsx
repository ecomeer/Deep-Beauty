'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Product, Category } from '@/types'
import { useCountry } from '@/context/CountryContext'
import { useCartContext } from '@/context/CartContext'
import { useWishlistContext } from '@/context/WishlistContext'
import {
  ShoppingBagIcon,
  HeartIcon,
  StarIcon,
  TruckIcon,
  ShieldCheckIcon,
  SparklesIcon,
  CheckBadgeIcon,
  CheckIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'

interface Banner {
  id: string
  title_ar: string
  subtitle_ar: string | null
  image_url: string
  link_url: string
}

interface Props {
  featuredProducts: Product[]
  categories: Category[]
  banners?: Banner[]
  announcementText?: string
}

// ─── Motion helpers ────────────────────────────────────────────────────────
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.55, ease: EASE },
}

// ─── Trust features ────────────────────────────────────────────────────────
const TRUST = [
  { Icon: TruckIcon,       title: 'شحن سريع',     desc: 'توصيل خلال ٢٤ ساعة' },
  { Icon: ShieldCheckIcon, title: 'منتجات أصلية', desc: '١٠٠٪ طبيعية' },
  { Icon: SparklesIcon,    title: 'جودة عالية',   desc: 'مكونات مختارة' },
  { Icon: CheckBadgeIcon,  title: 'ضمان رضا',     desc: 'استبدال أو استرجاع' },
]

// ─── Testimonials ──────────────────────────────────────────────────────────
const REVIEWS = [
  { name: 'سارة العنزي',   city: 'الكويت', text: 'أفضل منتجات استخدمتها لبشرتي، نتائج مذهلة من أول أسبوع! البشرة أصبحت مشرقة وناعمة جداً.', rating: 5 },
  { name: 'نورة الرشيد',   city: 'الرياض', text: 'جودة عالية وتغليف فاخر. أنصح كل صديقة بتجربة ديب بيوتي. سأكون عميلة دائمة للأبد.', rating: 5 },
  { name: 'فاطمة الهاشمي', city: 'دبي',    text: 'خدمة عملاء ممتازة وتوصيل سريع جداً. المنتجات طبيعية وآمنة للبشرة الحساسة كبشرتي.', rating: 5 },
]

// ─── Product Card ──────────────────────────────────────────────────────────
function MobileProductCard({
  product,
  formatPrice,
  darkMode = false,
}: {
  product: Product
  formatPrice: (p: number) => string
  darkMode?: boolean
}) {
  const { addItem } = useCartContext()
  const { isInWishlist, toggleItem } = useWishlistContext()
  const [adding, setAdding] = useState(false)
  const isWishlisted = isInWishlist(product.id)
  const displayPrice = product.sale_price ?? product.price
  const comparePrice = product.sale_price ? product.price : product.compare_price

  const discount = product.sale_price
    ? Math.round((1 - product.sale_price / product.price) * 100)
    : product.compare_price
    ? Math.round((1 - product.price / product.compare_price) * 100)
    : 0

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
    toast.success(isWishlisted ? 'تم الإزالة من المفضلة' : 'تم الإضافة للمفضلة ❤️', { position: 'bottom-center' })
  }

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="flex flex-col gap-3">

        {/* ── Image container ── */}
        <div className="relative aspect-[3/4] rounded-[2rem] overflow-hidden bg-[var(--beige)]">
          {product.images?.[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name_ar}
              fill
              sizes="(max-width: 640px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <SparklesIcon className="w-10 h-10 opacity-25 text-[var(--primary)]" />
            </div>
          )}

          {/* Badge — top right */}
          <div className="absolute top-3 right-3 flex flex-col gap-1.5">
            {discount > 0 && (
              <span className="px-2.5 py-1 bg-red-500 text-white text-xs font-bold rounded-full shadow-sm">
                -{discount}٪
              </span>
            )}
            {product.is_featured && !discount && (
              <span className="px-2.5 py-1 bg-amber-500 text-white text-xs font-bold rounded-full shadow-sm">
                مميز ✨
              </span>
            )}
          </div>

          {/* Wishlist — top left */}
          <button
            onClick={handleWishlist}
            aria-label={isWishlisted ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
            className={`absolute top-3 left-3 w-9 h-9 rounded-full flex items-center justify-center shadow-sm transition-all ${
              isWishlisted
                ? 'bg-rose-500 text-white'
                : 'bg-white/85 text-gray-500 hover:bg-rose-500 hover:text-white'
            }`}
          >
            {isWishlisted ? <HeartSolid className="w-4 h-4" /> : <HeartIcon className="w-4 h-4" />}
          </button>

          {/* Out of stock overlay */}
          {product.stock_quantity === 0 && (
            <div className="absolute inset-0 rounded-[2rem] bg-black/20 flex items-center justify-center">
              <span className="bg-white text-gray-600 text-xs font-bold px-4 py-2 rounded-full shadow">
                نفذت الكمية
              </span>
            </div>
          )}
        </div>

        {/* ── Content ── */}
        <div className="text-right px-1">
          <h3
            className="font-bold text-sm leading-snug line-clamp-2 mb-1"
            style={{
              color: darkMode ? 'rgba(255,255,255,0.92)' : 'var(--text-dark)',
              fontFamily: 'var(--font-tajawal), sans-serif',
            }}
          >
            {product.name_ar}
          </h3>

          {/* Price row */}
          <div className="flex items-baseline gap-2 justify-end mb-3">
            <span
              className="text-base font-bold"
              style={{ color: darkMode ? 'var(--primary-light)' : 'var(--primary)' }}
              dir="ltr"
            >
              {formatPrice(displayPrice)}
            </span>
            {comparePrice && comparePrice > displayPrice && (
              <span className="text-xs text-gray-400 line-through" dir="ltr">
                {formatPrice(comparePrice)}
              </span>
            )}
          </div>

          {/* Add to cart — full width rounded-full */}
          <button
            onClick={handleAddToCart}
            disabled={product.stock_quantity === 0 || adding}
            aria-label={product.stock_quantity === 0 ? 'نفذت الكمية' : `إضافة ${product.name_ar} للسلة`}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-bold text-white transition-all disabled:cursor-not-allowed"
            style={{
              background:
                product.stock_quantity === 0
                  ? '#C8B8AE'
                  : adding
                  ? '#5a9e6f'
                  : 'var(--primary)',
            }}
          >
            {adding
              ? <><CheckIcon className="w-4 h-4" /> تمت الإضافة</>
              : product.stock_quantity === 0
              ? 'نفذت الكمية'
              : <><ShoppingBagIcon className="w-4 h-4" /> أضف للسلة</>
            }
          </button>
        </div>

      </div>
    </Link>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════
export default function StitchHomeContent({
  featuredProducts,
  categories,
  banners = [],
  announcementText,
}: Props) {
  const { formatPrice } = useCountry()
  const [heroIndex, setHeroIndex] = useState(0)
  const touchStartX = useRef<number>(0)
  const [bestsellers, setBestsellers] = useState<Product[]>([])
  const [bestsellersLoading, setBestsellersLoading] = useState(true)

  useEffect(() => {
    fetch('/api/products/bestsellers?limit=8')
      .then(r => r.json())
      .then(d => { if (d.products) setBestsellers(d.products) })
      .catch((err) => console.error('Failed to load bestsellers:', err))
      .finally(() => setBestsellersLoading(false))
  }, [])

  const heroSlides = banners.length > 0 ? banners : [null]

  // Auto-advance every 4s
  useEffect(() => {
    if (heroSlides.length <= 1) return
    const timer = setTimeout(() => {
      setHeroIndex(i => (i + 1) % heroSlides.length)
    }, 4000)
    return () => clearTimeout(timer)
  }, [heroIndex, heroSlides.length])

  const goNext = () => setHeroIndex(i => (i + 1) % heroSlides.length)
  const goPrev = () => setHeroIndex(i => (i - 1 + heroSlides.length) % heroSlides.length)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(delta) > 50) delta > 0 ? goNext() : goPrev()
  }

  const activeCategories = categories.filter(c => c.is_active).slice(0, 6)

  return (
    <div className="min-h-screen" style={{ background: 'var(--off-white)', paddingTop: 'var(--nav-height)' }}>

      {/* Visually hidden H1 for SEO */}
      <h1 className="sr-only">ديب بيوتي | متجر عناية فاخرة بالبشرة — منتجات طبيعية ١٠٠٪ من الكويت</h1>

      {/* ═══════════════════════════════════════
          1. ANNOUNCEMENT BAR
      ═══════════════════════════════════════ */}
      {announcementText && (
        <div
          className="py-2 px-4 text-center text-xs tracking-wide font-medium text-white"
          style={{ background: 'var(--text-dark)' }}
        >
          <span aria-hidden="true">✦</span>
          <span className="mx-3">{announcementText}</span>
          <span aria-hidden="true">✦</span>
        </div>
      )}

      {/* ═══════════════════════════════════════
          2. HERO — SLIDER WITH TEXT OVERLAY
      ═══════════════════════════════════════ */}
      <section className="px-4 pt-4 pb-3">
        <div
          className="relative w-full rounded-[2rem] overflow-hidden aspect-[3/4] sm:aspect-[16/9]"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Slides */}
          {heroSlides.map((slide, i) => (
            <div
              key={i}
              className="absolute inset-0 transition-opacity duration-500"
              style={{ opacity: i === heroIndex ? 1 : 0, pointerEvents: i === heroIndex ? 'auto' : 'none' }}
            >
              {(slide as Banner | null)?.image_url ? (
                <Image
                  src={(slide as Banner).image_url}
                  alt={(slide as Banner).title_ar}
                  fill
                  className="object-cover"
                  priority={i === 0}
                />
              ) : (
                <div
                  className="w-full h-full"
                  style={{ background: 'linear-gradient(160deg, var(--beige) 0%, var(--dark-beige) 60%, var(--primary) 100%)' }}
                />
              )}
            </div>
          ))}

          {/* Gradient veil — bottom two-thirds for text readability */}
          <div
            className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none z-[1]"
            style={{ background: 'linear-gradient(to top, rgba(30,18,10,0.80) 0%, rgba(30,18,10,0.35) 50%, transparent 100%)' }}
          />

          {/* Text overlay */}
          <div className="absolute bottom-10 right-5 left-5 z-[2] text-right">
            <h2
              className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-1.5"
              style={{ fontFamily: 'var(--font-cormorant), serif', textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}
            >
              {(heroSlides[heroIndex] as Banner | null)?.title_ar || 'جمالك يبدأ من الأعماق'}
            </h2>
            <p
              className="text-xs text-white/80 mb-4"
              style={{ textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}
            >
              {(heroSlides[heroIndex] as Banner | null)?.subtitle_ar || 'منتجات عناية طبيعية ١٠٠٪ من قلب الكويت'}
            </p>
            <Link
              href={(heroSlides[heroIndex] as Banner | null)?.link_url || '/products'}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'var(--primary)' }}
            >
              تسوقي الآن ←
            </Link>
          </div>

          {/* Pagination dots */}
          {heroSlides.length > 1 && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-[3] items-center">
              {heroSlides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setHeroIndex(i)}
                  aria-label={`شريحة ${i + 1}`}
                  className="transition-all duration-300 bg-white rounded-full"
                  style={
                    i === heroIndex
                      ? { width: 20, height: 8, opacity: 1 }
                      : { width: 8, height: 8, opacity: 0.4 }
                  }
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════
          3. CATEGORY NAVIGATION (HORIZONTAL SCROLL)
      ═══════════════════════════════════════ */}
      {activeCategories.length > 0 && (
        <section className="py-6">
          {/* Eyebrow + heading */}
          <div className="px-6 mb-5 flex items-center justify-between">
            <div className="text-right">
              <span
                className="text-xs font-bold uppercase tracking-[0.14em] block mb-1"
                style={{ color: 'var(--primary)' }}
              >
                تسوقي حسب الفئة
              </span>
              <h2
                className="text-xl font-bold"
                style={{ color: 'var(--text-dark)', fontFamily: 'var(--font-cormorant), serif' }}
              >
                استكشفي مجموعاتنا
              </h2>
            </div>
            <Link
              href="/products"
              className="flex items-center gap-1 text-xs font-semibold flex-shrink-0"
              style={{ color: 'var(--primary)' }}
            >
              الكل
              <ArrowLeftIcon className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Horizontal scroll */}
          <div
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-6"
            style={{ scrollbarWidth: 'none' }}
          >
            {activeCategories.map((cat, i) => (
              <motion.div
                key={cat.id}
                {...fadeUp}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                className="flex-shrink-0 snap-start"
                style={{ width: '28vw', maxWidth: 110 }}
              >
                <Link
                  href={`/products?category=${encodeURIComponent(cat.slug)}`}
                  className="flex flex-col items-center gap-2 group"
                  aria-label={`تصفح فئة ${cat.name_ar}`}
                >
                  {/* Circular image with hover ring */}
                  <div
                    className="w-full aspect-square rounded-full overflow-hidden ring-2 ring-transparent group-hover:ring-[var(--primary)] transition-all duration-300"
                    style={{ background: 'var(--beige)' }}
                  >
                    {cat.image_url ? (
                      <Image
                        src={cat.image_url}
                        alt={cat.name_ar}
                        width={120}
                        height={120}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <SparklesIcon className="w-6 h-6 text-[var(--primary)] opacity-40" />
                      </div>
                    )}
                  </div>
                  {/* Label */}
                  <span
                    className="text-xs font-semibold text-center leading-tight line-clamp-2"
                    style={{ color: 'var(--text-dark)' }}
                  >
                    {cat.name_ar}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════
          4. FEATURED PRODUCTS SLIDER
      ═══════════════════════════════════════ */}
      <section className="py-8">
        {/* Accent line */}
        <div
          className="mx-6 mb-5 h-px"
          style={{ background: 'linear-gradient(to left, var(--primary), transparent)' }}
        />

        {/* Eyebrow + heading */}
        <div className="px-6 mb-6 flex items-center justify-between">
          <div className="text-right">
            <span
              className="text-xs font-bold uppercase tracking-[0.14em] block mb-1"
              style={{ color: 'var(--primary)' }}
            >
              مختار بعناية
            </span>
            <h2
              className="text-2xl font-bold"
              style={{ color: 'var(--text-dark)', fontFamily: 'var(--font-cormorant), serif' }}
            >
              منتجاتنا المختارة
            </h2>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--on-surface-variant)' }}>
              أفضل ما لدينا من عناية بالبشرة
            </p>
          </div>
          <Link
            href="/products"
            className="flex items-center gap-1 text-xs font-semibold flex-shrink-0"
            style={{ color: 'var(--primary)' }}
          >
            عرض الكل
            <ArrowLeftIcon className="w-3.5 h-3.5" />
          </Link>
        </div>

        {featuredProducts.length === 0 ? (
          <div
            className="mx-6 py-16 rounded-[2rem] flex flex-col items-center justify-center gap-3"
            style={{ background: 'white' }}
          >
            <ShoppingBagIcon className="w-12 h-12 text-[var(--primary)] opacity-20" />
            <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>المنتجات تُضاف قريباً ✨</p>
          </div>
        ) : (
          /* Slider with right-side edge fade */
          <div className="relative">
            <div
              className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-6 pb-2"
              style={{ scrollbarWidth: 'none' }}
            >
              {featuredProducts.slice(0, 8).map((product) => (
                <div
                  key={product.id}
                  className="flex-shrink-0 snap-start"
                  style={{ width: '44vw', maxWidth: '200px' }}
                >
                  <MobileProductCard product={product} formatPrice={formatPrice} />
                </div>
              ))}
            </div>
            {/* Edge fade — left side (RTL end) */}
            <div
              className="absolute inset-y-0 left-0 w-12 pointer-events-none"
              style={{ background: 'linear-gradient(to left, var(--off-white), transparent)' }}
            />
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════
          5. MIDDLE BANNER — SPLIT CARD
      ═══════════════════════════════════════ */}
      <section className="px-4 py-6">
        <Link href={banners[1]?.link_url || '/products'} className="block">
          <div
            className="w-full rounded-[2rem] overflow-hidden grid grid-cols-2"
            style={{ minHeight: '180px', background: 'var(--text-dark)' }}
          >
            {/* RIGHT col (RTL first): Text */}
            <div className="p-5 text-right flex flex-col justify-center gap-2">
              <span
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: 'var(--primary-light)' }}
              >
                {banners[1] ? banners[1].title_ar.split(' ').slice(0, 2).join(' ') : 'عرض محدود'}
              </span>
              {/* Thin accent line */}
              <div className="w-8 h-px self-end" style={{ background: 'var(--primary)' }} />
              <p
                className="text-xl font-bold text-white leading-tight"
                style={{ fontFamily: 'var(--font-cormorant), serif' }}
              >
                {banners[1]
                  ? banners[1].title_ar.split(' ').slice(2).join(' ') || banners[1].title_ar
                  : <>خصم ٢٠٪<br />على السيروم</>
                }
              </p>
              <span
                className="inline-flex self-end items-center gap-1 px-4 py-2 rounded-full text-xs font-bold text-white mt-1"
                style={{ background: 'var(--primary)' }}
              >
                تسوقي الآن ←
              </span>
            </div>

            {/* LEFT col: Image */}
            <div className="relative overflow-hidden rounded-l-[2rem]" style={{ minHeight: '180px' }}>
              {banners[1]?.image_url ? (
                <Image
                  src={banners[1].image_url}
                  alt={banners[1].title_ar}
                  fill
                  className="object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(160deg, var(--beige), var(--dark-beige))' }}
                >
                  <SparklesIcon className="w-10 h-10 opacity-30 text-[var(--primary)]" />
                </div>
              )}
            </div>
          </div>
        </Link>
      </section>

      {/* ═══════════════════════════════════════
          6. BESTSELLERS SLIDER — DARK BACKGROUND
      ═══════════════════════════════════════ */}
      {(bestsellersLoading || bestsellers.length > 0) && (
        <section className="py-8" style={{ background: 'var(--text-dark)' }}>
          {/* Eyebrow + heading */}
          <div className="px-6 mb-6 flex items-center justify-between">
            <div className="text-right">
              <span
                className="text-xs font-bold uppercase tracking-[0.14em] block mb-1"
                style={{ color: 'var(--primary-light)' }}
              >
                الأعلى مبيعاً
              </span>
              <h2
                className="text-2xl font-bold text-white"
                style={{ fontFamily: 'var(--font-cormorant), serif' }}
              >
                الأكثر مبيعاً
              </h2>
            </div>
            <Link
              href="/products"
              className="flex items-center gap-1 text-xs font-semibold flex-shrink-0"
              style={{ color: 'var(--primary-light)' }}
            >
              عرض الكل
              <ArrowLeftIcon className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Slider with edge fade */}
          <div className="relative">
            <div
              className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-6 pb-2"
              style={{ scrollbarWidth: 'none' }}
            >
              {bestsellersLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-shrink-0 snap-start animate-pulse"
                      style={{ width: '44vw', maxWidth: '200px' }}
                    >
                      <div className="rounded-2xl aspect-[3/4] mb-3" style={{ background: 'rgba(255,255,255,0.08)' }} />
                      <div className="h-3 rounded w-3/4 mb-2" style={{ background: 'rgba(255,255,255,0.08)' }} />
                      <div className="h-3 rounded w-1/2" style={{ background: 'rgba(255,255,255,0.08)' }} />
                    </div>
                  ))
                : bestsellers.map((product) => (
                    <div
                      key={product.id}
                      className="flex-shrink-0 snap-start"
                      style={{ width: '44vw', maxWidth: '200px' }}
                    >
                      <MobileProductCard product={product} formatPrice={formatPrice} darkMode />
                    </div>
                  ))}
            </div>
            {/* Edge fade matching dark bg */}
            <div
              className="absolute inset-y-0 left-0 w-12 pointer-events-none"
              style={{ background: 'linear-gradient(to left, var(--text-dark), transparent)' }}
            />
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════
          7. TRUST BAR — HORIZONTAL SCROLL STRIP
      ═══════════════════════════════════════ */}
      <section className="py-6" style={{ background: 'white' }}>
        {/* Subtle top divider */}
        <div className="h-px mx-6 mb-5" style={{ background: 'var(--beige)' }} />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-6">
          {TRUST.map(({ Icon, title, desc }, i) => (
            <motion.div
              key={title}
              {...fadeUp}
              transition={{ duration: 0.45, delay: i * 0.07 }}
              className="flex flex-col items-center text-center gap-2"
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: 'var(--beige)' }}
              >
                <Icon className="w-6 h-6 text-[var(--primary)]" />
              </div>
              <p className="text-xs font-bold" style={{ color: 'var(--text-dark)' }}>{title}</p>
              <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════
          8. TESTIMONIALS
      ═══════════════════════════════════════ */}
      <section className="py-10" style={{ background: 'var(--text-dark)' }}>
        <div className="px-6 mb-8 text-right">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary-light)] block mb-2">
            آراء عملائنا
          </span>
          <h2
            className="text-2xl font-bold text-white"
            style={{ fontFamily: 'var(--font-cormorant), serif' }}
          >
            ما يقولون عنا
          </h2>
          {/* Decorative line */}
          <div className="w-10 h-px mt-3 mr-auto" style={{ background: 'var(--primary)' }} />
        </div>

        {/* Horizontal scroll on mobile */}
        <div
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-6 pb-6"
          style={{ scrollbarWidth: 'none' }}
        >
          {REVIEWS.map((review, i) => (
            <motion.div
              key={review.name}
              {...fadeUp}
              transition={{ duration: 0.45, delay: i * 0.1 }}
              className="flex-shrink-0 w-[78vw] snap-start rounded-[2rem] p-5"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              {/* Stars */}
              <div className="flex gap-1 mb-3 flex-row-reverse justify-end">
                {Array.from({ length: review.rating }).map((_, j) => (
                  <StarIcon key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                ))}
              </div>

              <p className="text-sm leading-relaxed text-right mb-4" style={{ color: 'rgba(255,255,255,0.80)' }}>
                {review.text}
              </p>

              <div
                className="flex items-center gap-3 pt-3 flex-row-reverse"
                style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                  style={{ background: 'var(--primary)' }}
                >
                  {review.name[0]}
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-white">{review.name}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{review.city}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

    </div>
  )
}
