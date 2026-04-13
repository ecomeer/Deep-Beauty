import { createServerSupabaseClient } from '@/lib/supabase-server'
import StitchHomeContent from '@/components/store/StitchHomeContent'
import { Product, Category } from '@/types'

export const revalidate = 60 // revalidate every 60 seconds

// Timeout wrapper to prevent infinite loading
function withTimeout<T>(promise: Promise<T>, ms = 5000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout')), ms)
    ),
  ])
}

export default async function HomePage() {
  let featuredProducts: Product[] = []
  let categories: Category[] = []

  try {
    const supabase = await createServerSupabaseClient()

    const [productsRes, categoriesRes] = await withTimeout(
      Promise.all([
        supabase
          .from('products')
          .select('*')
          .eq('is_featured', true)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(8),
        supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(4),
      ]),
      5000
    )

    featuredProducts = productsRes.data || []
    categories = categoriesRes.data || []
  } catch (e) {
    console.error('Failed to fetch home data:', e)
  }

  return (
    <StitchHomeContent
      featuredProducts={featuredProducts}
      categories={categories}
    />
  )
}
