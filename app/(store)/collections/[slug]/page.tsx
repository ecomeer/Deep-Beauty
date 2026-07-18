import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { Product, Collection } from '@/types'
import { getActiveFlashSales, bestDiscountForProduct, applyDiscount } from '@/lib/flash-sale'
import EnhancedProductCard from '@/components/store/EnhancedProductCard'

export const revalidate = 300

type Props = { params: Promise<{ slug: string }> }

async function getCollection(slug: string) {
  try {
    const { data: collection } = await supabaseAdmin
      .from('collections')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'active')
      .is('deleted_at', null)
      .maybeSingle()

    if (!collection) return null

    const [{ data: links }, flashSales] = await Promise.all([
      supabaseAdmin
        .from('collection_products')
        .select('sort_order, products(id, name_ar, name_en, slug, description_ar, description_en, price, compare_price, images, category, stock_quantity, is_active, is_featured, created_at, updated_at)')
        .eq('collection_id', collection.id)
        .order('sort_order'),
      getActiveFlashSales(),
    ])

    type LinkRow = { sort_order: number; products: Product | null }
    const products = ((links || []) as unknown as LinkRow[])
      .map((l) => l.products)
      .filter((p): p is Product => !!p && p.is_active === true)
      .map((p) => ({
        ...p,
        sale_price: applyDiscount(p.price, bestDiscountForProduct(p, flashSales)),
      }))

    return { collection: collection as Collection, products }
  } catch (e) {
    console.error('Failed to fetch collection:', e)
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const data = await getCollection(slug)
  if (!data) return { title: 'مجموعة | Deep Beauty' }

  const canonicalUrl = `https://www.deepbeautykw.com/collections/${slug}`
  return {
    title: `${data.collection.name_ar} | Deep Beauty الكويت`,
    description: data.collection.description_ar || undefined,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: data.collection.name_ar,
      description: data.collection.description_ar || undefined,
      url: canonicalUrl,
      images: data.collection.image_url ? [{ url: data.collection.image_url }] : undefined,
    },
  }
}

export default async function CollectionDetailPage({ params }: Props) {
  const { slug } = await params
  const data = await getCollection(slug)
  if (!data) notFound()

  const { collection, products } = data

  return (
    <div className="min-h-screen bg-[var(--off-white)]">
      <div className="pt-32 pb-14 px-6 text-center bg-[var(--beige)]">
        {collection.image_url && (
          <img
            src={collection.image_url}
            alt={collection.name_ar}
            className="w-20 h-20 rounded-full object-cover mx-auto mb-4 bg-white"
          />
        )}
        <h1 className="text-4xl md:text-5xl font-bold mb-3 font-headline text-[var(--text-dark)]">
          {collection.name_ar}
        </h1>
        {collection.description_ar && (
          <p className="text-sm md:text-base opacity-70 max-w-md mx-auto text-[var(--text-dark)]">
            {collection.description_ar}
          </p>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {products.length === 0 ? (
          <p className="text-center text-sm opacity-60 text-[var(--text-dark)]">لا توجد منتجات متاحة في هذه المجموعة حاليًا.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {products.map((p, i) => (
              <EnhancedProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
