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
    <div className="min-h-screen bg-surface">
      {/* Announcement Bar */}
      <div className="bg-primary text-white py-2 px-6 text-center text-xs tracking-widest font-label uppercase">
        شحن مجاني للطلبات فوق ١٥ د.ك
      </div>

      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8 max-w-2xl"
          >
            <h1 className="text-5xl md:text-7xl font-headline leading-tight text-on-surface">
              علم الجمال <br/>
              <span className="italic font-normal text-primary">النباتي</span>
            </h1>
            <p className="text-lg md:text-xl font-body leading-relaxed text-on-surface-variant/80 font-light">
              حيث تلتقي حكمة الأجداد القديمة بالعلوم الجزيئية الحديثة. نبتكر حلولاً للعناية بالبشرة تحترم توازن الطبيعة وتقدم نتائج ملموسة.
            </p>
            <div className="flex gap-4">
              <Link 
                href="/products"
                className="bg-gradient-to-r from-primary to-primary-container text-white px-10 py-5 rounded-xl text-lg font-label transition-transform hover:scale-[1.02] active:scale-95 shadow-editorial inline-flex items-center gap-3"
              >
                <ShoppingBagIcon className="w-5 h-5" />
                اكتشف المجموعة
              </Link>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-editorial bg-surface-container">
              <Image 
                src="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80"
                alt="منتجات العناية بالبشرة"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div className="absolute -bottom-8 -left-8 hidden lg:block w-48 h-64 rounded-xl overflow-hidden border-8 border-surface shadow-editorial">
              <Image 
                src="https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&q=80"
                alt="مكونات طبيعية"
                fill
                className="object-cover"
              />
            </div>
          </motion.div>
        </div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-surface-container-low -z-0 opacity-50" />
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

      {/* Categories Section */}
      <section className="py-24 bg-surface">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-primary font-label text-xs uppercase tracking-widest block mb-2">تسوق حسب الفئة</span>
            <h2 className="text-4xl font-headline text-on-surface">استكشف مجموعاتنا</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categories.slice(0, 3).map((category, i) => (
              <motion.div 
                key={category.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link 
                  href={`/products?category=${encodeURIComponent(category.name_ar)}`}
                  className="group cursor-pointer relative overflow-hidden rounded-2xl aspect-[3/4] block"
                >
                  <div className="img-zoom w-full h-full">
                    {category.image_url ? (
                      <Image 
                        src={category.image_url}
                        alt={category.name_ar}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-surface-container flex items-center justify-center">
                        <span className="text-4xl">🧴</span>
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-on-surface/70 to-transparent" />
                  <div className="absolute bottom-8 right-8 text-surface">
                    <h3 className="text-2xl font-headline">{category.name_ar}</h3>
                    <p className="font-label text-sm uppercase tracking-wider mt-1 opacity-80">
                      {category.product_count || 0} منتج
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
        </div>
      </section>
    </div>
  )
}

function StitchProductCard({ product, formatPrice }: { product: Product; formatPrice: (price: number) => string }) {
  return (
    <Link href={`/products/${product.id}`} className="group block">
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
