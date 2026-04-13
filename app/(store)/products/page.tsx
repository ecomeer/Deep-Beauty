import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Product, Category } from '@/types'
import ProductsClientShell from '@/components/store/ProductsClientShell'

export const revalidate = 120

export default async function ProductsPage() {
  let products: Product[] = []
  let categories: Category[] = []

  try {
    const supabase = await createServerSupabaseClient()
    const [prodsRes, catsRes] = await Promise.race([
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
      ]),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
    ])
    products = prodsRes.data || []
    categories = catsRes.data || []
  } catch (e) {
    console.error('Failed to fetch products:', e)
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero Header */}
      <div className="pt-32 pb-12 px-6 bg-surface-container-low">
        <div className="max-w-7xl mx-auto text-center">
          <span className="text-primary font-label text-xs uppercase tracking-widest block mb-3">✦ مجموعتنا الكاملة</span>
          <h1 className="text-4xl md:text-5xl font-headline text-on-surface mb-4">جميع المنتجات</h1>
          <p className="text-on-surface-variant font-body max-w-md mx-auto">اكتشفي عالم العناية الفاخرة بمكونات طبيعية مختارة بعناية</p>
        </div>
      </div>
      <ProductsClientShell products={products} categories={categories} />
    </div>
  )
}
