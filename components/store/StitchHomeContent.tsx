'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Product, Category } from '@/types'
import { useCountry } from '@/context/CountryContext'
import { 
  ArrowLeftIcon,
  ShoppingBagIcon,
  HeartIcon,
  StarIcon,
  TruckIcon,
  ShieldCheckIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

interface Props {
  featuredProducts: Product[]
  categories: Category[]
}

export default function StitchHomeContent({ featuredProducts, categories }: Props) {
  const { formatPrice } = useCountry()

  return (
    <div className="min-h-screen bg-surface pt-[72px]">
      {/* Announcement Bar */}
      <div className="bg-primary text-white py-2 px-6 text-center text-xs tracking-widest font-label uppercase">
        شحن مجاني للطلبات فوق ١٥ د.ك
      </div>

      {/* Hero Section - Improved Design */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-surface via-surface-container-low to-surface">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
        
        <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center z-10 relative">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8 max-w-2xl order-2 lg:order-1"
          >
            {/* Badge */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium"
            >
              <SparklesIcon className="w-4 h-4" />
              منتجات طبيعية 100%
            </motion.div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-headline leading-[1.1] text-on-surface">
              جمالكِ <br/>
              <span className="text-primary">يستحق الأفضل</span>
            </h1>
            
            <p className="text-lg md:text-xl font-body leading-relaxed text-on-surface-variant/90 max-w-lg">
              منتجات عناية بالبشرة فاخرة، مصنوعة من مكونات طبيعية مختارة بعناية لإشراقة يومية.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-lg font-medium transition-all text-white"
                style={{ background: '#6f4627' }}
              >
                <ShoppingBagIcon className="w-5 h-5" />
                تسوقي الآن
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-lg font-medium transition-all border-2 border-outline-variant text-on-surface hover:bg-surface-container"
              >
                تعرفي علينا
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex items-center gap-6 pt-4 text-sm text-on-surface-variant">
              <div className="flex items-center gap-2">
                <ShieldCheckIcon className="w-5 h-5 text-primary" />
                <span>ضمان الجودة</span>
              </div>
              <div className="flex items-center gap-2">
                <TruckIcon className="w-5 h-5 text-primary" />
                <span>شحن سريع</span>
              </div>
              <div className="flex items-center gap-2">
                <StarIcon className="w-5 h-5 text-primary" />
                <span>+5000 عميلة</span>
              </div>
            </div>
          </motion.div>

          {/* Hero Image - Improved */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative order-1 lg:order-2"
          >
            {/* Main Image Container */}
            <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl shadow-primary/10 bg-gradient-to-br from-surface-container to-surface-container-high">
              <Image 
                src="https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=800&q=80"
                alt="منتجات العناية بالبشرة الفاخرة"
                fill
                className="object-cover"
                priority
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-surface/20 via-transparent to-transparent" />
            </div>

            {/* Floating Card - Stats */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, type: 'spring' }}
              className="absolute -bottom-6 -left-6 bg-surface rounded-2xl p-5 shadow-editorial border border-outline-variant/50"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <HeartIcon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary font-headline">+5000</p>
                  <p className="text-sm text-on-surface-variant">عميلة سعيدة</p>
                </div>
              </div>
            </motion.div>

            {/* Floating Card - Rating */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, type: 'spring' }}
              className="absolute -top-4 -right-4 bg-surface rounded-2xl px-4 py-3 shadow-editorial border border-outline-variant/50"
            >
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1,2,3,4,5].map((i) => (
                    <StarIcon key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <span className="font-bold text-on-surface">4.9</span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
      </section>

      {/* Features Bar */}
      <section className="bg-surface-container py-6 border-y border-outline-variant/30">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: TruckIcon, title: 'شحن سريع', desc: 'توصيل خلال ٢٤ ساعة' },
              { icon: ShieldCheckIcon, title: 'منتجات أصلية', desc: '١٠٠٪ طبيعية' },
              { icon: SparklesIcon, title: 'جودة عالية', desc: 'مكونات مختارة' },
              { icon: StarIcon, title: 'ضمان رضا', desc: 'استبدال أو استرجاع' },
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-on-surface">{feature.title}</h4>
                  <p className="text-xs text-on-surface-variant">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section - Fixed Names */}
      <section className="py-24 bg-surface">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-primary font-label text-xs uppercase tracking-widest block mb-2">تسوق حسب الفئة</span>
            <h2 className="text-4xl font-headline text-on-surface">استكشف مجموعاتنا</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { id: 'face', name_ar: 'العناية بالوجه', name_en: 'Face Care', image: 'https://images.unsplash.com/photo-1570194065650-d99fb4b38b15?w=600&q=80', count: 12 },
              { id: 'body', name_ar: 'العناية بالجسم', name_en: 'Body Care', image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&q=80', count: 8 },
              { id: 'hair', name_ar: 'العناية بالشعر', name_en: 'Hair Care', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80', count: 6 },
              { id: 'perfume', name_ar: 'العطور', name_en: 'Perfumes', image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&q=80', count: 4 },
            ].map((category, i) => (
              <motion.div 
                key={category.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link 
                  href={`/products?category=${encodeURIComponent(category.name_ar)}`}
                  className="group cursor-pointer relative overflow-hidden rounded-2xl aspect-[3/4] block shadow-editorial"
                >
                  <div className="img-zoom w-full h-full">
                    <Image 
                      src={category.image}
                      alt={category.name_ar}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-on-surface/80 via-on-surface/20 to-transparent" />
                  <div className="absolute bottom-6 right-6 left-6 text-surface">
                    <p className="text-xs font-label uppercase tracking-wider opacity-70 mb-1">{category.name_en}</p>
                    <h3 className="text-xl font-headline">{category.name_ar}</h3>
                    <p className="font-body text-sm mt-1 opacity-80">
                      {category.count} منتج
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-surface-container-low">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-end mb-12">
            <div>
              <span className="text-primary font-label text-xs uppercase tracking-widest block mb-2">الأكثر مبيعاً</span>
              <h2 className="text-4xl font-headline text-on-surface">منتجاتنا المختارة</h2>
            </div>
            <Link 
              href="/products"
              className="text-sm font-medium text-primary hover:text-primary-container transition-colors flex items-center gap-1"
            >
              عرض الكل
              <ArrowLeftIcon className="w-4 h-4" />
            </Link>
          </div>
          {featuredProducts.length === 0 ? (
            <div className="text-center py-16 text-on-surface-variant">
              <ShoppingBagIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>قريباً — المنتجات تُضاف قريباً</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.slice(0, 4).map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <StitchProductCard product={product} formatPrice={formatPrice} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Promo Banner */}
      <section className="py-20 bg-surface">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #6f4627 0%, #9C6644 100%)' }}
          >
            <div className="relative p-10 md:p-16 text-center" style={{ color: 'white' }}>
              <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-6" style={{ background: 'rgba(255,255,255,0.2)' }}>
                عرض محدود
              </span>
              <h2 className="text-4xl md:text-5xl font-headline mb-4" style={{ color: 'white' }}>خصم ٢٥٪ على أول طلب</h2>
              <p className="text-lg mb-8 max-w-lg mx-auto" style={{ color: 'rgba(255,255,255,0.85)' }}>
                استخدمي كود <span className="font-bold px-3 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.2)' }}>WELCOME25</span> واستمتعي بتجربة تسوق فاخرة
              </p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold transition-colors"
                style={{ background: 'white', color: '#6f4627' }}
              >
                <ShoppingBagIcon className="w-5 h-5" />
                تسوقي الآن
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-surface-container">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-primary font-label text-xs uppercase tracking-widest block mb-2">آراء عملائنا</span>
            <h2 className="text-4xl font-headline text-on-surface">ما يقولون عنا</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'سارة', text: 'أفضل منتجات استخدمتها لبشرتي، نتائج مذهلة من أول أسبوع! ✨', rating: 5 },
              { name: 'نورة', text: 'جودة عالية وتغليف فاخر، أنصح كل صديقة بتجربة ديب بيوتي 💎', rating: 5 },
              { name: 'فاطمة', text: 'خدمة عملاء ممتازة وتوصيل سريع، سأكون عميلة دائمة 🌟', rating: 5 },
            ].map((review, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-surface rounded-2xl p-6 shadow-editorial border border-outline-variant/30"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: review.rating }).map((_, j) => (
                    <span key={j} className="text-amber-400">★</span>
                  ))}
                </div>
                <p className="text-on-surface mb-4 leading-relaxed">{review.text}</p>
                <p className="font-bold text-primary">— {review.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}

function StitchProductCard({ product, formatPrice }: { product: Product; formatPrice: (price: number) => string }) {
  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="bg-surface rounded-2xl overflow-hidden shadow-editorial hover:shadow-lg transition-shadow">
        <div className="aspect-square relative overflow-hidden">
          {product.images?.[0] ? (
            <Image 
              src={product.images[0]}
              alt={product.name_ar}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-surface-container flex items-center justify-center">
              <span className="text-4xl">🧴</span>
            </div>
          )}
          {product.stock_quantity < 10 && product.stock_quantity > 0 && (
            <span className="absolute top-3 left-3 bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">
              مخزون قليل
            </span>
          )}
          <button 
            onClick={(e) => {
              e.preventDefault()
              // Add to wishlist logic
            }}
            className="absolute top-3 right-3 w-10 h-10 rounded-full bg-surface/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-surface"
          >
            <HeartIcon className="w-5 h-5 text-on-surface-variant" />
          </button>
        </div>
        <div className="p-4">
          <h3 className="font-bold text-on-surface mb-1 truncate">{product.name_ar}</h3>
          <p className="text-sm text-on-surface-variant mb-3 line-clamp-2">{product.description_ar}</p>
          <div className="flex items-center justify-between">
            <span className="font-bold text-primary text-lg">{formatPrice(product.price)}</span>
            {product.stock_quantity === 0 ? (
              <span className="text-xs text-red-500">نفذ المخزون</span>
            ) : (
              <span className="text-xs text-green-600">متوفر</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
