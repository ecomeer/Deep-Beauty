import type { Metadata } from 'next'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { Product } from '@/types'
import { getActiveFlashSales, bestDiscountForProduct, applyDiscount } from '@/lib/flash-sale'
import EnhancedProductCard from '@/components/store/EnhancedProductCard'
import Link from 'next/link'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'العروض والتخفيضات | Deep Beauty الكويت',
  description: 'أفضل العروض والتخفيضات على منتجات العناية بالبشرة والشعر من Deep Beauty الكويت.',
  alternates: { canonical: 'https://www.deepbeautykw.com/offers' },
}

export default async function OffersPage() {
  let saleProducts: Product[] = []

  try {
    const flashSales = await getActiveFlashSales()
    const { data } = await supabaseAdmin
      .from('products')
      .select('id,name_ar,name_en,slug,category,price,compare_price,stock_quantity,images,is_active,is_featured,created_at,updated_at')
      .eq('is_active', true)
      .not('compare_price', 'is', null)
      .gt('compare_price', 0)
      .order('created_at', { ascending: false })

    saleProducts = (data || [])
      .filter((p) => p.compare_price > p.price)
      .map((p) => ({
        ...p,
        sale_price: applyDiscount(p.price, bestDiscountForProduct(p, flashSales)),
      }))
  } catch (e) {
    console.error('Failed to fetch offers:', e)
  }

  return (
    <div className="min-h-screen bg-[var(--off-white)]">

      {/* Hero */}
      <div className="pt-32 pb-14 px-6 text-center bg-[var(--beige)]">
        <h1
          className="text-4xl md:text-5xl font-bold mb-3 font-headline text-[var(--text-dark)]"
        >
          العروض
        </h1>
        <p className="text-sm md:text-base opacity-70 max-w-md mx-auto text-[var(--text-dark)]">
          أسعار مخفضة على منتجات مختارة — لفترة محدودة
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {saleProducts.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border" style={{ borderColor: 'var(--dark-beige)' }}>
            <div className="text-6xl mb-4" aria-hidden="true">🏷️</div>
            <p className="text-xl font-bold mb-2 text-[var(--text-dark)]">لا توجد عروض حالياً</p>
            <p className="text-sm opacity-60 mb-8 text-[var(--text-dark)]">تابعينا لمعرفة أحدث العروض</p>
            <Link
              href="/products"
              className="inline-block px-8 py-3 rounded-2xl text-sm font-semibold text-white transition-opacity hover:opacity-90 bg-primary"
            >
              تصفحي جميع المنتجات
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {saleProducts.map((p, i) => (
              <EnhancedProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
