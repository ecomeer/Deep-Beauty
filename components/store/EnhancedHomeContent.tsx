'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Product, FlashSale, Category } from '@/types'
import { toArabicPrice } from '@/lib/utils'
import { 
  HeartIcon,
  ArrowRightIcon,
  TruckIcon,
  ShieldCheckIcon,
  StarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { useState, useEffect, useRef, useCallback } from 'react'
import EnhancedProductCard from './EnhancedProductCard'

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }
  }
}

function useCountdown(endsAt: string) {
  const calc = () => {
    const diff = Math.max(0, new Date(endsAt).getTime() - Date.now())
    return { 
      h: Math.floor(diff / 3600000), 
      m: Math.floor((diff % 3600000) / 60000), 
      s: Math.floor((diff % 60000) / 1000), 
      done: diff === 0 
    }
  }
  const [time, setTime] = useState(calc)
  useEffect(() => { 
    const id = setInterval(() => setTime(calc()), 1000)
    return () => clearInterval(id) 
  }, [endsAt])
  return time
}

// Enhanced Flash Sale Banner
function FlashSaleBanner({ sale }: { sale: FlashSale }) {
  const { h, m, s, done } = useCountdown(sale.ends_at)
  if (done) return null
  const pad = (n: number) => String(n).padStart(2, '0')
  
  return (
    <motion.div 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white py-3 px-4"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 animate-pulse" />
          <span className="font-bold">{sale.name_ar}</span>
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">
            خصم {sale.discount_percentage}%
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span>ينتهي خلال:</span>
          <div className="flex gap-1">
            {[pad(h), pad(m), pad(s)].map((t, i) => (
              <span key={i} className="bg-black/20 px-2 py-1 rounded font-mono font-bold">
                {t}
              </span>
            ))}
          </div>
        </div>
        <Link 
          href="/products" 
          className="bg-white text-orange-600 px-4 py-1.5 rounded-full text-sm font-bold hover:bg-orange-50 transition-colors"
        >
          تسوق الآن
        </Link>
      </div>
    </motion.div>
  )
}

// Trust Badges Section
function TrustBadges() {
  const badges = [
    { icon: ShieldCheckIcon, title: 'جودة مضمونة', desc: 'منتجات مختبرة' },
    { icon: TruckIcon, title: 'شحن سريع', desc: 'توصيل خلال ٢٤-٤٨ ساعة' },
    { icon: HeartIcon, title: 'منتجات طبيعية', desc: '١٠٠٪ خامات عضوية' },
    { icon: StarIcon, title: 'ضمان الرضا', desc: 'استرجاع خلال ١٤ يوم' },
  ]
  
  return (
    <motion.section 
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      className="bg-white py-8 border-b"
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {badges.map((badge, i) => (
            <motion.div 
              key={i}
              variants={fadeInUp}
              className="flex items-center gap-3 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-[#F5EBE0] flex items-center justify-center group-hover:bg-[#E3D5CA] transition-colors">
                <badge.icon className="w-6 h-6 text-[#9C6644]" />
              </div>
              <div>
                <p className="font-bold text-sm">{badge.title}</p>
                <p className="text-xs text-gray-500">{badge.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  )
}

// Hero Banner with Slider
interface HeroSlide {
  image: string
  href: string
  alt: string
}

const defaultSlides: HeroSlide[] = [
  { image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=1920&auto=format&fit=crop', href: '/products', alt: 'Slide 1' },
  { image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?q=80&w=1920&auto=format&fit=crop', href: '/products', alt: 'Slide 2' },
  { image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=1920&auto=format&fit=crop', href: '/products', alt: 'Slide 3' },
]

function HeroSection({ slides = defaultSlides, autoPlayInterval = 5000 }: { slides?: HeroSlide[], autoPlayInterval?: number }) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [progress, setProgress] = useState(0)
  const progressRef = useRef<NodeJS.Timeout | null>(null)
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null)

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index)
    setProgress(0)
  }, [])

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
    setProgress(0)
  }, [slides.length])

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
    setProgress(0)
  }, [slides.length])

  useEffect(() => {
    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100
        return prev + (100 / (autoPlayInterval / 100))
      })
    }, 100)

    progressRef.current = progressInterval

    // Auto-play
    const autoPlayTimer = setInterval(() => {
      nextSlide()
    }, autoPlayInterval)

    autoPlayRef.current = autoPlayTimer

    return () => {
      clearInterval(progressInterval)
      clearInterval(autoPlayTimer)
    }
  }, [autoPlayInterval, nextSlide])

  return (
    <section className="w-full pt-4 pb-8 md:pt-8 md:pb-12">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="relative group h-[250px] sm:h-[350px] md:h-[450px] lg:h-[550px] rounded-2xl md:rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-500">
          {/* Slides */}
          {slides.map((slide, index) => (
            <Link
              key={index}
              href={slide.href}
              className={`absolute inset-0 transition-all duration-700 ${
                index === currentSlide ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 z-0'
              }`}
            >
              <Image
                src={slide.image}
                alt={slide.alt}
                fill
                priority={index === 0}
                className="object-cover transition-transform duration-[10000ms] scale-105"
                sizes="100vw"
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10 mix-blend-multiply" />
            </Link>
          ))}

          {/* Navigation Arrows - RTL Layout */}
          <button
            onClick={(e) => { e.preventDefault(); nextSlide() }}
            className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-12 md:h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/30 hover:scale-110 active:scale-95 transition-all duration-300 opacity-0 group-hover:opacity-100 rotate-180"
            aria-label="Next slide"
          >
            <ChevronLeftIcon className="w-5 h-5 md:w-6 md:h-6 mx-auto" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); prevSlide() }}
            className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-12 md:h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/30 hover:scale-110 active:scale-95 transition-all duration-300 opacity-0 group-hover:opacity-100 rotate-180"
            aria-label="Previous slide"
          >
            <ChevronRightIcon className="w-5 h-5 md:w-6 md:h-6 mx-auto" />
          </button>

          {/* Slide Indicators (Dots) */}
          <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-20">
            <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-3 py-2 rounded-full border border-white/10">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => { e.preventDefault(); goToSlide(index) }}
                  className={`transition-all duration-300 ${
                    index === currentSlide
                      ? 'w-6 h-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]'
                      : 'w-1.5 h-1.5 rounded-full bg-white/50 hover:bg-white/70'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-20">
            <div
              className="h-full bg-white transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

// Featured Categories
function CategoriesSection({ categories }: { categories: Category[] }) {
  return (
    <motion.section
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      className="py-16 bg-[#FAFAFA]"
    >
      <div className="max-w-7xl mx-auto px-4">
        <motion.div variants={fadeInUp} className="text-center mb-12">
          <span className="text-[#9C6644] text-sm font-medium">تصفحي حسب الفئة</span>
          <h2 className="text-3xl font-bold mt-2" style={{ fontFamily: 'var(--font-cormorant), serif' }}>
            تصفح حسب الفئة / استكشف مجموعتنا
          </h2>
        </motion.div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((cat, i) => (
            <motion.div key={cat.id} variants={scaleIn}>
              <Link 
                href={`/products?category=${cat.slug}`}
                className="group block relative aspect-square rounded-2xl overflow-hidden"
              >
                <Image
                  src={cat.image_url || `https://images.unsplash.com/photo-${['1556228578-0d85b1a4d571', '1596462502278-27bfdc403348', '1522335789203-aabd1fc54bc9', '1608248543803-ba4f8c70ae0b'][i]}?q=80&w=400&auto=format&fit=crop`}
                  alt={cat.name_ar}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="font-bold text-lg">{cat.name_ar}</h3>
                  <p className="text-sm text-white/70 group-hover:text-white transition-colors">
                    استكشفي المجموعة →
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  )
}


// Features Section
function FeaturesSection() {
  const features = [
    { 
      icon: '🌿', 
      title: 'طبيعي ١٠٠٪', 
      desc: 'مكونات نقية خالية من الكيماويات الضارة والبارابين',
      color: 'from-green-500/20 to-emerald-500/20'
    },
    { 
      icon: '🔬', 
      title: 'مُختبر سريرياً', 
      desc: 'آمن لجميع أنواع البشرة ومثبت علمياً',
      color: 'from-blue-500/20 to-cyan-500/20'
    },
    { 
      icon: '🇰🇼', 
      title: 'صُنع في الكويت', 
      desc: 'بأيدٍ كويتية محلية بعناية واحترافية',
      color: 'from-red-500/20 to-pink-500/20'
    },
    { 
      icon: '♻️', 
      title: 'صديق للبيئة', 
      desc: 'تغليف مستدام ومسؤول بيئياً',
      color: 'from-amber-500/20 to-yellow-500/20'
    },
  ]

  return (
    <section className="py-20 bg-[#F5EBE0]/30">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-[#9C6644] text-sm font-medium">لماذا نحن مختلفون</span>
          <h2 className="text-3xl sm:text-4xl font-bold mt-2" style={{ fontFamily: 'var(--font-cormorant), serif' }}>
            وعدنا لبشرتك
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -8 }}
              className="group"
            >
              <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 h-full">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform`}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}


// Newsletter Section
function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      if (res.ok) setSubscribed(true)
    } catch (error) {
      console.error('Newsletter error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="py-20 bg-[#9C6644]">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="text-white/70 text-sm">ابقي على تواصل</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2 mb-4" style={{ fontFamily: 'var(--font-cormorant), serif' }}>
            اشتركي في نشرتنا البريدية
          </h2>
          <p className="text-white/70 mb-8 max-w-lg mx-auto">
            احصلي على عروض حصرية ومنتجات جديدة ونصائح العناية بالبشرة مباشرة في بريدك الإلكتروني
          </p>
          
          {subscribed ? (
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 inline-flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                <SparklesIcon className="w-5 h-5 text-white" />
              </div>
              <p className="text-white font-bold">شكراً! ستصلك عروضنا قريباً 💫</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="بريدك الإلكتروني"
                required
                dir="ltr"
                className="flex-1 px-5 py-4 rounded-full bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-4 bg-white text-[#9C6644] rounded-full font-bold hover:bg-white/90 transition-colors disabled:opacity-50"
              >
                {loading ? '...' : 'اشتركي'}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  )
}

// New Section: Explore Our Products (4 featured products)
function ExploreProductsSection({ products }: { products: Product[] }) {
  const displayProducts = products.slice(0, 4)
  
  return (
    <motion.section
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      className="py-16 bg-white"
    >
      <div className="max-w-7xl mx-auto px-4">
        <motion.div variants={fadeInUp} className="text-center mb-10">
          <span className="text-[#9C6644] text-sm font-medium">تعرفي على منتجاتنا</span>
          <h2 className="text-3xl sm:text-4xl font-bold mt-2" style={{ fontFamily: 'var(--font-cormorant), serif' }}>
            استكشفي منتجاتنا
          </h2>
        </motion.div>
        
        <motion.div 
          variants={staggerContainer}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6"
        >
          {displayProducts.map((product, i) => (
            <EnhancedProductCard key={product.id} product={product} index={i} />
          ))}
        </motion.div>
        
        <motion.div variants={fadeInUp} className="text-center mt-8">
          <Link 
            href="/products" 
            className="inline-flex items-center gap-2 text-[#9C6644] font-medium hover:underline"
          >
            عرض كل المنتجات
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </motion.section>
  )
}

// New Section: Featured Products Section
function FeaturedProductsSection({ products }: { products: Product[] }) {
  const displayProducts = products.slice(0, 4)
  
  return (
    <motion.section
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      className="py-16 bg-[#FAFAFA]"
    >
      <div className="max-w-7xl mx-auto px-4">
        <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <span className="text-[#9C6644] text-sm font-medium">مختارة بعناية</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-2" style={{ fontFamily: 'var(--font-cormorant), serif' }}>
              منتجات مميزة
            </h2>
          </div>
          <Link 
            href="/products?featured=true" 
            className="text-[#9C6644] font-medium hover:underline flex items-center gap-1"
          >
            عرض الكل
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </motion.div>
        
        <motion.div 
          variants={staggerContainer}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6"
        >
          {displayProducts.map((product, i) => (
            <EnhancedProductCard key={product.id} product={product} index={i} />
          ))}
        </motion.div>
      </div>
    </motion.section>
  )
}

// New Section: Bestsellers Section (Curated for you)
function BestsellersSectionV2({ products }: { products: Product[] }) {
  const bestsellers = products.slice(0, 4)
  
  return (
    <motion.section
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      className="py-16 bg-white"
    >
      <div className="max-w-7xl mx-auto px-4">
        <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <span className="text-[#9C6644] text-sm font-medium">الأكثر مبيعاً</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-2" style={{ fontFamily: 'var(--font-cormorant), serif' }}>
              منتجات مختارة خصيصاً لك
            </h2>
          </div>
          <Link 
            href="/products?sort=bestsellers" 
            className="text-[#9C6644] font-medium hover:underline flex items-center gap-1"
          >
            عرض الكل
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </motion.div>
        
        <motion.div 
          variants={staggerContainer}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6"
        >
          {bestsellers.map((product, i) => (
            <EnhancedProductCard key={product.id} product={product} index={i} />
          ))}
        </motion.div>
      </div>
    </motion.section>
  )
}

// New Section: Most Requested Products
function MostRequestedSection({ products }: { products: Product[] }) {
  const requested = products.slice(4, 8)
  
  return (
    <motion.section
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      className="py-16 bg-[#FAFAFA]"
    >
      <div className="max-w-7xl mx-auto px-4">
        <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <span className="text-[#9C6644] text-sm font-medium">الطلبات اليومية</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-2" style={{ fontFamily: 'var(--font-cormorant), serif' }}>
              المنتجات الأكثر طلباً
            </h2>
          </div>
          <Link 
            href="/products" 
            className="text-[#9C6644] font-medium hover:underline flex items-center gap-1"
          >
            عرض الكل
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </motion.div>
        
        <motion.div 
          variants={staggerContainer}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6"
        >
          {requested.map((product, i) => (
            <EnhancedProductCard key={product.id} product={product} index={i} />
          ))}
        </motion.div>
      </div>
    </motion.section>
  )
}

// Enhanced Testimonials Section with Carousel
function TestimonialsCarousel() {
  const reviews = [
    { 
      name: 'نورة الرشيد', 
      area: 'السالمية',
      image: 'N',
      rating: 5,
      text: 'بشرتي تغيرت من أول أسبوع! السيروم خفيف جداً ونتيجته مذهلة، صرت أحصل على مجاملات يومياً.' 
    },
    { 
      name: 'شيخة المطيري', 
      area: 'حولي',
      image: 'S',
      rating: 5,
      text: 'كريم الليل أفضل استثمار لبشرتي. الترطيب يدوم طوال اليوم والرائحة الطبيعية تجنن.' 
    },
    { 
      name: 'فاطمة العنزي', 
      area: 'الجهراء',
      image: 'F',
      rating: 5,
      text: 'جربت منتجات كثيرة لكن ديب بيوتي مختلفة — طبيعية وفعّالة. أنصح فيها كل البنات بدون تردد.' 
    },
    { 
      name: 'مريم العتيبي', 
      area: 'الفروانية',
      image: 'M',
      rating: 5,
      text: 'أفضل منتجات عناية بالبشرة جربتها! النتائج واضحة من أول استخدام والتوصيل سريع جداً.' 
    },
    { 
      name: 'حنان البحري', 
      area: 'المنطقة العاشرة',
      image: 'H',
      rating: 5,
      text: 'مباعة بالعلامة! جودة فاخرة وخدمة عملاء ممتازة. سأظل عميلة دائمة لديكم.' 
    },
  ]
  
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(0)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  
  const maxIndex = Math.max(0, reviews.length - 3)
  
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  }
  
  const next = () => {
    setDirection(1)
    setCurrent(prev => Math.min(prev + 1, maxIndex))
  }
  
  const prev = () => {
    setDirection(-1)
    setCurrent(prev => Math.max(prev - 1, 0))
  }
  
  const goTo = (index: number) => {
    setDirection(index > current ? 1 : -1)
    setCurrent(index)
  }
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }
  
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }
  
  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 50) next()
    if (touchStart - touchEnd < -50) prev()
  }
  
  useEffect(() => {
    const timer = setInterval(() => {
      if (current < maxIndex) {
        setDirection(1)
        setCurrent(prev => prev + 1)
      } else {
        setDirection(-1)
        setCurrent(0)
      }
    }, 5000)
    return () => clearInterval(timer)
  }, [current, maxIndex])
  
  return (
    <section className="py-20 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-[#9C6644] text-sm font-medium">آراء عملائنا</span>
          <h2 className="text-3xl sm:text-4xl font-bold mt-2" style={{ fontFamily: 'var(--font-cormorant), serif' }}>
            تقييمات العملاء
          </h2>
        </motion.div>

        <div 
          className="relative"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <button
            onClick={prev}
            disabled={current === 0}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-[#9C6644] hover:bg-[#F5EBE0] transition-all disabled:opacity-30 disabled:cursor-not-allowed -ml-4 lg:-ml-6"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          
          <button
            onClick={next}
            disabled={current >= maxIndex}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-[#9C6644] hover:bg-[#F5EBE0] transition-all disabled:opacity-30 disabled:cursor-not-allowed -mr-4 lg:-mr-6"
          >
            <ChevronRightIcon className="w-6 h-6" />
          </button>

          <div className="overflow-hidden px-4">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={current}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                {reviews.slice(current, current + 3).map((review, i) => (
                  <motion.div
                    key={current + i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-gradient-to-br from-[#F5EBE0]/50 to-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex gap-1 mb-4">
                      {[...Array(review.rating)].map((_, i) => (
                        <StarIcon key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                    <p className="text-gray-700 mb-6 leading-relaxed text-lg">"{review.text}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#9C6644] to-[#D4A574] flex items-center justify-center text-white font-bold text-lg">
                        {review.image}
                      </div>
                      <div>
                        <p className="font-bold">{review.name}</p>
                        <p className="text-sm text-gray-500">{review.area} · الكويت</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex justify-center gap-2 mt-8">
            {reviews.map((_, index) => (
              <button
                key={index}
                onClick={() => goTo(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  index === current 
                    ? 'bg-[#9C6644] w-8' 
                    : 'bg-[#D4A574]/40 hover:bg-[#D4A574]/60'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// Main Component
export default function EnhancedHomeContent({ 
  featuredProducts, 
  activeFlashSale,
  categories = []
}: {
  featuredProducts: Product[]
  activeFlashSale: FlashSale | null
  categories?: Category[]
}) {
  return (
    <div className="min-h-screen">
      {activeFlashSale && <FlashSaleBanner sale={activeFlashSale} />}
      
      {/* 1. Hero - unchanged */}
      <HeroSection />
      
      {/* 2. استكشف منتجاتنا - 4 featured products */}
      <ExploreProductsSection products={featuredProducts} />
      
      {/* 3. تصفح حسب الفئة / Categories */}
      {categories.length > 0 && <CategoriesSection categories={categories} />}
      
      {/* 4. منتجات مميزة - Featured Products */}
      <FeaturedProductsSection products={featuredProducts} />
      
      {/* 5. منتجات مختارة خصيصاً لك / Bestsellers */}
      <BestsellersSectionV2 products={featuredProducts} />
      
      {/* 6. المنتجات الأكثر طلباً - Most Requested */}
      <MostRequestedSection products={featuredProducts} />
      
      {/* Trust Badges */}
      <TrustBadges />
      
      {/* 7. تقييمات العملاء - Carousel with arrows */}
      <TestimonialsCarousel />
      
      {/* Features & Newsletter */}
      <FeaturesSection />
      <NewsletterSection />
    </div>
  )
}
