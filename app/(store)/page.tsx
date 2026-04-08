import { createServerSupabaseClient } from '@/lib/supabase-server'
import HomeContent from '@/components/store/HomeContent'
import { Product, FlashSale } from '@/types'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  let featuredProducts: Product[] = []
  let activeFlashSale: FlashSale | null = null

  try {
    const supabase = await createServerSupabaseClient()
    const now = new Date().toISOString()

    const [productsRes, flashRes] = await Promise.all([
      supabase
        .from('products')
        .select('*')
        .eq('is_featured', true)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(6),
      supabase
        .from('flash_sales')
        .select('*')
        .eq('is_active', true)
        .lte('starts_at', now)
        .gte('ends_at', now)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    featuredProducts = productsRes.data || []
    activeFlashSale = flashRes.data || null
  } catch (e) {
    console.error('Failed to fetch home data:', e)
  }

  return <HomeContent featuredProducts={featuredProducts} activeFlashSale={activeFlashSale} />
}
