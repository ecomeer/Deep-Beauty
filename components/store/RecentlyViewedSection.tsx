'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCountry } from '@/context/CountryContext'
import { RecentlyViewedItem, useRecentlyViewed } from '@/hooks/useRecentlyViewed'
import { SparklesIcon } from '@heroicons/react/24/outline'

/**
 * Horizontal rail of products the visitor viewed earlier (localStorage-based).
 * Renders nothing when there's no history, so it's safe to mount anywhere.
 */
export default function RecentlyViewedSection({ excludeIds = [] }: { excludeIds?: string[] }) {
  const { items } = useRecentlyViewed(excludeIds)
  const { formatPrice } = useCountry()
  const [currentItems, setCurrentItems] = useState<RecentlyViewedItem[]>([])
  const itemIds = useMemo(() => items.map((item) => item.id).join(','), [items])

  useEffect(() => {
    if (!itemIds) {
      setCurrentItems([])
      return
    }

    const controller = new AbortController()
    setCurrentItems([])

    fetch(`/api/products?ids=${encodeURIComponent(itemIds)}&limit=8`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('Unable to refresh recently viewed products')
        return res.json()
      })
      .then(({ products = [] }) => {
        const byId = new Map<string, RecentlyViewedItem>(
          products.map((product: RecentlyViewedItem & { images?: string[] }) => [
            product.id,
            {
              id: product.id,
              slug: product.slug,
              name_ar: product.name_ar,
              image: product.images?.[0] || product.image || '',
              price: product.price,
              sale_price: product.sale_price,
            },
          ])
        )
        setCurrentItems(
          itemIds
            .split(',')
            .map((id) => byId.get(id))
            .filter((item): item is RecentlyViewedItem => Boolean(item))
        )
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setCurrentItems([])
      })

    return () => controller.abort()
  }, [itemIds])

  if (currentItems.length === 0) return null

  return (
    <section className="mt-8 border-t border-beige pt-10 pb-4" aria-label="شاهدتِها مؤخراً">
      <div className="px-4 md:px-8 mb-5 lg:max-w-[var(--container-max)] lg:mx-auto">
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-primary block mb-0.5">
          ✦ تابعي من حيث توقفتِ
        </span>
        <h2 className="text-xl font-bold font-headline text-on-surface">شاهدتِها مؤخراً</h2>
      </div>

      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-4 md:px-8 pb-2 no-scrollbar lg:max-w-[var(--container-max)] lg:mx-auto">
        {currentItems.map((item) => (
          <Link
            key={item.id}
            href={`/products/${item.slug}`}
            className="flex-shrink-0 snap-start w-[34vw] max-w-[150px] group"
          >
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-beige border border-beige mb-2">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name_ar}
                  fill
                  sizes="(max-width: 640px) 34vw, 150px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  quality={75}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <SparklesIcon className="w-8 h-8 text-primary opacity-20" aria-hidden="true" />
                </div>
              )}
            </div>
            <p className="text-xs font-bold text-on-surface leading-snug line-clamp-2 mb-1">
              {item.name_ar}
            </p>
            <p className="text-xs font-bold text-primary" dir="ltr">
              {formatPrice(item.sale_price ?? item.price)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}
