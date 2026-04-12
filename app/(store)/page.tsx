import { createServerSupabaseClient } from '@/lib/supabase-server'
import EnhancedHomeContent from '@/components/store/EnhancedHomeContent'
import { Product, FlashSale, Category } from '@/types'

export const revalidate = 60 // revalidate every 60 seconds

export default async function HomePage() {
  let featuredProducts: Product[] = []
  let activeFlashSale: FlashSale | null = null
  let categories: Category[] = []

  try {
    const supabase = await createServerSupabaseClient()
    const now = new Date().toISOString()

    const [productsRes, flashRes, categoriesRes] = await Promise.all([
      supabase
        .from('products')
        .select('*')
        .eq('is_featured', true)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(8),
      supabase
        .from('flash_sales')
        .select('*')
        .eq('is_active', true)
        .lte('starts_at', now)
        .gte('ends_at', now)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(4),
    ])

    featuredProducts = productsRes.data || []
    activeFlashSale = flashRes.data || null
    categories = categoriesRes.data || []
  } catch (e) {
    console.error('Failed to fetch home data:', e)
  }

  return (
    <EnhancedHomeContent 
      featuredProducts={featuredProducts} 
      activeFlashSale={activeFlashSale}
      categories={categories}
    />
  )
}
