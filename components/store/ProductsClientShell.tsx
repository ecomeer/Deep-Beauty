'use client'

import { useState, useMemo } from 'react'
import { Product, Category } from '@/types'
import ProductCard from './ProductCard'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

export default function ProductsClientShell({
  products,
  categories,
}: {
  products: Product[]
  categories: Category[]
}) {
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return products
      .filter((p) => !selectedCategory || p.category === selectedCategory)
      .filter(
        (p) =>
          !search ||
          p.name_ar.includes(search) ||
          p.name_en.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.price - b.price
        if (sortBy === 'price_desc') return b.price - a.price
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
  }, [products, selectedCategory, sortBy, search])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8 p-4 rounded-2xl bg-surface shadow-editorial">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
          <input
            type="text"
            placeholder="ابحثي عن منتج..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 pr-12 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:border-primary transition-colors"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface outline-none focus:border-primary transition-colors sm:w-48"
          title="اختر فئة"
        >
          <option value="">كل الفئات</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name_ar}>{c.name_ar}</option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface outline-none focus:border-primary transition-colors sm:w-52"
          title="ترتيب حسب"
        >
          <option value="newest">الأحدث</option>
          <option value="price_asc">السعر: من الأقل</option>
          <option value="price_desc">السعر: من الأعلى</option>
        </select>
      </div>

      <p className="text-sm mb-6 text-on-surface-variant">
        {filtered.length} منتج
      </p>

      {filtered.length === 0 ? (
        <div className="text-center py-24 bg-surface-container-low rounded-2xl">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-xl font-headline mb-2 text-on-surface">لا توجد منتجات</p>
          <p className="text-sm text-on-surface-variant">جربي فئة أو بحث مختلف</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  )
}
