import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Product, Category } from '@/types'
import ProductsClientShell from '@/components/store/ProductsClientShell'

export const revalidate = 120

export default async function ProductsPage() {
  let products: Product[] = []
  let categories: Category[] = []

  try {
    const supabase = await createServerSupabaseClient()
    const [prodsRes, catsRes] = await Promise.all([
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
    ])
    products = prodsRes.data || []
    categories = catsRes.data || []
  } catch (e) {
    console.error('Failed to fetch products:', e)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--off-white)' }}>
      <div className="py-14 px-6 text-center" style={{ background: 'var(--beige)' }}>
        <p className="text-sm font-medium mb-2" style={{ color: 'var(--primary)' }}>✦ مجموعتنا الكاملة</p>
        <h1 className="section-title mb-3">جميع المنتجات</h1>
        <p className="section-subtitle">اكتشفي عالم العناية الفاخرة</p>
      </div>
      <ProductsClientShell products={products} categories={categories} />
    </div>
  )
}
