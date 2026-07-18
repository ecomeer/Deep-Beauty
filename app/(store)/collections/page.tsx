import type { Metadata } from 'next'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { Collection } from '@/types'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'المجموعات | Deep Beauty الكويت',
  description: 'اكتشفي مجموعاتنا المتكاملة للعناية بالبشرة والشعر — باقات مصممة بعناية لتحقيق أفضل النتائج.',
  alternates: { canonical: 'https://www.deepbeautykw.com/collections' },
}

interface CollectionWithProducts extends Collection {
  product_names: string[]
}

async function getCollections(): Promise<CollectionWithProducts[]> {
  try {
    const { data: collections, error } = await supabaseAdmin
      .from('collections')
      .select('*')
      .eq('status', 'active')
      .is('deleted_at', null)
      .order('sort_order')

    if (error) {
      console.error('Failed to fetch collections:', error)
      return []
    }
    if (!collections || collections.length === 0) return []

    const { data: links } = await supabaseAdmin
      .from('collection_products')
      .select('collection_id, sort_order, products(name_ar)')
      .in('collection_id', collections.map((c) => c.id))
      .order('sort_order')

    type LinkRow = { collection_id: string; products: { name_ar: string } | null }
    const namesByCollection = new Map<string, string[]>()
    for (const link of (links || []) as unknown as LinkRow[]) {
      if (!link.products) continue
      const arr = namesByCollection.get(link.collection_id) || []
      arr.push(link.products.name_ar)
      namesByCollection.set(link.collection_id, arr)
    }

    return collections.map((c) => ({ ...c, product_names: namesByCollection.get(c.id) || [] }))
  } catch (e) {
    console.error('Failed to fetch collections:', e)
    return []
  }
}

export default async function CollectionsPage() {
  const collections = await getCollections()

  return (
    <div className="min-h-screen bg-[var(--off-white)]">

      {/* Hero */}
      <div className="pt-32 pb-14 px-6 text-center bg-[var(--beige)]">
        <h1
          className="text-4xl md:text-5xl font-bold mb-3 font-headline text-[var(--text-dark)]"
        >
          المجموعات
        </h1>
        <p className="text-sm md:text-base opacity-70 max-w-md mx-auto text-[var(--text-dark)]">
          باقات متكاملة مصممة لتحقيق أفضل النتائج — اختاري ما يناسبك
        </p>
      </div>

      {/* Collections Grid */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        {collections.length === 0 ? (
          <p className="text-center text-sm opacity-60 text-[var(--text-dark)]">لا توجد مجموعات متاحة حاليًا.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((col) => (
              <div
                key={col.id}
                className="bg-white rounded-3xl overflow-hidden shadow-sm border flex flex-col"
                style={{ borderColor: 'var(--dark-beige)' }}
              >
                {/* Card Header */}
                <div className="px-6 pt-8 pb-6 text-center bg-[var(--beige)]">
                  {col.image_url ? (
                    <img
                      src={col.image_url}
                      alt={col.name_ar}
                      className="w-16 h-16 rounded-full object-cover mx-auto mb-3 bg-white"
                    />
                  ) : (
                    <div
                      className="text-4xl mb-3 w-16 h-16 rounded-full flex items-center justify-center mx-auto bg-white"
                      aria-hidden="true"
                    >
                      ✨
                    </div>
                  )}
                  <h2
                    className="text-xl font-bold mb-1 font-headline text-[var(--text-dark)]"
                  >
                    {col.name_ar}
                  </h2>
                  {col.description_ar && (
                    <p className="text-xs opacity-60 leading-relaxed text-[var(--text-dark)]">
                      {col.description_ar}
                    </p>
                  )}
                </div>

                {/* Products List */}
                <div className="px-6 py-5 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider opacity-50 mb-3 text-[var(--text-dark)]">
                    المنتجات المضمّنة
                  </p>
                  <ul className="space-y-2">
                    {col.product_names.map((product) => (
                      <li key={product} className="flex items-center gap-2 text-sm text-[var(--text-dark)]">
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] flex-shrink-0 bg-primary"
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
                    href={`/collections/${col.slug}`}
                    className="block text-center w-full py-3 rounded-2xl text-sm font-semibold transition-opacity hover:opacity-90"
                    style={{ background: 'var(--primary)', color: 'white' }}
                  >
                    تسوّقي المجموعة
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* All products CTA */}
        <div className="text-center mt-12">
          <p className="text-sm opacity-60 mb-4 text-[var(--text-dark)]">
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
