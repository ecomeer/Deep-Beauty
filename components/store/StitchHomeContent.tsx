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
  ChevronRightIcon,
  ChevronLeftIcon,
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
  newArrivals?: Product[]
  limitedStock?: Product[]
}

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.55, ease: EASE },
}

const TRUST = [
  { Icon: TruckIcon,       title: 'شحن مجاني',    desc: 'داخل الكويت على جميع الطلبات' },
  { Icon: ShieldCheckIcon, title: 'منتجات أصلية', desc: '١٠٠٪ طبيعية' },
  { Icon: SparklesIcon,    title: 'جودة عالية',   desc: 'مكونات مختارة بعناية' },
  { Icon: CheckBadgeIcon,  title: 'ضمان رضا',     desc: 'استبدال أو استرجاع' },
]

const REVIEWS = [
  { name: 'سارة العنزي',   city: 'الكويت', text: 'أفضل منتجات استخدمتها لبشرتي، نتائج مذهلة من أول أسبوع! البشرة أصبحت مشرقة وناعمة جداً.', rating: 5 },
  { name: 'نورة الرشيد',   city: 'الرياض', text: 'جودة عالية وتغليف فاخر. أنصح كل صديقة بتجربة ديب بيوتي. سأكون عميلة دائمة للأبد.', rating: 5 },
  { name: 'فاطمة الهاشمي', city: 'دبي',    text: 'خدمة عملاء ممتازة وتوصيل سريع جداً. المنتجات طبيعية وآمنة للبشرة الحساسة كبشرتي.', rating: 5 },
]

const ANNOUNCE_MESSAGES = [
  '🚚 شحن مجاني داخل الكويت على جميع الطلبات',
  '✨ منتجات طبيعية ١٠٠٪ مصنوعة بعناية',
]

// ─── Product Card ──────────────────────────────────────────────────────────
function ProductCard({
  product,
  formatPrice,
  darkMode = false,
  badge,
}: {
  product: Product
  formatPrice: (p: number) => string
  darkMode?: boolean
  badge?: { text: string; color: string }
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

          {/* Badges — top right */}
          <div className="absolute top-3 right-3 flex flex-col gap-1.5">
            {badge && (
              <span className={`px-2.5 py-1 text-white text-xs font-bold rounded-full shadow-sm ${badge.color}`}>
                {badge.text}
              </span>
            )}
            {discount > 0 && (
              <span className="px-2.5 py-1 bg-red-500 text-white text-xs font-bold rounded-full shadow-sm">
                -{discount}٪
              </span>
            )}
            {!badge && product.is_featured && !discount && (
              <span className="px-2.5 py-1 bg-amber-500 text-white text-xs font-bold rounded-full shadow-sm">
                مميز ✨
              </span>
            )}
            {product.stock_quantity > 0 && product.stock_quantity <= 5 && !badge && (
              <span className="px-2.5 py-1 bg-orange-500 text-white text-xs font-bold rounded-full shadow-sm">
                كمية محدودة
              </span>
            )}
          </div>

          {/* Wishlist */}
          <button
            onClick={handleWishlist}
            aria-label={isWishlisted ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
            className={`absolute top-3 left-3 w-9 h-9 rounded-full flex items-center justify-center shadow-sm transition-all ${
              isWishlisted ? 'bg-rose-500 text-white' : 'bg-white/85 text-gray-500 hover:bg-rose-500 hover:text-white'
            }`}
          >
            {isWishlisted ? <HeartSolid className="w-4 h-4" /> : <HeartIcon className="w-4 h-4" />}
          </button>

          {product.stock_quantity === 0 && (
            <div className="absolute inset-0 rounded-[2rem] bg-black/20 flex items-center justify-center">
              <span className="bg-white text-gray-600 text-xs font-bold px-4 py-2 rounded-full shadow">
                نفذت الكمية
              </span>
            </div>
          )}
        </div>

        <div className="text-right px-1">
          {product.category && (
            <span className="text-[10px] font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--primary)' }}>
              {product.category}
            </span>
          )}
          <h3
            className="font-bold text-sm leading-snug line-clamp-2 mb-1"
            style={{ color: darkMode ? 'rgba(255,255,255,0.92)' : 'var(--text-dark)' }}
          >
            {product.name_ar}
          </h3>
          <div className="flex items-baseline gap-2 justify-end mb-3">
            <span className="text-base font-bold" style={{ color: darkMode ? 'var(--primary-light)' : 'var(--primary)' }} dir="ltr">
              {formatPrice(displayPrice)}
            </span>
            {comparePrice && comparePrice > displayPrice && (
              <span className="text-xs text-gray-400 line-through" dir="ltr">
                {formatPrice(comparePrice)}
              </span>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={product.stock_quantity === 0 || adding}
            aria-label={product.stock_quantity === 0 ? 'نفذت الكمية' : `إضافة ${product.name_ar} للسلة`}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-bold text-white transition-all disabled:cursor-not-allowed"
            style={{
              background: product.stock_quantity === 0 ? '#C8B8AE' : adding ? '#5a9e6f' : 'var(--primary)',
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

// ─── Section Header ────────────────────────────────────────────────────────
function SectionHeader({
  eyebrow,
  title,
  subtitle,
  viewAllHref,
  dark = false,
}: {
  eyebrow: string
  title: string
  subtitle?: string
  viewAllHref: string
  dark?: boolean
}) {
  return (
    <div className="px-6 mb-6 flex items-start justify-between">
      <div className="text-right flex-1">
        <span
          className="text-xs font-bold uppercase tracking-[0.14em] block mb-1"
          style={{ color: dark ? 'var(--primary-light)' : 'var(--primary)' }}
        >
          {eyebrow}
        </span>
        <h2
          className="text-2xl font-bold"
          style={{ color: dark ? 'white' : 'var(--text-dark)', fontFamily: 'var(--font-cormorant), serif' }}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="text-[12px] mt-0.5" style={{ color: dark ? 'rgba(255,255,255,0.55)' : 'var(--on-surface-variant)' }}>
            {subtitle}
          </p>
        )}
      </div>
      <Link
        href={viewAllHref}
        className="flex items-center gap-1 text-xs font-semibold flex-shrink-0 mt-1"
        style={{ color: dark ? 'var(--primary-light)' : 'var(--primary)' }}
      >
        عرض الكل
        <ArrowLeftIcon className="w-3.5 h-3.5" />
      </Link>
    </div>
  )
}

// ─── Horizontal Product Slider ─────────────────────────────────────────────
function ProductSlider({
  products,
  formatPrice,
  darkMode = false,
  badge,
  bgColor,
  loading = false,
}: {
  products: Product[]
  formatPrice: (p: number) => string
  darkMode?: boolean
  badge?: (p: Product) => { text: string; color: string } | undefined
  bgColor: string
  loading?: boolean
}) {
  return (
    <div className="relative">
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-6 pb-2" style={{ scrollbarWidth: 'none' }}>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 snap-start animate-pulse" style={{ width: '44vw', maxWidth: '200px' }}>
                <div className="rounded-2xl aspect-[3/4] mb-3" style={{ background: darkMode ? 'rgba(255,255,255,0.08)' : 'var(--beige)' }} />
                <div className="h-3 rounded w-3/4 mb-2" style={{ background: darkMode ? 'rgba(255,255,255,0.08)' : 'var(--beige)' }} />
                <div className="h-3 rounded w-1/2" style={{ background: darkMode ? 'rgba(255,255,255,0.08)' : 'var(--beige)' }} />
              </div>
            ))
          : products.map((p) => (
              <div key={p.id} className="flex-shrink-0 snap-start" style={{ width: '44vw', maxWidth: '200px' }}>
                <ProductCard product={p} formatPrice={formatPrice} darkMode={darkMode} badge={badge?.(p)} />
              </div>
            ))}
      </div>
      <div
        className="absolute inset-y-0 left-0 w-12 pointer-events-none"
        style={{ background: `linear-gradient(to left, ${bgColor}, transparent)` }}
      />
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
export default function StitchHomeContent({
  featuredProducts,
  categories,
  banners = [],
  announcementText,
  newArrivals = [],
  limitedStock = [],
}: Props) {
  const { formatPrice } = useCountry()
  const [heroIndex, setHeroIndex] = useState(0)
  const [announceIndex, setAnnounceIndex] = useState(0)
  const touchStartX = useRef<number>(0)
  const [bestsellers, setBestsellers] = useState<Product[]>([])
  const [bestsellersLoading, setBestsellersLoading] = useState(true)

  // Rotate announcement messages every 4s
  useEffect(() => {
    const t = setInterval(() => {
      setAnnounceIndex(i => (i + 1) % ANNOUNCE_MESSAGES.length)
    }, 4000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const featuredIds = new Set(featuredProducts.slice(0, 8).map(p => p.id))
    fetch('/api/products/bestsellers?limit=12')
      .then(r => r.json())
      .then(d => {
        if (d.products) {
          setBestsellers(d.products.filter((p: Product) => !featuredIds.has(p.id)).slice(0, 8))
        }
      })
      .catch((err) => console.error('Failed to load bestsellers:', err))
      .finally(() => setBestsellersLoading(false))
  }, [featuredProducts])

  const heroSlides = banners.length > 0 ? banners : [null]

  useEffect(() => {
    if (heroSlides.length <= 1) return
    const timer = setTimeout(() => setHeroIndex(i => (i + 1) % heroSlides.length), 4500)
    return () => clearTimeout(timer)
  }, [heroIndex, heroSlides.length])

  const goNext = () => setHeroIndex(i => (i + 1) % heroSlides.length)
  const goPrev = () => setHeroIndex(i => (i - 1 + heroSlides.length) % heroSlides.length)

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX }
  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(delta) > 50) { delta > 0 ? goNext() : goPrev() }
  }

  const activeCategories = categories.filter(c => c.is_active).slice(0, 6)

  return (
    <div className="min-h-screen" style={{ background: 'var(--off-white)', paddingTop: 'var(--nav-height)' }}>
      <h1 className="sr-only">ديب بيوتي | متجر عناية فاخرة بالبشرة — منتجات طبيعية ١٠٠٪ من الكويت</h1>

      {/* ══════════════════════════════════════
          1. ANNOUNCEMENT TICKER
      ══════════════════════════════════════ */}
      <div
        className="flex items-center justify-center gap-4 py-2.5 px-4 text-xs font-medium text-white"
        style={{ background: 'var(--text-dark)' }}
      >
        <span className="opacity-40" aria-hidden="true">✦</span>
        <span className="transition-all duration-500" key={announceIndex}>
          {announcementText || ANNOUNCE_MESSAGES[announceIndex]}
        </span>
        <span className="opacity-40" aria-hidden="true">✦</span>
        <Link
          href="/products"
          className="flex-shrink-0 px-3 py-1 rounded-full text-[10px] font-bold border border-white/30 hover:bg-white/10 transition-colors"
        >
          تسوقي الآن
        </Link>
      </div>

      {/* ══════════════════════════════════════
          2. HERO SLIDER
      ══════════════════════════════════════ */}
      <section className="px-4 pt-4 pb-3">
        <div
          className="relative w-full rounded-[2rem] overflow-hidden aspect-[3/4] sm:aspect-[16/9]"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          role="region"
          aria-label="الشرائح الرئيسية"
        >
          {/* Slides */}
          {heroSlides.map((slide, i) => (
            <div
              key={i}
              className="absolute inset-0 transition-opacity duration-700"
              style={{ opacity: i === heroIndex ? 1 : 0, pointerEvents: i === heroIndex ? 'auto' : 'none' }}
              aria-hidden={i !== heroIndex}
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

          {/* Gradient veil */}
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
            <p className="text-xs text-white/80 mb-4" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}>
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

          {/* Prev / Next arrows */}
          {heroSlides.length > 1 && (
            <>
              <button
                onClick={goPrev}
                aria-label="الشريحة السابقة"
                className="absolute right-3 top-1/2 -translate-y-1/2 z-[3] w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm flex items-center justify-center transition-all"
              >
                <ChevronRightIcon className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={goNext}
                aria-label="الشريحة التالية"
                className="absolute left-3 top-1/2 -translate-y-1/2 z-[3] w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm flex items-center justify-center transition-all"
              >
                <ChevronLeftIcon className="w-5 h-5 text-white" />
              </button>
            </>
          )}

          {/* Dots */}
          {heroSlides.length > 1 && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-[3] items-center">
              {heroSlides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setHeroIndex(i)}
                  aria-label={`شريحة ${i + 1}`}
                  className="transition-all duration-300 bg-white rounded-full"
                  style={i === heroIndex ? { width: 20, height: 8, opacity: 1 } : { width: 8, height: 8, opacity: 0.4 }}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════
          3. CATEGORY NAVIGATION
      ══════════════════════════════════════ */}
      {activeCategories.length > 0 && (
        <section className="py-6">
          <div className="px-6 mb-5 flex items-center justify-between">
            <div className="text-right">
              <span className="text-xs font-bold uppercase tracking-[0.14em] block mb-1" style={{ color: 'var(--primary)' }}>
                تصفح حسب الفئة
              </span>
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-dark)', fontFamily: 'var(--font-cormorant), serif' }}>
                استكشفي مجموعاتنا
              </h2>
            </div>
            <Link href="/collections" className="flex items-center gap-1 text-xs font-semibold flex-shrink-0" style={{ color: 'var(--primary)' }}>
              عرض الكل
              <ArrowLeftIcon className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-6" style={{ scrollbarWidth: 'none' }}>
            {activeCategories.map((cat, i) => (
              <motion.div
                key={cat.id}
                {...fadeUp}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                className="flex-shrink-0 snap-start"
                style={{ width: '28vw', maxWidth: 110 }}
              >
                <Link href={`/products?category=${encodeURIComponent(cat.slug)}`} className="flex flex-col items-center gap-2 group" aria-label={`تصفح فئة ${cat.name_ar}`}>
                  <div
                    className="w-full aspect-square rounded-full overflow-hidden ring-2 ring-transparent group-hover:ring-[var(--primary)] transition-all duration-300"
                    style={{ background: 'var(--beige)' }}
                  >
                    {cat.image_url ? (
                      <Image src={cat.image_url} alt={cat.name_ar} width={120} height={120} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <SparklesIcon className="w-6 h-6 text-[var(--primary)] opacity-40" />
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-center leading-tight line-clamp-2" style={{ color: 'var(--text-dark)' }}>
                    {cat.name_ar}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════
          4. ABOUT BRAND
      ══════════════════════════════════════ */}
      <section className="px-4 py-4">
        <div
          className="w-full rounded-[2rem] overflow-hidden grid grid-cols-2"
          style={{ minHeight: '200px', background: 'var(--text-dark)' }}
        >
          {/* Text side */}
          <div className="p-6 text-right flex flex-col justify-center gap-3">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--primary-light)' }}>
              قصتنا
            </span>
            <div className="w-8 h-px self-end" style={{ background: 'var(--primary)' }} />
            <h2 className="text-xl font-bold text-white leading-tight" style={{ fontFamily: 'var(--font-cormorant), serif' }}>
              الطبيعة في<br />أبهى صورها
            </h2>
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
              نجمع بين الحكمة العربية والعلوم الحديثة لمنتجات طبيعية ١٠٠٪
            </p>
            <Link
              href="/products"
              className="inline-flex self-end items-center gap-1 px-4 py-2 rounded-full text-xs font-bold text-white mt-1 transition-opacity hover:opacity-90"
              style={{ background: 'var(--primary)' }}
            >
              اكتشفي المجموعة ←
            </Link>
          </div>

          {/* Image/pattern side */}
          <div
            className="relative overflow-hidden"
            style={{ background: 'linear-gradient(160deg, var(--beige) 0%, var(--dark-beige) 100%)' }}
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-15">
              <SparklesIcon className="w-24 h-24 text-[var(--primary)]" />
            </div>
            <div
              className="absolute inset-0"
              style={{ background: 'radial-gradient(circle at 60% 50%, rgba(158,119,76,0.3) 0%, transparent 70%)' }}
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          5. FEATURED PRODUCTS
      ══════════════════════════════════════ */}
      <section className="py-8">
        <div className="mx-6 mb-5 h-px" style={{ background: 'linear-gradient(to left, var(--primary), transparent)' }} />
        <SectionHeader
          eyebrow="مختار بعناية"
          title="منتجات مميزة"
          subtitle="منتجات مختارة خصيصاً لك"
          viewAllHref="/products"
        />
        {featuredProducts.length === 0 ? (
          <div className="mx-6 py-16 rounded-[2rem] flex flex-col items-center justify-center gap-3" style={{ background: 'white' }}>
            <ShoppingBagIcon className="w-12 h-12 text-[var(--primary)] opacity-20" />
            <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>المنتجات تُضاف قريباً ✨</p>
          </div>
        ) : (
          <ProductSlider products={featuredProducts.slice(0, 8)} formatPrice={formatPrice} bgColor="var(--off-white)" />
        )}
      </section>

      {/* ══════════════════════════════════════
          6. PROMO BANNER
      ══════════════════════════════════════ */}
      <section className="px-4 py-6">
        <Link href={banners[1]?.link_url || '/products'} className="block">
          <div className="w-full rounded-[2rem] overflow-hidden grid grid-cols-2" style={{ minHeight: '180px', background: 'var(--text-dark)' }}>
            <div className="p-5 text-right flex flex-col justify-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--primary-light)' }}>
                {banners[1] ? banners[1].title_ar.split(' ').slice(0, 2).join(' ') : 'عرض محدود'}
              </span>
              <div className="w-8 h-px self-end" style={{ background: 'var(--primary)' }} />
              <p className="text-xl font-bold text-white leading-tight" style={{ fontFamily: 'var(--font-cormorant), serif' }}>
                {banners[1]
                  ? banners[1].title_ar.split(' ').slice(2).join(' ') || banners[1].title_ar
                  : <>خصم ٢٠٪<br />على السيروم</>
                }
              </p>
              <span className="inline-flex self-end items-center gap-1 px-4 py-2 rounded-full text-xs font-bold text-white mt-1" style={{ background: 'var(--primary)' }}>
                تسوقي الآن ←
              </span>
            </div>
            <div className="relative overflow-hidden rounded-l-[2rem]" style={{ minHeight: '180px' }}>
              {banners[1]?.image_url ? (
                <Image src={banners[1].image_url} alt={banners[1].title_ar} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(160deg, var(--beige), var(--dark-beige))' }}>
                  <SparklesIcon className="w-10 h-10 opacity-30 text-[var(--primary)]" />
                </div>
              )}
            </div>
          </div>
        </Link>
      </section>

      {/* ══════════════════════════════════════
          7. LIMITED STOCK
      ══════════════════════════════════════ */}
      {limitedStock.length > 0 && (
        <section className="py-8">
          <SectionHeader
            eyebrow="أسرعي قبل النفاد"
            title="كمية محدودة"
            subtitle="هذه المنتجات على وشك النفاد"
            viewAllHref="/products"
          />
          <ProductSlider
            products={limitedStock}
            formatPrice={formatPrice}
            bgColor="var(--off-white)"
            badge={() => ({ text: '🔥 كمية محدودة', color: 'bg-orange-500' })}
          />
        </section>
      )}

      {/* ══════════════════════════════════════
          8. BEST SELLERS — DARK
      ══════════════════════════════════════ */}
      {(bestsellersLoading || bestsellers.length > 0) && (
        <section className="py-8" style={{ background: 'var(--text-dark)' }}>
          <SectionHeader
            eyebrow="الأعلى مبيعاً"
            title="الأكثر مبيعاً"
            subtitle="المنتجات الأكثر طلباً"
            viewAllHref="/products"
            dark
          />
          <ProductSlider
            products={bestsellers}
            formatPrice={formatPrice}
            darkMode
            bgColor="var(--text-dark)"
            loading={bestsellersLoading}
            badge={(p) => p.is_featured ? { text: '⭐ الأكثر مبيعاً', color: 'bg-amber-500' } : undefined}
          />
        </section>
      )}

      {/* ══════════════════════════════════════
          9. NEW ARRIVALS
      ══════════════════════════════════════ */}
      {newArrivals.length > 0 && (
        <section className="py-8">
          <SectionHeader
            eyebrow="أحدث الإضافات"
            title="وصل حديثاً"
            subtitle="أحدث منتجاتنا الجديدة"
            viewAllHref="/products"
          />
          <ProductSlider
            products={newArrivals}
            formatPrice={formatPrice}
            bgColor="var(--off-white)"
            badge={() => ({ text: '🌟 جديد', color: 'bg-green-600' })}
          />
        </section>
      )}

      {/* ══════════════════════════════════════
          10. TRUST BAR
      ══════════════════════════════════════ */}
      <section className="py-6" style={{ background: 'white' }}>
        <div className="h-px mx-6 mb-5" style={{ background: 'var(--beige)' }} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-6">
          {TRUST.map(({ Icon, title, desc }, i) => (
            <motion.div
              key={title}
              {...fadeUp}
              transition={{ duration: 0.45, delay: i * 0.07 }}
              className="flex flex-col items-center text-center gap-2"
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--beige)' }}>
                <Icon className="w-6 h-6 text-[var(--primary)]" />
              </div>
              <p className="text-xs font-bold" style={{ color: 'var(--text-dark)' }}>{title}</p>
              <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          11. TESTIMONIALS
      ══════════════════════════════════════ */}
      <section className="py-10" style={{ background: 'var(--text-dark)' }}>
        <div className="px-6 mb-8 text-right">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary-light)] block mb-2">
            آراء عملائنا
          </span>
          <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-cormorant), serif' }}>
            ما يقولون عنا
          </h2>
          <div className="w-10 h-px mt-3 mr-auto" style={{ background: 'var(--primary)' }} />
        </div>

        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-6 pb-6" style={{ scrollbarWidth: 'none' }}>
          {REVIEWS.map((review, i) => (
            <motion.div
              key={review.name}
              {...fadeUp}
              transition={{ duration: 0.45, delay: i * 0.1 }}
              className="flex-shrink-0 w-[78vw] snap-start rounded-[2rem] p-5"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              <div className="flex gap-1 mb-3 flex-row-reverse justify-end">
                {Array.from({ length: review.rating }).map((_, j) => (
                  <StarIcon key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm leading-relaxed text-right mb-4" style={{ color: 'rgba(255,255,255,0.80)' }}>
                {review.text}
              </p>
              <div className="flex items-center gap-3 pt-3 flex-row-reverse" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0" style={{ background: 'var(--primary)' }}>
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
