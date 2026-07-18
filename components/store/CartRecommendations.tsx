'use client'

import { useEffect, useState } from 'react'
import { Product } from '@/types'
import EnhancedProductCard from './EnhancedProductCard'

interface Props {
  cartProductIds: string[]
}

export default function CartRecommendations({ cartProductIds }: Props) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [errored, setErrored] = useState(false)

  useEffect(() => {
    if (cartProductIds.length === 0) {
      setProducts([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setErrored(false)
    fetch(`/api/cart/recommendations?ids=${cartProductIds.join(',')}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('failed'))))
      .then((data) => { if (!cancelled) setProducts(data.products || []) })
      .catch(() => { if (!cancelled) setErrored(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
    // Re-fetch only when the set of product ids actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartProductIds.join(',')])

  if (loading) {
    return (
      <div className="mt-10">
        <h2 className="text-xl font-headline text-on-surface mb-4">قد يعجبك أيضًا</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-2xl bg-surface-container animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  // Silent empty state — an empty/errored recommendation rail shouldn't
  // draw attention on the cart page, it just doesn't render.
  if (errored || products.length === 0) return null

  return (
    <div className="mt-10">
      <h2 className="text-xl font-headline text-on-surface mb-4">قد يعجبك أيضًا</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
        {products.map((p, i) => (
          <EnhancedProductCard key={p.id} product={p} index={i} />
        ))}
      </div>
    </div>
  )
}
