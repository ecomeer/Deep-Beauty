import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Product, Category } from '@/types'
import ProductsClientShell from '@/components/store/ProductsClientShell'
import { getActiveFlashDiscount, applyDiscount } from '@/lib/flash-sale'

export const revalidate = 120

export const metadata: Metadata = {
  title: 'منتجات العناية بالبشرة | متجر ديب بيوتي الكويت',
  description: 'تسوقي أفضل منتجات العناية بالبشرة في الكويت — سيروم فيتامين C، كريم ترطيب، واقي شمس SPF، ومنتجات كورية أصلية. توصيل سريع لكل الكويت.',
  keywords: 'منتجات عناية بالبشرة الكويت, سيروم فيتامين C الكويت, كريم ترطيب بشرة الكويت, واقي شمس SPF الكويت, منتجات كورية بشرة الكويت, تسوق عناية بشرة أونلاين الكويت',
  alternates: { canonical: 'https://www.deepbeautykw.com/products' },
  openGraph: {
    title: 'منتجات العناية بالبشرة | Deep Beauty الكويت',
    description: 'تسوقي أفضل منتجات العناية بالبشرة في الكويت — سيروم، كريم، واقي شمس، ومنتجات كورية أصلية.',
    url: 'https://www.deepbeautykw.com/products',
    type: 'website',
    locale: 'ar_KW',
    siteName: 'Deep Beauty',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'منتجات العناية بالبشرة | Deep Beauty',
    description: 'تسوقي أفضل منتجات العناية بالبشرة في الكويت',
  },
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category: defaultCategory = '' } = await searchParams
  let products: Product[] = []
  let categories: Category[] = []

  try {
    const supabase = await createServerSupabaseClient()
    const [prodsRes, catsRes, flashDiscount] = await Promise.race([
      Promise.all([
        supabase
          .from('products')
          .select('id,name_ar,name_en,slug,category,price,compare_price,stock_quantity,images,is_active,is_featured,created_at,updated_at')
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
        supabase
          .from('categories')
          .select('id,name_ar,name_en,slug,is_active,image_url')
          .eq('is_active', true)
          .order('name_ar'),
        getActiveFlashDiscount(),
      ]),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
    ])
    products = (prodsRes.data || []).map((p) => ({
      ...p,
      sale_price: applyDiscount(p.price, flashDiscount as number),
    }))
    categories = catsRes.data || []
  } catch (e) {
    console.error('Failed to fetch products:', e)
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero Header */}
      <div className="pt-32 pb-12 px-6 bg-surface-container-low">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-headline text-on-surface mb-4">المتجر</h1>
        </div>
      </div>
      <ProductsClientShell products={products} categories={categories} defaultCategory={defaultCategory} />
    </div>
  )
}
