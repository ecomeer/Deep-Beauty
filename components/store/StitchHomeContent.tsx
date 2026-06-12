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
  { Icon: TruckIcon,       title: 'توصيل سريع',      desc: 'خلال ٢٤ ساعة في الكويت' },
  { Icon: ShieldCheckIcon, title: '١٠٠٪ طبيعي',      desc: 'مكوّنات نقية آمنة' },
  { Icon: SparklesIcon,    title: 'جودة فاخرة',      desc: 'مصنوع بعناية واحترافية' },
  { Icon: CheckBadgeIcon,  title: 'ضمان الرضا',      desc: 'استبدال أو استرداد كامل' },
]

// ─── Testimonials ──────────────────────────────────────────────────────────
const REVIEWS = [
  { name: 'سارة العنزي',   city: 'الكويت', text: 'من أول أسبوع لاحظت فرقاً واضحاً في بشرتي — أكثر إشراقاً وترطيباً. الآن لا أتخيّل روتيني بدون منتجات ديب بيوتي.', rating: 5 },
  { name: 'نورة الرشيد',   city: 'الرياض', text: 'جودة استثنائية وتغليف أنيق يليق بهديّة. جرّبت الكثير من الماركات، لكن ديب بيوتي كسبت قلبي للأبد.', rating: 5 },
  { name: 'فاطمة الهاشمي', city: 'دبي',    text: 'بشرتي حساسة جداً وكنت خايفة أجرّب، لكن المكوّنات الطبيعية ريّحتني. خدمة العملاء ممتازة والتوصيل كان فوري.', rating: 5 },
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
  const outOfStock = product.stock_quantity === 0

  const discount = product.sale_price
    ? Math.round((1 - product.sale_price / product.price) * 100)
    : product.compare_price
    ? Math.round((1 - product.price / product.compare_price) * 100)
    : 0

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    if (outOfStock) return
    setAdding(true)
    addItem({ id: product.id, name_ar: product.name_ar, name_en: product.name_en,
      price: displayPrice, image: product.images?.[0] || '', quantity: 1, slug: product.slug })
    toast.success('أُضيف للسلة 🛒', { duration: 2000, position: 'bottom-center' })
    setTimeout(() => setAdding(false), 1500)
  }

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    toggleItem({ id: product.id, name_ar: product.name_ar, name_en: product.name_en,
      price: displayPrice, image: product.images?.[0] || '', slug: product.slug })
    toast.success(isWishlisted ? 'أُزيل من المفضلة' : 'أُضيف للمفضلة ❤️', { position: 'bottom-center' })
  }

  const cardBg    = darkMode ? 'rgba(255,255,255,0.06)' : 'white'
  const cardBorder = darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid var(--beige)'

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div
        className="rounded-2xl overflow-hidden transition-all duration-300 group-hover:shadow-lg"
        style={{ background: cardBg, border: cardBorder }}
      >
        {/* ── Image ── */}
        <div className="relative aspect-square overflow-hidden" style={{ background: 'var(--beige)' }}>
          {product.images?.[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name_ar}
              fill
              sizes="(max-width: 640px) 44vw, 200px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              quality={80}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <SparklesIcon className="w-10 h-10 opacity-20 text-[var(--primary)]" />
            </div>
          )}

          {/* Discount badge */}
          {discount > 0 && (
            <span className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full shadow">
              -{discount}٪
            </span>
          )}

          {/* Wishlist */}
          <button
            onClick={handleWishlist}
            aria-label={isWishlisted ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
            className={`absolute top-2.5 left-2.5 w-8 h-8 rounded-full flex items-center justify-center shadow transition-colors duration-200 ${
              isWishlisted ? 'bg-rose-500 text-white' : 'bg-white/90 text-gray-400 hover:bg-rose-50 hover:text-rose-500'
            }`}
          >
            {isWishlisted ? <HeartSolid className="w-3.5 h-3.5" /> : <HeartIcon className="w-3.5 h-3.5" />}
          </button>

          {/* Out of stock */}
          {outOfStock && (
            <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
              <span className="bg-white/95 text-gray-600 text-xs font-bold px-3 py-1.5 rounded-full">
                نفذت الكمية
              </span>
            </div>
          )}
        </div>

        {/* ── Content ── */}
        <div className="p-3 text-right">
          <h3
            className="font-bold text-sm leading-snug line-clamp-2 mb-2"
            style={{ color: darkMode ? 'rgba(255,255,255,0.9)' : 'var(--text-dark)' }}
          >
            {product.name_ar}
          </h3>

          <div className="flex items-center justify-between gap-1 mb-2.5">
            <div className="flex items-baseline gap-1.5">
              {comparePrice && comparePrice > displayPrice && (
                <span className="text-[11px] text-gray-400 line-through" dir="ltr">
                  {formatPrice(comparePrice)}
                </span>
              )}
            </div>
            <span
              className="text-sm font-bold"
              style={{ color: darkMode ? 'var(--primary-light)' : 'var(--primary)' }}
              dir="ltr"
            >
              {formatPrice(displayPrice)}
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={outOfStock || adding}
            aria-label={outOfStock ? 'نفذت الكمية' : `إضافة ${product.name_ar} للسلة`}
            className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white transition-all duration-200 disabled:cursor-not-allowed ${
              outOfStock ? 'bg-[var(--dark-beige)]' : adding ? 'bg-green-500' : 'bg-primary'
            }`}
          >
            {adding
              ? <><CheckIcon className="w-3.5 h-3.5" /> تمت الإضافة</>
              : outOfStock ? 'نفذت الكمية'
              : <><ShoppingBagIcon className="w-3.5 h-3.5" /> أضف للسلة</>
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

  // Middle banner derived values — computed outside JSX to avoid IIFE
  const midBanner      = banners[1]
  const midBannerTitle = midBanner?.title_ar    || 'منتجاتنا الجديدة'
  const midBannerSub   = midBanner?.subtitle_ar || 'اكتشفي أحدث إضافاتنا'
  const midBannerLink  = midBanner?.link_url    || '/products'
  const midBannerImg   = midBanner?.image_url   || null

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
    if (Math.abs(delta) > 50) {
      if (delta > 0) goNext()
      else goPrev()
    }
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
          role="banner"
          aria-live="polite"
          aria-atomic="true"
          className="py-2.5 px-4 text-center text-xs tracking-widest font-bold text-white overflow-hidden"
          style={{ background: 'linear-gradient(90deg, var(--primary-dark) 0%, var(--primary) 50%, var(--primary-dark) 100%)' }}
        >
          <span aria-hidden="true" className="opacity-60 mx-1">◆</span>
          <span className="mx-2">{announcementText}</span>
          <span aria-hidden="true" className="opacity-60 mx-1">◆</span>
          <span className="mx-2 hidden sm:inline">جودة مضمونة ١٠٠٪</span>
          <span aria-hidden="true" className="opacity-60 mx-1 hidden sm:inline">◆</span>
          <span className="mx-2 hidden sm:inline">مصنوع في الكويت 🇰🇼</span>
          <span aria-hidden="true" className="opacity-60 mx-1 hidden sm:inline">◆</span>
        </div>
      )}

      {/* ═══════════════════════════════════════
          2. HERO — SLIDER WITH TEXT OVERLAY
      ═══════════════════════════════════════ */}
      <section className="px-3 pt-3 pb-2">
        <div
          className="relative w-full rounded-[1.75rem] overflow-hidden aspect-[4/5] sm:aspect-[16/9]"
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
                  sizes="100vw"
                  className="object-cover"
                  priority={i === 0}
                  quality={85}
                />
              ) : (
                <div
                  className="w-full h-full"
                  style={{ background: 'linear-gradient(160deg, var(--beige) 0%, var(--dark-beige) 60%, var(--primary) 100%)' }}
                />
              )}
            </div>
          ))}

          {/* Gradient — stronger bottom veil */}
          <div
            className="absolute inset-x-0 bottom-0 h-3/4 pointer-events-none z-[1]"
            style={{ background: 'linear-gradient(to top, rgba(20,12,6,0.88) 0%, rgba(20,12,6,0.4) 45%, transparent 100%)' }}
          />

          {/* Text overlay */}
          <div className="absolute bottom-10 right-4 left-4 z-[2] text-right">
            <div className="inline-flex items-center gap-1.5 mb-3 px-3 py-1 rounded-full" style={{ background: 'rgba(139,94,60,0.9)' }}>
              <span className="text-xs font-bold tracking-[0.12em] uppercase text-white">✦ ديب بيوتي الكويت</span>
            </div>
            <h2
              className="text-[2rem] sm:text-4xl font-bold text-white leading-[1.15] mb-2.5 font-headline"
              style={{ textShadow: '0 2px 20px rgba(0,0,0,0.6)' }}
            >
              {(heroSlides[heroIndex] as Banner | null)?.title_ar || 'جمالك يبدأ من الأعماق'}
            </h2>
            <p className="text-[13px] text-white/80 mb-5 leading-relaxed max-w-[280px] mr-auto" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}>
              {(heroSlides[heroIndex] as Banner | null)?.subtitle_ar || 'عناية فاخرة بالبشرة — منتجات طبيعية ١٠٠٪'}
            </p>
            <div className="flex items-center gap-2.5">
              <Link
                href={(heroSlides[heroIndex] as Banner | null)?.link_url || '/products'}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white shadow-lg transition-all active:scale-95"
                style={{ background: 'var(--primary)' }}
              >
                تسوّقي الآن
                <ArrowLeftIcon className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center px-4 py-2.5 rounded-full text-sm font-semibold text-white transition-all"
                style={{ background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.22)' }}
              >
                من نحن
              </Link>
            </div>
          </div>

          {/* Pagination dots — accessible with aria-current */}
          {heroSlides.length > 1 && (
            <div
              className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-[3] items-center"
              role="tablist"
              aria-label="شرائح العرض"
            >
              {heroSlides.map((slide, i) => (
                <button
                  key={i}
                  role="tab"
                  onClick={() => setHeroIndex(i)}
                  aria-label={`الشريحة ${i + 1}${(slide as Banner | null)?.title_ar ? ': ' + (slide as Banner).title_ar : ''}`}
                  aria-selected={i === heroIndex}
                  aria-current={i === heroIndex ? 'true' : undefined}
                  className="transition-all duration-300 bg-white rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
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
          3. CATEGORY NAVIGATION — RECTANGULAR CARDS
      ═══════════════════════════════════════ */}
      {activeCategories.length > 0 && (
        <section className="py-8">
          <div className="px-4 mb-4 flex items-center justify-between">
            <div className="text-right">
              <span className="text-xs font-bold uppercase tracking-[0.15em] block mb-0.5" style={{ color: 'var(--primary)' }}>
                تسوّقي حسب الفئة
              </span>
              <h2 className="text-xl font-bold font-headline text-[var(--text-dark)]">
                اكتشفي مجموعاتنا
              </h2>
            </div>
            <Link href="/products" className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--primary)' }}>
              الكل <ArrowLeftIcon className="w-3 h-3" />
            </Link>
          </div>

          {/* Horizontal scroll — rectangular cards with image overlay */}
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-4" style={{ scrollbarWidth: 'none' }}>
            {activeCategories.map((cat, i) => (
              <motion.div
                key={cat.id}
                {...fadeUp}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="flex-shrink-0 snap-start"
                style={{ width: '36vw', maxWidth: 148 }}
              >
                <Link
                  href={`/products?category=${encodeURIComponent(cat.name_ar)}`}
                  aria-label={`تصفح فئة ${cat.name_ar}`}
                  className="group block relative rounded-2xl overflow-hidden aspect-[3/4]"
                  style={{ background: 'var(--beige)' }}
                >
                  {/* Image */}
                  {cat.image_url && (
                    <Image
                      src={cat.image_url}
                      alt={cat.name_ar}
                      fill
                      sizes="(max-width: 640px) 36vw, 148px"
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                      quality={75}
                    />
                  )}

                  {/* Gradient overlay — always present for text readability */}
                  <div
                    className="absolute inset-0 transition-opacity duration-300"
                    style={{ background: 'linear-gradient(to top, rgba(30,18,10,0.72) 0%, rgba(30,18,10,0.1) 55%, transparent 100%)' }}
                  />

                  {/* Category label at bottom */}
                  <div className="absolute bottom-0 inset-x-0 p-3 text-right">
                    <span className="text-white font-bold text-sm leading-tight block line-clamp-2" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}>
                      {cat.name_ar}
                    </span>
                  </div>

                  {/* Hover glow border */}
                  <div
                    className="absolute inset-0 rounded-2xl ring-2 ring-transparent group-hover:ring-[var(--primary)] transition-all duration-300"
                  />
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
          className="mx-4 mb-5 h-px"
          style={{ background: 'linear-gradient(to left, var(--primary), transparent)' }}
        />

        {/* Eyebrow + heading */}
        <div className="px-4 mb-5 flex items-center justify-between">
          <div className="text-right">
            <span className="text-xs font-bold uppercase tracking-[0.14em] block mb-0.5" style={{ color: 'var(--primary)' }}>
              ✦ مختار بعناية
            </span>
            <h2 className="text-xl font-bold font-headline text-[var(--text-dark)]">
              أبرز منتجاتنا
            </h2>
          </div>
          <Link href="/products" className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--primary)' }}>
            عرض الكل <ArrowLeftIcon className="w-3 h-3" />
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
              className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-4 pb-1"
              style={{ scrollbarWidth: 'none' }}
              role="list"
              aria-label="المنتجات المختارة"
              tabIndex={0}
              onKeyDown={e => {
                const el = e.currentTarget
                if (e.key === 'ArrowLeft') { e.preventDefault(); el.scrollBy({ left: -200, behavior: 'smooth' }) }
                if (e.key === 'ArrowRight') { e.preventDefault(); el.scrollBy({ left: 200, behavior: 'smooth' }) }
              }}
            >
              {featuredProducts.slice(0, 8).map((product) => (
                <div
                  key={product.id}
                  className="flex-shrink-0 snap-start"
                  style={{ width: '42vw', maxWidth: '185px' }}
                >
                  <MobileProductCard product={product} formatPrice={formatPrice} />
                </div>
              ))}
            </div>
            <div className="absolute inset-y-0 left-0 w-10 pointer-events-none" style={{ background: 'linear-gradient(to left, var(--off-white), transparent)' }} />
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════
          5. MIDDLE BANNER — SPLIT CARD
      ═══════════════════════════════════════ */}
      <section className="px-4 py-8">
        <Link href={midBannerLink} className="block group">
          <div
            className="w-full rounded-[2rem] overflow-hidden transition-transform duration-300 group-hover:scale-[1.01]"
            style={{
              minHeight: '220px',
              background: 'var(--text-dark)',
              boxShadow: '0 16px 48px rgba(58,42,30,0.2)',
              display: 'grid',
              gridTemplateColumns: midBannerImg ? '1fr 1fr' : '1fr',
            }}
          >
            {/* RIGHT col (RTL first): Text */}
            <div className="p-6 text-right flex flex-col justify-center gap-3">
              <span
                className="text-xs font-bold uppercase tracking-[0.16em]"
                style={{ color: 'var(--primary-light)' }}
              >
                ✦ عرض حصري
              </span>
              <div className="w-10 h-0.5 self-end rounded-full" style={{ background: 'var(--primary)' }} />
              <p
                className="text-2xl font-bold text-white leading-snug font-headline"
              >
                {midBannerTitle}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {midBannerSub}
              </p>
              <span
                className="inline-flex self-end items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold text-white mt-1 transition-all group-hover:opacity-90"
                style={{ background: 'var(--primary)' }}
              >
                تسوّقي الآن
                <ArrowLeftIcon className="w-3.5 h-3.5" />
              </span>
            </div>

            {/* LEFT col: Image (only renders when image exists) */}
            {midBannerImg && (
              <div className="relative overflow-hidden rounded-l-[2rem]" style={{ minHeight: '220px' }}>
                <Image
                  src={midBannerImg}
                  alt={midBannerTitle}
                  fill
                  sizes="50vw"
                  className="object-cover"
                  loading="lazy"
                  quality={80}
                />
              </div>
            )}
          </div>
        </Link>
      </section>

      {/* ═══════════════════════════════════════
          6. BESTSELLERS SLIDER — DARK BACKGROUND
      ═══════════════════════════════════════ */}
      {(bestsellersLoading || bestsellers.length > 0) && (
        <section className="py-12 bg-[var(--text-dark)]">
          {/* Eyebrow + heading */}
          <div className="px-4 mb-5 flex items-center justify-between">
            <div className="text-right">
              <span className="text-xs font-bold uppercase tracking-[0.14em] block mb-0.5" style={{ color: 'var(--primary-light)' }}>
                ✦ الأعلى مبيعاً
              </span>
              <h2 className="text-xl font-bold text-white font-headline">
                الأكثر طلباً
              </h2>
            </div>
            <Link href="/products" className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--primary-light)' }}>
              عرض الكل <ArrowLeftIcon className="w-3 h-3" />
            </Link>
          </div>

          {/* Slider with edge fade */}
          <div className="relative">
            <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-4 pb-2" style={{ scrollbarWidth: 'none' }}>
              {bestsellersLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex-shrink-0 snap-start animate-pulse" style={{ width: '42vw', maxWidth: '185px' }}>
                      <div className="rounded-2xl aspect-square mb-2" style={{ background: 'rgba(255,255,255,0.08)' }} />
                      <div className="h-2.5 rounded w-3/4 mb-1.5" style={{ background: 'rgba(255,255,255,0.08)' }} />
                      <div className="h-2.5 rounded w-1/2" style={{ background: 'rgba(255,255,255,0.08)' }} />
                    </div>
                  ))
                : bestsellers.map((product) => (
                    <div key={product.id} className="flex-shrink-0 snap-start" style={{ width: '42vw', maxWidth: '185px' }}>
                      <MobileProductCard product={product} formatPrice={formatPrice} darkMode />
                    </div>
                  ))}
            </div>
            <div className="absolute inset-y-0 left-0 w-10 pointer-events-none" style={{ background: 'linear-gradient(to left, var(--text-dark), transparent)' }} />
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════
          7. TRUST BAR — HORIZONTAL SCROLL STRIP
      ═══════════════════════════════════════ */}
      <section className="py-8 cv-auto bg-white">
        {/* Subtle top divider */}
        <div className="h-px mx-6 mb-6" style={{ background: 'var(--beige)' }} />

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
      <section className="py-12 cv-auto bg-[var(--text-dark)]">
        <div className="px-6 mb-8 text-right">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary-light)] block mb-2">
            ✦ آراء عملائنا
          </span>
          <h2
            className="text-2xl font-bold text-white font-headline"
          >
            يحبّون ديب بيوتي
          </h2>
          <p className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
            تقييمات حقيقية من عميلاتنا الكريمات
          </p>
          {/* Decorative line */}
          <div className="w-10 h-0.5 mt-3 mr-auto rounded-full" style={{ background: 'var(--primary)' }} />
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
              {/* Stars — with accessible rating label */}
              <div
                className="flex gap-1 mb-3 flex-row-reverse justify-end"
                role="img"
                aria-label={`تقييم ${review.rating} من 5 نجوم`}
              >
                {Array.from({ length: review.rating }).map((_, j) => (
                  <StarIcon key={j} className="w-4 h-4 text-amber-400 fill-amber-400" aria-hidden="true" />
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
