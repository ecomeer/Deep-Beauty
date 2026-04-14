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
  ArrowLeftIcon,
  ShoppingBagIcon,
  HeartIcon,
  StarIcon,
  TruckIcon,
  ShieldCheckIcon,
  SparklesIcon,
  CheckBadgeIcon,
  CheckIcon,
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

// ─── Stagger container ──────────────────────────────────────────────────────
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.08 } } },
  item: {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
  },
}

// ─── Fade-in viewport helper ────────────────────────────────────────────────
const fadeUp = {
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.6, ease: EASE },
}

// ─── Trust features ────────────────────────────────────────────────────────
const TRUST = [
  { Icon: TruckIcon,       title: 'شحن سريع',       desc: 'توصيل خلال ٢٤ ساعة' },
  { Icon: ShieldCheckIcon, title: 'منتجات أصلية',   desc: '١٠٠٪ طبيعية' },
  { Icon: SparklesIcon,    title: 'جودة عالية',     desc: 'مكونات مختارة' },
  { Icon: CheckBadgeIcon,  title: 'ضمان رضا',       desc: 'استبدال أو استرجاع' },
]

// ─── Testimonials ──────────────────────────────────────────────────────────
const REVIEWS = [
  { name: 'سارة العنزي',   city: 'الكويت',  text: 'أفضل منتجات استخدمتها لبشرتي، نتائج مذهلة من أول أسبوع! البشرة أصبحت مشرقة وناعمة جداً.', rating: 5 },
  { name: 'نورة الرشيد',   city: 'الرياض',  text: 'جودة عالية وتغليف فاخر. أنصح كل صديقة بتجربة ديب بيوتي. سأكون عميلة دائمة للأبد.', rating: 5 },
  { name: 'فاطمة الهاشمي', city: 'دبي',     text: 'خدمة عملاء ممتازة وتوصيل سريع جداً. المنتجات طبيعية وآمنة للبشرة الحساسة كبشرتي.', rating: 5 },
]

// ─── Product Card (Home) ────────────────────────────────────────────────────
function HomeProductCard({ product, formatPrice }: { product: Product; formatPrice: (p: number) => string }) {
  const { addItem } = useCartContext()
  const { isInWishlist, toggleItem } = useWishlistContext()
  const [adding, setAdding] = useState(false)
  const isWishlisted = isInWishlist(product.id)
  const displayPrice = product.sale_price ?? product.price

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
    toggleItem({ id: product.id, name_ar: product.name_ar, name_en: product.name_en, price: displayPrice, image: product.images?.[0] || '', slug: product.slug })
    toast.success(isWishlisted ? 'تم الإزالة من المفضلة' : 'تم الإضافة للمفضلة ❤️', { position: 'bottom-center' })
  }

  const discount = product.sale_price
    ? Math.round((1 - product.sale_price / product.price) * 100)
    : product.compare_price
    ? Math.round((1 - product.price / product.compare_price) * 100)
    : 0

  return (
    <Link href={`/products/${product.slug}`} className="group block h-full">
      <div className="h-full bg-white rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-[var(--shadow-xl)] hover:-translate-y-1.5 border border-transparent hover:border-[var(--beige)]">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-[var(--beige)] to-[var(--dark-beige)]">
          {product.images?.[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name_ar}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-600"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <SparklesIcon className="w-12 h-12 opacity-30 text-[var(--primary)]" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 right-3 flex flex-col gap-1.5">
            {discount > 0 && (
              <span className="px-2.5 py-1 bg-red-500 text-white text-xs font-bold rounded-full shadow">
                -{discount}٪
              </span>
            )}
            {product.is_featured && !discount && (
              <span className="px-2.5 py-1 bg-amber-500 text-white text-xs font-bold rounded-full shadow">
                مميز ✨
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={handleWishlist}
            aria-label={isWishlisted ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
            className={`absolute top-3 left-3 w-9 h-9 rounded-full flex items-center justify-center shadow transition-all ${
              isWishlisted ? 'bg-rose-500 text-white' : 'bg-white/90 text-gray-500 hover:bg-rose-500 hover:text-white'
            }`}
          >
            {isWishlisted ? <HeartSolid className="w-4 h-4" /> : <HeartIcon className="w-4 h-4" />}
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {product.category && (
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--primary)' }}>
              {product.category}
            </p>
          )}
          <h3
            className="font-bold text-base leading-snug mb-1 line-clamp-2"
            style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--text-dark)' }}
          >
            {product.name_ar}
          </h3>
          <p className="text-xs text-gray-400 mb-3 line-clamp-1">
            {product.description_ar || 'منتج طبيعي فاخر'}
          </p>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
            <div>
              <span className="text-lg font-bold" style={{ color: 'var(--primary)' }} dir="ltr">
                {formatPrice(displayPrice)}
              </span>
              {(product.sale_price || product.compare_price) && (
                <span className="block text-xs text-gray-400 line-through" dir="ltr">
                  {formatPrice(product.sale_price ? product.price : product.compare_price!)}
                </span>
              )}
            </div>

            <button
              onClick={handleAddToCart}
              disabled={product.stock_quantity === 0 || adding}
              aria-label={`إضافة ${product.name_ar} للسلة`}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                product.stock_quantity === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : adding
                  ? 'bg-green-500 text-white'
                  : 'text-white hover:opacity-90'
              }`}
              style={
                product.stock_quantity > 0 && !adding
                  ? { background: 'var(--primary)' }
                  : {}
              }
            >
              {adding ? <CheckIcon className="w-3.5 h-3.5" /> : <ShoppingBagIcon className="w-3.5 h-3.5" />}
              {adding ? 'تمت' : 'أضف'}
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════
export default function StitchHomeContent({ featuredProducts, categories, banners = [], announcementText }: Props) {
  const { formatPrice } = useCountry()
  const heroBanner = banners[0] || null

  return (
    <div className="min-h-screen" style={{ background: 'var(--off-white)', paddingTop: 'var(--nav-height)' }}>

      {/* ─────────────────────────────────────────
          ANNOUNCEMENT BAR
      ───────────────────────────────────────── */}
      {announcementText && (
        <div
          className="py-2 px-4 text-center text-xs tracking-wider font-medium text-white"
          style={{ background: 'var(--text-dark)' }}
        >
          <span>✦</span>
          <span className="mx-3">{announcementText}</span>
          <span>✦</span>
        </div>
      )}

      {/* ─────────────────────────────────────────
          HERO SECTION
      ───────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, var(--off-white) 0%, var(--beige) 60%, var(--dark-beige) 100%)' }} />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C6644' fill-opacity='1'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
        />

        <div className="relative z-10 max-w-[var(--container-max)] mx-auto px-5 md:px-8 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center w-full">

          {/* Text */}
          <motion.div
            variants={stagger.container}
            initial="initial"
            animate="animate"
            className="space-y-7 order-2 lg:order-1"
          >
            {/* Eyebrow */}
            <motion.div variants={stagger.item}>
              <span
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border"
                style={{
                  color: 'var(--primary)',
                  background: 'rgba(156,102,68,0.08)',
                  borderColor: 'rgba(156,102,68,0.2)',
                }}
              >
                <SparklesIcon className="w-3.5 h-3.5" />
                منتجات طبيعية ١٠٠٪ · صُنع في الكويت
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={stagger.item}
              className="leading-[1.05] font-bold"
              style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: 'clamp(3rem, 6vw, 5.5rem)',
                color: 'var(--text-dark)',
              }}
            >
              {heroBanner?.title_ar ? (
                <>
                  {heroBanner.title_ar.split(' ').slice(0, 2).join(' ')}<br />
                  <em className="not-italic" style={{ color: 'var(--primary)' }}>
                    {heroBanner.title_ar.split(' ').slice(2).join(' ') || 'يستحق الأفضل'}
                  </em>
                </>
              ) : (
                <>جمالكِ<br /><em className="not-italic" style={{ color: 'var(--primary)' }}>يستحق الأفضل</em></>
              )}
            </motion.h1>

            {/* Subtext */}
            <motion.p
              variants={stagger.item}
              className="text-base md:text-lg leading-relaxed max-w-md"
              style={{ color: 'var(--on-surface-variant)' }}
            >
              {heroBanner?.subtitle_ar || 'منتجات عناية بالبشرة فاخرة، مصنوعة من مكونات طبيعية مختارة بعناية لإشراقة يومية مستدامة.'}
            </motion.p>

            {/* CTAs */}
            <motion.div variants={stagger.item} className="flex flex-wrap gap-3">
              <Link
                href={heroBanner?.link_url || '/products'}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-bold text-white transition-all hover:opacity-90 hover:-translate-y-0.5"
                style={{ background: 'var(--primary)', boxShadow: 'var(--shadow-primary)' }}
              >
                <ShoppingBagIcon className="w-5 h-5" />
                تسوقي الآن
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-bold transition-all border-2 hover:bg-[var(--beige)]"
                style={{ borderColor: 'var(--dark-beige)', color: 'var(--text-dark)' }}
              >
                تعرفي علينا
                <ArrowLeftIcon className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={stagger.item}
              className="flex items-center gap-8 pt-2 border-t"
              style={{ borderColor: 'var(--dark-beige)' }}
            >
              {[
                { val: '+٥٠٠٠', label: 'عميلة سعيدة' },
                { val: '١٠٠٪', label: 'مكونات طبيعية' },
                { val: '٣+', label: 'سنوات خبرة' },
              ].map(({ val, label }) => (
                <div key={label}>
                  <p className="text-2xl font-bold" style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--primary)' }}>
                    {val}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: EASE }}
            className="relative order-1 lg:order-2"
          >
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-[var(--shadow-xl)]"
              style={{ background: 'linear-gradient(160deg, var(--beige), var(--dark-beige))' }}
            >
              <Image
                src={heroBanner?.image_url || 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=800&q=80'}
                alt={heroBanner?.title_ar || 'Deep Beauty منتجات عناية بالبشرة'}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 60%, rgba(58,42,30,0.15))' }} />
            </div>

            {/* Floating: Rating */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
              className="absolute -top-5 -left-5 bg-white rounded-2xl px-4 py-3 shadow-[var(--shadow-lg)] border border-[var(--beige)]"
            >
              <div className="flex items-center gap-1.5">
                <div className="flex">
                  {[1,2,3,4,5].map(i => (
                    <StarIcon key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <span className="font-bold text-sm text-[var(--text-dark)]">4.9</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5">+١٢٠ تقييم حقيقي</p>
            </motion.div>

            {/* Floating: Customers */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.0, type: 'spring', stiffness: 200 }}
              className="absolute -bottom-5 -right-5 bg-white rounded-2xl p-4 shadow-[var(--shadow-lg)] border border-[var(--beige)]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--beige)' }}>
                  <HeartIcon className="w-5 h-5 text-[var(--primary)]" />
                </div>
                <div>
                  <p className="text-xl font-bold" style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--primary)' }}>+٥٠٠٠</p>
                  <p className="text-xs text-gray-400">عميلة سعيدة</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Decorative blobs */}
        <div className="absolute top-20 right-10 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: 'var(--primary)' }} />
        <div className="absolute bottom-20 left-20 w-48 h-48 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: 'var(--primary-dark)' }} />
      </section>

      {/* ─────────────────────────────────────────
          TRUST BAR
      ───────────────────────────────────────── */}
      <section
        className="border-y"
        style={{ background: 'white', borderColor: 'var(--beige)' }}
      >
        <div className="max-w-[var(--container-max)] mx-auto px-5 md:px-8 py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-8 divide-y md:divide-y-0 md:divide-x rtl:divide-x-reverse divide-[var(--beige)]">
            {TRUST.map(({ Icon, title, desc }, i) => (
              <motion.div
                key={title}
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="flex items-center gap-3 pt-5 md:pt-0 first:pt-0 md:px-6 first:ps-0 last:pe-0"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--beige)' }}
                >
                  <Icon className="w-5 h-5 text-[var(--primary)]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--text-dark)]">{title}</p>
                  <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────
          CATEGORIES SECTION
      ───────────────────────────────────────── */}
      {categories.filter(c => c.is_active).length > 0 && (
        <section className="py-24" style={{ background: 'var(--off-white)' }}>
          <div className="max-w-[var(--container-max)] mx-auto px-5 md:px-8">
            {/* Header */}
            <motion.div {...fadeUp} className="text-center mb-12">
              <span
                className="text-xs font-bold uppercase tracking-widest block mb-3"
                style={{ color: 'var(--primary)' }}
              >
                تسوقي حسب الفئة
              </span>
              <h2
                className="text-4xl md:text-5xl font-bold"
                style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--text-dark)' }}
              >
                استكشفي مجموعاتنا
              </h2>
            </motion.div>

            {/* Grid */}
            <div className="flex flex-wrap justify-center gap-5">
              {categories.filter(c => c.is_active).slice(0, 4).map((cat, i) => (
                <motion.div
                  key={cat.id}
                  {...fadeUp}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(25%-15px)] min-w-[220px] max-w-[300px]"
                >
                  <Link
                    href={`/products?category=${encodeURIComponent(cat.slug)}`}
                    className="group relative block overflow-hidden rounded-2xl shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-all duration-500"
                    style={{ aspectRatio: '3/4' }}
                    aria-label={`تصفح فئة ${cat.name_ar}`}
                  >
                    <div className="absolute inset-0">
                      {cat.image_url ? (
                        <Image
                          src={cat.image_url}
                          alt={cat.name_ar}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div
                          className="w-full h-full"
                          style={{ background: 'linear-gradient(160deg, var(--beige), var(--dark-beige))' }}
                        />
                      )}
                    </div>
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(30,18,8,0.75) 0%, rgba(30,18,8,0.1) 60%, transparent 100%)' }} />
                    <div className="absolute bottom-0 inset-x-0 p-5">
                      {cat.name_en && (
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-white/60 mb-1">
                          {cat.name_en}
                        </p>
                      )}
                      <h3
                        className="text-xl font-bold text-white leading-tight group-hover:text-[var(--primary-light)] transition-colors"
                        style={{ fontFamily: 'Cormorant Garamond, serif' }}
                      >
                        {cat.name_ar}
                      </h3>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────
          FEATURED PRODUCTS
      ───────────────────────────────────────── */}
      <section className="py-24" style={{ background: 'white' }}>
        <div className="max-w-[var(--container-max)] mx-auto px-5 md:px-8">
          {/* Header */}
          <div className="flex items-end justify-between mb-12 gap-4">
            <motion.div {...fadeUp}>
              <span
                className="text-xs font-bold uppercase tracking-widest block mb-3"
                style={{ color: 'var(--primary)' }}
              >
                الأكثر مبيعاً
              </span>
              <h2
                className="text-4xl md:text-5xl font-bold"
                style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--text-dark)' }}
              >
                منتجاتنا المختارة
              </h2>
            </motion.div>
            <Link
              href="/products"
              className="flex-shrink-0 flex items-center gap-1.5 text-sm font-semibold transition-colors hover:opacity-70"
              style={{ color: 'var(--primary)' }}
            >
              عرض الكل
              <ArrowLeftIcon className="w-4 h-4" />
            </Link>
          </div>

          {featuredProducts.length === 0 ? (
            <div className="text-center py-20 rounded-3xl" style={{ background: 'var(--off-white)' }}>
              <ShoppingBagIcon className="w-16 h-16 mx-auto mb-4 text-[var(--primary)] opacity-20" />
              <p className="text-lg font-medium text-[var(--on-surface-variant)]">المنتجات تُضاف قريباً ✨</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {featuredProducts.slice(0, 8).map((product, i) => (
                <motion.div
                  key={product.id}
                  {...fadeUp}
                  transition={{ duration: 0.5, delay: i * 0.07 }}
                  className="h-full"
                >
                  <HomeProductCard product={product} formatPrice={formatPrice} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>


      {/* ─────────────────────────────────────────
          TESTIMONIALS
      ───────────────────────────────────────── */}
      <section className="py-24" style={{ background: 'var(--text-dark)' }}>
        <div className="max-w-[var(--container-max)] mx-auto px-5 md:px-8">
          <motion.div {...fadeUp} className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest block mb-3 text-[var(--primary-light)]">
              آراء عملائنا
            </span>
            <h2
              className="text-4xl md:text-5xl font-bold text-white"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}
            >
              ما يقولون عنا
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {REVIEWS.map((review, i) => (
              <motion.div
                key={review.name}
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-2xl p-6 transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: review.rating }).map((_, j) => (
                    <span key={j} className="text-amber-400 text-sm">★</span>
                  ))}
                </div>

                <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  "{review.text}"
                </p>

                <div className="flex items-center gap-3 pt-4"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                    style={{ background: 'var(--primary)' }}
                  >
                    {review.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-white">{review.name}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{review.city}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────
          PAYMENT METHODS STRIP
      ───────────────────────────────────────── */}
    </div>
  )
}
