'use client'

import { useState } from 'react'
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
}: {
  product: Product
  formatPrice: (p: number) => string
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
              <span className="px-2.5 py-1 bg-red-500 text-white text-[11px] font-bold rounded-full shadow-sm">
                -{discount}٪
              </span>
            )}
            {product.is_featured && !discount && (
              <span className="px-2.5 py-1 bg-amber-500 text-white text-[11px] font-bold rounded-full shadow-sm">
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
            style={{ color: 'var(--text-dark)', fontFamily: 'var(--font-tajawal), sans-serif' }}
          >
            {product.name_ar}
          </h3>

          {/* Price row */}
          <div className="flex items-baseline gap-2 justify-end mb-3">
            <span className="text-base font-bold" style={{ color: 'var(--primary)' }} dir="ltr">
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

  const heroSlides = banners.length > 0 ? banners : [null]
  const currentSlide = heroSlides[heroIndex]

  return (
    <div className="min-h-screen" style={{ background: 'var(--off-white)', paddingTop: 'var(--nav-height)' }}>

      {/* ═══════════════════════════════════════
          1. ANNOUNCEMENT BAR
      ═══════════════════════════════════════ */}
      {announcementText && (
        <div
          className="py-2.5 px-4 text-center text-xs tracking-wide font-medium text-white"
          style={{ background: 'var(--text-dark)' }}
        >
          <span aria-hidden="true">✦</span>
          <span className="mx-3">{announcementText}</span>
          <span aria-hidden="true">✦</span>
        </div>
      )}

      {/* ═══════════════════════════════════════
          2. HERO SLIDER  (aspect 4:5)
      ═══════════════════════════════════════ */}
      <section className="px-4 pt-4 pb-2">
        <div
          className="relative w-full rounded-[2rem] overflow-hidden"
          style={{ aspectRatio: '4/5' }}
        >
          {/* Background image / gradient */}
          {(currentSlide as Banner | null)?.image_url ? (
            <Image
              src={(currentSlide as Banner).image_url}
              alt={(currentSlide as Banner).title_ar}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(160deg, var(--beige) 0%, var(--dark-beige) 100%)' }}
            />
          )}

          {/* Dark overlay */}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(30,18,8,0.70) 0%, rgba(30,18,8,0.15) 55%, transparent 100%)' }}
          />

          {/* Content */}
          <div className="absolute inset-0 flex flex-col justify-end px-7 pb-14 text-right">
            <motion.div
              key={heroIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
            >
              <span
                className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-3"
                style={{ background: 'rgba(156,102,68,0.75)', color: 'white' }}
              >
                منتجات طبيعية ١٠٠٪
              </span>
              <h1
                className="text-3xl font-bold text-white leading-snug mb-2"
                style={{ fontFamily: 'var(--font-cormorant), serif' }}
              >
                {(currentSlide as Banner | null)?.title_ar || (
                  <>جمالكِ يبدأ<br />من الأصل</>
                )}
              </h1>
              <p className="text-sm text-white/75 mb-6 leading-relaxed">
                {(currentSlide as Banner | null)?.subtitle_ar ||
                  'منتجات عناية فاخرة مصنوعة من مكونات طبيعية مختارة'}
              </p>
              <Link
                href={(currentSlide as Banner | null)?.link_url || '/products'}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white transition-all hover:opacity-90"
                style={{ background: 'var(--primary)' }}
              >
                <ShoppingBagIcon className="w-4 h-4" />
                تسوقي الآن
              </Link>
            </motion.div>
          </div>

          {/* Pagination dots */}
          {heroSlides.length > 1 && (
            <div className="absolute bottom-5 inset-x-0 flex justify-center gap-2">
              {heroSlides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setHeroIndex(i)}
                  aria-label={`شريحة ${i + 1}`}
                  className="transition-all rounded-full"
                  style={{
                    width: i === heroIndex ? '24px' : '8px',
                    height: '8px',
                    background: i === heroIndex ? 'white' : 'rgba(255,255,255,0.45)',
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════
          3. TRUST / FEATURE BAR
      ═══════════════════════════════════════ */}
      <section className="px-4 py-4">
        <div className="grid grid-cols-2 gap-3">
          {TRUST.map(({ Icon, title, desc }, i) => (
            <motion.div
              key={title}
              {...fadeUp}
              transition={{ duration: 0.45, delay: i * 0.07 }}
              className="flex items-center gap-3 px-4 py-4 rounded-[2rem]"
              style={{ background: 'white', boxShadow: 'var(--shadow-sm)' }}
            >
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--beige)' }}
              >
                <Icon className="w-5 h-5 text-[var(--primary)]" />
              </div>
              <div className="text-right">
                <p className="text-xs font-bold" style={{ color: 'var(--text-dark)' }}>{title}</p>
                <p className="text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════
          4. CATEGORY NAVIGATION (CIRCULAR)
      ═══════════════════════════════════════ */}
      {categories.filter(c => c.is_active).length > 0 && (
        <section className="py-6">
          {/* Section heading */}
          <div className="px-6 mb-5 flex items-center justify-between">
            <h2
              className="text-xl font-bold text-right"
              style={{ color: 'var(--text-dark)', fontFamily: 'var(--font-cormorant), serif' }}
            >
              استكشلي مجموعاتنا
            </h2>
            <Link
              href="/products"
              className="flex items-center gap-1 text-xs font-semibold"
              style={{ color: 'var(--primary)' }}
            >
              الكل
              <ArrowLeftIcon className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-4 gap-4 px-6">
            {categories.filter(c => c.is_active).slice(0, 4).map((cat, i) => (
              <motion.div
                key={cat.id}
                {...fadeUp}
                transition={{ duration: 0.45, delay: i * 0.08 }}
              >
                <Link
                  href={`/products?category=${encodeURIComponent(cat.slug)}`}
                  className="flex flex-col items-center gap-2 group"
                  aria-label={`تصفح فئة ${cat.name_ar}`}
                >
                  {/* Circular image */}
                  <div
                    className="w-full aspect-square rounded-full overflow-hidden"
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
                    className="text-[11px] font-semibold text-center leading-tight line-clamp-2"
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
          5. FEATURED PRODUCTS GRID
      ═══════════════════════════════════════ */}
      <section className="py-6">
        {/* Section heading */}
        <div className="px-6 mb-5 flex items-center justify-between">
          <h2
            className="text-xl font-bold text-right"
            style={{ color: 'var(--text-dark)', fontFamily: 'var(--font-cormorant), serif' }}
          >
            منتجاتنا المختارة
          </h2>
          <Link
            href="/products"
            className="flex items-center gap-1 text-xs font-semibold"
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
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 px-6">
            {featuredProducts.slice(0, 6).map((product, i) => (
              <motion.div
                key={product.id}
                {...fadeUp}
                transition={{ duration: 0.45, delay: i * 0.07 }}
              >
                <MobileProductCard product={product} formatPrice={formatPrice} />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════
          6. MIDDLE BANNER
      ═══════════════════════════════════════ */}
      {banners[1] ? (
        <section className="px-4 py-4">
          <Link href={banners[1].link_url || '/products'} className="block">
            <div className="relative w-full rounded-[2rem] overflow-hidden" style={{ aspectRatio: '21/9' }}>
              <Image
                src={banners[1].image_url}
                alt={banners[1].title_ar}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0" style={{ background: 'rgba(30,18,8,0.35)' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className="text-lg font-bold text-white"
                  style={{ fontFamily: 'var(--font-cormorant), serif' }}
                >
                  {banners[1].title_ar}
                </span>
              </div>
            </div>
          </Link>
        </section>
      ) : (
        /* Decorative fallback banner */
        <section className="px-4 py-4">
          <div
            className="relative w-full rounded-[2rem] overflow-hidden flex items-center justify-between px-8"
            style={{ aspectRatio: '21/9', background: 'linear-gradient(135deg, var(--text-dark) 0%, #5c3d28 100%)' }}
          >
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--primary-light)] mb-1">عرض محدود</p>
              <p
                className="text-xl font-bold text-white leading-tight"
                style={{ fontFamily: 'var(--font-cormorant), serif' }}
              >
                خصم ٢٠٪<br />على السيروم
              </p>
            </div>
            <Link
              href="/products"
              className="px-4 py-2 rounded-full text-xs font-bold text-white flex-shrink-0"
              style={{ background: 'var(--primary)' }}
            >
              تسوقي
            </Link>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════
          7. MORE PRODUCTS (rows 4-8)
      ═══════════════════════════════════════ */}
      {featuredProducts.length > 6 && (
        <section className="py-4">
          <div className="px-6 mb-5">
            <h2
              className="text-xl font-bold text-right"
              style={{ color: 'var(--text-dark)', fontFamily: 'var(--font-cormorant), serif' }}
            >
              مزيد من المنتجات
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 px-6">
            {featuredProducts.slice(6, 8).map((product, i) => (
              <motion.div
                key={product.id}
                {...fadeUp}
                transition={{ duration: 0.45, delay: i * 0.07 }}
              >
                <MobileProductCard product={product} formatPrice={formatPrice} />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════
          8. TESTIMONIALS
      ═══════════════════════════════════════ */}
      <section className="py-8 mt-4" style={{ background: 'var(--text-dark)' }}>
        <div className="px-6 mb-6 text-right">
          <span className="text-xs font-bold uppercase tracking-widest text-[var(--primary-light)] block mb-2">
            آراء عملائنا
          </span>
          <h2
            className="text-2xl font-bold text-white"
            style={{ fontFamily: 'var(--font-cormorant), serif' }}
          >
            ما يقولون عنا
          </h2>
        </div>

        {/* Horizontal scroll on mobile */}
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-6 pb-4 scrollbar-none"
          style={{ scrollbarWidth: 'none' }}>
          {REVIEWS.map((review, i) => (
            <motion.div
              key={review.name}
              {...fadeUp}
              transition={{ duration: 0.45, delay: i * 0.1 }}
              className="flex-shrink-0 w-[78vw] snap-start rounded-[2rem] p-5"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.10)',
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
                style={{ borderTop: '1px solid rgba(255,255,255,0.10)' }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                  style={{ background: 'var(--primary)' }}
                >
                  {review.name[0]}
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-white">{review.name}</p>
                  <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>{review.city}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

    </div>
  )
}
