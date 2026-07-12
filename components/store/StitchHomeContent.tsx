'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Product, Category } from '@/types'
import { useCountry } from '@/context/CountryContext'
import FadeUp from '@/components/store/FadeUp'
import { useCartContext } from '@/context/CartContext'
import { useWishlistContext } from '@/context/WishlistContext'
import {
  ShoppingBagIcon,
  HeartIcon,
  TruckIcon,
  ShieldCheckIcon,
  SparklesIcon,
  CheckBadgeIcon,
  CheckIcon,
  ArrowLeftIcon,
  FireIcon,
  BeakerIcon,
  SunIcon,
  PaperAirplaneIcon,
  NoSymbolIcon,
  HandRaisedIcon,
  GlobeAltIcon,
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

// ─── Trust features ────────────────────────────────────────────────────────
const TRUST = [
  { Icon: TruckIcon,       title: 'توصيل سريع',      desc: 'خلال ٢٤ ساعة في الكويت' },
  { Icon: ShieldCheckIcon, title: '١٠٠٪ طبيعي',      desc: 'مكوّنات نقية آمنة' },
  { Icon: SparklesIcon,    title: 'جودة فاخرة',      desc: 'مصنوع بعناية واحترافية' },
  { Icon: CheckBadgeIcon,  title: 'ضمان الرضا',      desc: 'استبدال أو استرداد كامل' },
]

// ─── Instagram icon (inline SVG) ──────────────────────────────────────────
function IconInstagram({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  )
}

// ─── Certifications ───────────────────────────────────────────────────────
const CERTS = [
  { Icon: GlobeAltIcon, label: 'صنع في الكويت 🇰🇼' },
  { Icon: NoSymbolIcon, label: 'خالي من البارابين' },
  { Icon: HandRaisedIcon, label: 'لم يُختبر على الحيوانات' },
  { Icon: BeakerIcon, label: 'بدون مواد كيميائية ضارّة' },
]

// ─── Skincare routine steps ──────────────────────────────────────────────
const ROUTINE_STEPS = [
  { Icon: BeakerIcon, step: '١', title: 'التنظيف', desc: 'ابدأي بغسول لطيف يزيل الشوائب دون أن يجفّف بشرتك.' },
  { Icon: SunIcon, step: '٢', title: 'الترطيب', desc: 'رطّبي بعمق بكريم غني بالمكونات الطبيعية المغذّية.' },
  { Icon: ShieldCheckIcon, step: '٣', title: 'الحماية', desc: 'احمي بشرتك يومياً بسيروم مضاد للأكسدة ومعزّز للإشراق.' },
]

// ─── Section header (eyebrow + headline + "view all" link) ───────────────
function SectionHeader({
  eyebrow,
  title,
  linkLabel = 'عرض الكل',
  href = '/products',
  dark = false,
}: {
  eyebrow: string
  title: string
  linkLabel?: string
  href?: string
  dark?: boolean
}) {
  const accent = dark ? 'text-[var(--primary-light)]' : 'text-primary'
  return (
    <div className="px-4 mb-5 flex items-center justify-between">
      <div className="text-right">
        <span className={`text-xs font-bold uppercase tracking-[0.14em] block mb-0.5 ${accent}`}>
          {eyebrow}
        </span>
        <h2 className={`text-xl font-bold font-headline ${dark ? 'text-white' : 'text-[var(--text-dark)]'}`}>
          {title}
        </h2>
      </div>
      <Link href={href} className={`flex items-center gap-1 text-xs font-semibold ${accent}`}>
        {linkLabel} <ArrowLeftIcon className="w-3 h-3" />
      </Link>
    </div>
  )
}

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
        <div className="relative aspect-square overflow-hidden bg-[var(--beige)]">
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

  // Countdown timer — offer ends at midnight tonight
  const [countdown, setCountdown] = useState({ h: '00', m: '00', s: '00' })
  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const end = new Date(now)
      end.setHours(23, 59, 59, 999)
      const diff = Math.max(0, end.getTime() - now.getTime())
      const h = Math.floor(diff / 3_600_000)
      const m = Math.floor((diff % 3_600_000) / 60_000)
      const s = Math.floor((diff % 60_000) / 1_000)
      setCountdown({
        h: String(h).padStart(2, '0'),
        m: String(m).padStart(2, '0'),
        s: String(s).padStart(2, '0'),
      })
    }
    tick()
    const id = setInterval(tick, 1_000)
    return () => clearInterval(id)
  }, [])

  // Newsletter (home page)
  const [nlEmail, setNlEmail] = useState('')
  const [nlDone, setNlDone] = useState(false)
  const [nlLoading, setNlLoading] = useState(false)

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
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white shadow-lg transition-all active:scale-95 bg-primary"
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
          3. TRUST BAR — REASSURANCE RIGHT AFTER HERO
      ═══════════════════════════════════════ */}
      <section className="py-8 bg-white border-b border-[var(--beige)]">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-6">
          {TRUST.map(({ Icon, title, desc }, i) => (
            <FadeUp
              key={title}
              duration={0.45}
              delay={i * 0.07}
              className="flex flex-col items-center text-center gap-2"
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[var(--beige)]"
              >
                <Icon className="w-6 h-6 text-[var(--primary)]" />
              </div>
              <p className="text-xs font-bold text-[var(--text-dark)]">{title}</p>
              <p className="text-xs text-[var(--on-surface-variant)]">{desc}</p>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════
          3.5. OFFER COUNTDOWN TIMER
      ═══════════════════════════════════════ */}
      <section className="px-4 py-6">
        <Link href="/offers" className="block group">
          <div className="rounded-2xl p-5 text-center bg-gradient-to-r from-[var(--primary-dark)] via-[var(--primary)] to-[var(--primary-dark)] shadow-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <FireIcon className="w-5 h-5 text-amber-300" />
              <span className="text-xs font-bold uppercase tracking-widest text-white/80">عرض اليوم — ينتهي خلال</span>
              <FireIcon className="w-5 h-5 text-amber-300" />
            </div>
            <div className="flex items-center justify-center gap-3" dir="ltr" suppressHydrationWarning>
              {[
                { val: countdown.h, label: 'ساعة' },
                { val: countdown.m, label: 'دقيقة' },
                { val: countdown.s, label: 'ثانية' },
              ].map((t, i) => (
                <div key={i} className="flex flex-col items-center">
                  <span className="text-2xl font-bold font-headline text-white tabular-nums" suppressHydrationWarning>
                    {t.val}
                  </span>
                  <span className="text-[10px] text-white/60">{t.label}</span>
                </div>
              ))}
            </div>
            <span className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 rounded-full text-xs font-bold text-[var(--primary-dark)] bg-white shadow transition-transform group-hover:scale-105">
              تصفّحي العروض
              <ArrowLeftIcon className="w-3 h-3" />
            </span>
          </div>
        </Link>
      </section>

      {/* ═══════════════════════════════════════
          4. CATEGORY NAVIGATION — RECTANGULAR CARDS
      ═══════════════════════════════════════ */}
      {activeCategories.length > 0 && (
        <section className="py-8">
          <SectionHeader eyebrow="تسوّقي حسب الفئة" title="اكتشفي مجموعاتنا" linkLabel="الكل" />

          {/* Horizontal scroll — rectangular cards with image overlay */}
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-4" style={{ scrollbarWidth: 'none' }}>
            {activeCategories.map((cat, i) => (
              <FadeUp
                key={cat.id}
                duration={0.4}
                delay={i * 0.07}
                className="flex-shrink-0 snap-start"
                style={{ width: '36vw', maxWidth: 148 }}
              >
                <Link
                  href={`/products?category=${encodeURIComponent(cat.slug)}`}
                  aria-label={`تصفح فئة ${cat.name_ar}`}
                  className="group block relative rounded-2xl overflow-hidden aspect-[3/4] bg-[var(--beige)]"
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
              </FadeUp>
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════
          5. FEATURED PRODUCTS SLIDER
      ═══════════════════════════════════════ */}
      <section className="py-8">
        {/* Accent line */}
        <div
          className="mx-4 mb-5 h-px"
          style={{ background: 'linear-gradient(to left, var(--primary), transparent)' }}
        />

        {/* Eyebrow + heading */}
        <SectionHeader eyebrow="✦ مختار بعناية" title="أبرز منتجاتنا" />

        {featuredProducts.length === 0 ? (
          <div
            className="mx-6 py-16 rounded-[2rem] flex flex-col items-center justify-center gap-3 bg-white"
          >
            <ShoppingBagIcon className="w-12 h-12 text-[var(--primary)] opacity-20" />
            <p className="text-sm text-[var(--on-surface-variant)]">المنتجات تُضاف قريباً ✨</p>
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
          5.5. SKINCARE ROUTINE — 3 STEPS
      ═══════════════════════════════════════ */}
      <section className="py-10 bg-white border-t border-[var(--beige)]">
        <div className="px-6 mb-8 text-right">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-primary block mb-2">
            ✦ روتينك اليومي
          </span>
          <h2 className="text-xl font-bold font-headline text-[var(--text-dark)]">
            ٣ خطوات لبشرة مشرقة
          </h2>
        </div>

        <div className="flex flex-col gap-4 px-6">
          {ROUTINE_STEPS.map(({ Icon, step, title, desc }, i) => (
            <FadeUp
              key={title}
              duration={0.45}
              delay={i * 0.12}
              className="flex items-start gap-4 text-right"
            >
              <div className="relative flex-shrink-0">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[var(--beige)]">
                  <Icon className="w-6 h-6 text-[var(--primary)]" />
                </div>
                <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shadow">
                  {step}
                </span>
              </div>
              <div className="pt-1">
                <p className="text-sm font-bold text-[var(--text-dark)] mb-1">{title}</p>
                <p className="text-xs leading-relaxed text-[var(--on-surface-variant)]">{desc}</p>
              </div>
            </FadeUp>
          ))}
        </div>

        <div className="px-6 mt-6">
          <Link
            href="/products"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold text-primary border border-[var(--beige)] hover:bg-[var(--off-white)] transition-colors"
          >
            تسوّقي منتجات الروتين
            <ArrowLeftIcon className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          6. MIDDLE BANNER — SPLIT CARD
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
                className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary-light)]"
              >
                ✦ عرض حصري
              </span>
              <div className="w-10 h-0.5 self-end rounded-full bg-primary" />
              <p
                className="text-2xl font-bold text-white leading-snug font-headline"
              >
                {midBannerTitle}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {midBannerSub}
              </p>
              <span
                className="inline-flex self-end items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold text-white mt-1 transition-all group-hover:opacity-90 bg-primary"
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
          7. BESTSELLERS SLIDER — DARK BACKGROUND
      ═══════════════════════════════════════ */}
      {(bestsellersLoading || bestsellers.length > 0) && (
        <section className="py-12 bg-[var(--text-dark)]">
          {/* Eyebrow + heading */}
          <SectionHeader eyebrow="✦ الأعلى مبيعاً" title="الأكثر طلباً" dark />

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
          7.5. CERTIFICATIONS BAR
      ═══════════════════════════════════════ */}
      <section className="py-8 bg-[var(--off-white)] border-y border-[var(--beige)]">
        <div className="flex gap-6 overflow-x-auto px-6 snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
          {CERTS.map(({ Icon, label }, i) => (
            <FadeUp
              key={label}
              duration={0.4}
              delay={i * 0.08}
              className="flex-shrink-0 snap-start flex items-center gap-2.5"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-[var(--beige)]">
                <Icon className="w-5 h-5 text-[var(--primary)]" />
              </div>
              <span className="text-xs font-bold text-[var(--text-dark)] whitespace-nowrap">{label}</span>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════
          8. WHY DEEP BEAUTY — BRAND STORY CLOSER
      ═══════════════════════════════════════ */}
      <section className="py-14 bg-white">
        <div className="px-6 mb-10 text-right">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-primary block mb-2">
            ✦ لماذا ديب بيوتي
          </span>
          <h2 className="text-2xl font-bold font-headline text-[var(--text-dark)] mb-3">
            جمال حقيقي من الأعماق
          </h2>
          <p className="text-sm leading-relaxed text-[var(--on-surface-variant)] max-w-md">
            نؤمن بأن العناية الحقيقية تبدأ من مكوّنات نقية ومعايير لا تقبل المساومة.
            كل منتج يمرّ برحلة بحث وتطوير دقيقة ليصل إليكِ بأعلى جودة.
          </p>
          <div className="w-10 h-0.5 mt-4 mr-auto rounded-full bg-primary" />
        </div>

        {/* Stats counters */}
        <div className="grid grid-cols-3 gap-3 px-6 mb-10">
          {[
            { val: '٣+', label: 'سنوات خبرة' },
            { val: '١٠٠٪', label: 'مكونات طبيعية' },
            { val: '٥٠٠٠+', label: 'عميلة سعيدة' },
          ].map((stat, i) => (
            <FadeUp
              key={stat.label}
              duration={0.45}
              delay={i * 0.1}
              className="text-center py-5 rounded-2xl border border-[var(--beige)] bg-[var(--off-white)]"
            >
              <span className="block text-2xl font-bold font-headline text-primary mb-1">
                {stat.val}
              </span>
              <span className="text-xs text-[var(--on-surface-variant)]">
                {stat.label}
              </span>
            </FadeUp>
          ))}
        </div>

        {/* Brand values grid */}
        <div className="grid grid-cols-2 gap-3 px-6 mb-10">
          {TRUST.map(({ Icon, title, desc }, i) => (
            <FadeUp
              key={title}
              duration={0.45}
              delay={i * 0.08}
              className="p-4 rounded-2xl border border-[var(--beige)] bg-[var(--off-white)] text-right"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--beige)] mb-3">
                <Icon className="w-5 h-5 text-[var(--primary)]" />
              </div>
              <p className="text-sm font-bold text-[var(--text-dark)] mb-1">{title}</p>
              <p className="text-xs leading-relaxed text-[var(--on-surface-variant)]">{desc}</p>
            </FadeUp>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="flex items-center justify-center gap-3 px-6">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white shadow-lg transition-all active:scale-95 bg-primary"
          >
            تسوّقي الآن
            <ArrowLeftIcon className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center px-5 py-3 rounded-full text-sm font-semibold text-[var(--text-dark)] transition-all border border-[var(--beige)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
          >
            قصّتنا
          </Link>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          9. INSTAGRAM / SOCIAL PROOF
      ═══════════════════════════════════════ */}
      <section className="py-10 bg-[var(--off-white)]">
        <div className="px-6 mb-6 text-right">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-primary block mb-2">
            ✦ تابعينا
          </span>
          <h2 className="text-xl font-bold font-headline text-[var(--text-dark)]">
            الأكثر رواجاً على إنستغرام
          </h2>
          <p className="text-xs mt-1.5 text-[var(--on-surface-variant)]">
            @deepbeautykw
          </p>
        </div>

        <div className="grid grid-cols-3 gap-1.5 px-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <a
              key={i}
              href="https://www.instagram.com/deepbeautykw/"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square rounded-xl overflow-hidden bg-[var(--beige)]"
            >
              <div className="w-full h-full flex items-center justify-center">
                <SparklesIcon className="w-8 h-8 text-[var(--primary)] opacity-20" />
              </div>
              <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/30 transition-colors flex items-center justify-center">
                <IconInstagram className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </a>
          ))}
        </div>

        <div className="px-6 mt-5 text-center">
          <a
            href="https://www.instagram.com/deepbeautykw/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-primary border border-[var(--beige)] hover:bg-white transition-colors"
          >
            <IconInstagram className="w-4 h-4" />
            تابعينا على إنستغرام
          </a>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          10. NEWSLETTER CTA
      ═══════════════════════════════════════ */}
      <section className="py-12 bg-[var(--text-dark)]">
        <div className="px-6 text-center">
          <PaperAirplaneIcon className="w-8 h-8 text-primary mx-auto mb-3 -rotate-45" />
          <h2 className="text-xl font-bold font-headline text-white mb-2">
            احصلي على خصم ١٠٪ على أول طلب
          </h2>
          <p className="text-xs text-white/55 mb-6 max-w-xs mx-auto">
            اشتركي في نشرتنا البريدية واحصلي على عروض حصرية ومنتجات جديدة قبل الجميع.
          </p>

          {nlDone ? (
            <div className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium bg-green-500/[0.15] text-green-400">
              <CheckIcon className="w-5 h-5" />
              تمّ الاشتراك — ترقبي الخصم في بريدك
            </div>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                if (!nlEmail || nlLoading) return
                setNlLoading(true)
                try {
                  const res = await fetch('/api/newsletter', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: nlEmail }),
                  })
                  if (!res.ok) throw new Error()
                  setNlDone(true)
                } catch {
                  // silent — footer form is the fallback
                } finally {
                  setNlLoading(false)
                }
              }}
              className="flex gap-2 max-w-sm mx-auto"
            >
              <input
                type="email"
                value={nlEmail}
                onChange={e => setNlEmail(e.target.value)}
                placeholder="البريد الإلكتروني"
                required
                className="flex-1 px-4 py-3 rounded-xl text-sm outline-none text-white bg-white/[0.08] border border-white/10 focus:border-primary focus:bg-white/10 transition-all"
              />
              <button
                type="submit"
                disabled={nlLoading}
                className="px-5 py-3 rounded-xl text-sm font-bold text-white bg-primary hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
              >
                {nlLoading ? '...' : 'اشتركي'}
              </button>
            </form>
          )}
        </div>
      </section>

    </div>
  )
}
