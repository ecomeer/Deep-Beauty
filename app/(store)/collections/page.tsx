import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'المجموعات | Deep Beauty الكويت',
  description: 'اكتشفي مجموعاتنا المتكاملة للعناية بالبشرة والشعر — مجموعة الأرز واللبان، مجموعة الورد، مجموعة الروزماري، مجموعة الفرمون، والمجموعة الرجالية.',
  alternates: { canonical: 'https://www.deepbeautykw.com/collections' },
}

const COLLECTIONS = [
  {
    id: 'rice-frankincense',
    name: 'مجموعة الأرز واللبان',
    description: 'ترطيب عميق وتفتيح طبيعي بمزيج الأرز واللبان',
    emoji: '🌾',
    products: [
      'كريم الأرز واللبان',
      'صابونية الأرز واللبان',
      'سنفرة الأرز واللبان',
    ],
  },
  {
    id: 'rose-glow',
    name: 'مجموعة التوريد بالورد',
    description: 'بشرة مشرقة ومورّدة بعبق الورد الطبيعي',
    emoji: '🌹',
    products: [
      'سنفرة التوريد بالورد',
      'شاور جل التوريد بالورد',
      'كريم النياسيناميد والبانثينول',
    ],
  },
  {
    id: 'rosemary-hair',
    name: 'مجموعة الروزماري للشعر',
    description: 'شعر صحي وكثيف بقوة الروزماري وفيتامين B5',
    emoji: '🌿',
    products: [
      'شامبو الروزماري وفيتامين B5',
      'بلسم الروزماري وفيتامين B5',
    ],
  },
  {
    id: 'pheromone',
    name: 'مجموعة الفرمون المعطرة',
    description: 'رائحة فرمونية ساحرة تدوم طوال اليوم',
    emoji: '✨',
    products: [
      'جل معطر فرموني',
      'بودرة معطرة فرمونية',
    ],
  },
  {
    id: 'men',
    name: 'المجموعة الرجالية',
    description: 'عناية رجالية متكاملة بمكونات طبيعية فعّالة',
    emoji: '💪',
    products: [
      'سكراب صابوني رجالي',
      'لوشن رجالي',
    ],
  },
]

export default function CollectionsPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--off-white)' }}>

      {/* Hero */}
      <div className="pt-32 pb-14 px-6 text-center" style={{ background: 'var(--beige)' }}>
        <h1
          className="text-4xl md:text-5xl font-bold mb-3 font-headline text-[var(--text-dark)]"
        >
          المجموعات
        </h1>
        <p className="text-sm md:text-base opacity-70 max-w-md mx-auto" style={{ color: 'var(--text-dark)' }}>
          باقات متكاملة مصممة لتحقيق أفضل النتائج — اختاري ما يناسبك
        </p>
      </div>

      {/* Collections Grid */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {COLLECTIONS.map((col) => (
            <div
              key={col.id}
              className="bg-white rounded-3xl overflow-hidden shadow-sm border flex flex-col"
              style={{ borderColor: 'var(--dark-beige)' }}
            >
              {/* Card Header */}
              <div className="px-6 pt-8 pb-6 text-center" style={{ background: 'var(--beige)' }}>
                <div
                  className="text-4xl mb-3 w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                  style={{ background: 'white' }}
                  aria-hidden="true"
                >
                  {col.emoji}
                </div>
                <h2
                  className="text-xl font-bold mb-1 font-headline text-[var(--text-dark)]"
                >
                  {col.name}
                </h2>
                <p className="text-xs opacity-60 leading-relaxed" style={{ color: 'var(--text-dark)' }}>
                  {col.description}
                </p>
              </div>

              {/* Products List */}
              <div className="px-6 py-5 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider opacity-50 mb-3" style={{ color: 'var(--text-dark)' }}>
                  المنتجات المضمّنة
                </p>
                <ul className="space-y-2">
                  {col.products.map((product) => (
                    <li key={product} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-dark)' }}>
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] flex-shrink-0"
                        style={{ background: 'var(--primary)' }}
                        aria-hidden="true"
                      >
                        ✓
                      </span>
                      {product}
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <div className="px-6 pb-6">
                <Link
                  href={`/products?search=${encodeURIComponent(col.name.replace('مجموعة ', ''))}`}
                  className="block text-center w-full py-3 rounded-2xl text-sm font-semibold transition-opacity hover:opacity-90"
                  style={{ background: 'var(--primary)', color: 'white' }}
                >
                  تسوّقي المجموعة
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* All products CTA */}
        <div className="text-center mt-12">
          <p className="text-sm opacity-60 mb-4" style={{ color: 'var(--text-dark)' }}>
            تبحثين عن منتج بعينه؟
          </p>
          <Link
            href="/products"
            className="inline-block px-8 py-3 rounded-2xl text-sm font-semibold transition-all border-2 hover:bg-[var(--primary)] hover:text-white"
            style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
          >
            تصفحي المنتجات الفردية
          </Link>
        </div>
      </div>
    </div>
  )
}
