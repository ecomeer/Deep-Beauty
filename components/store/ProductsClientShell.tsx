'use client'

import { useState, useMemo } from 'react'
import { Product, Category } from '@/types'
import ProductCard from './ProductCard'
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline'

const PRIMARY = '#9C6644'

export default function ProductsClientShell({
  products,
  categories,
  defaultCategory = '',
}: {
  products: Product[]
  categories: Category[]
  defaultCategory?: string
}) {
  const [selectedCategory, setSelectedCategory] = useState(defaultCategory)
  const [sortBy, setSortBy] = useState('newest')
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showCategories, setShowCategories] = useState(false)

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 min-h-screen" style={{ background: 'var(--off-white)' }}>
      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-6">
        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          title="ترتيب حسب"
          className="px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors bg-white"
          style={{
            borderColor: 'var(--beige)',
            color: 'var(--text-dark)',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = PRIMARY)}
          onBlur={e => (e.currentTarget.style.borderColor = 'var(--beige)')}
        >
          <option value="newest">الأحدث</option>
          <option value="price_asc">السعر: من الأقل</option>
          <option value="price_desc">السعر: من الأعلى</option>
        </select>

        {/* Category filter toggle */}
        <button
          onClick={() => setShowCategories(s => !s)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-colors"
          style={{
            borderColor: (showCategories || selectedCategory) ? PRIMARY : 'var(--beige)',
            background: (showCategories || selectedCategory) ? PRIMARY : 'white',
            color: (showCategories || selectedCategory) ? 'white' : 'var(--text-dark)',
          }}
        >
          <AdjustmentsHorizontalIcon className="w-4 h-4" />
          {selectedCategory || 'تصفية'}
        </button>

        {/* Search toggle */}
        <button
          onClick={() => setShowSearch(s => !s)}
          className="w-10 h-10 flex items-center justify-center rounded-xl border transition-colors"
          style={{
            borderColor: showSearch ? PRIMARY : 'var(--beige)',
            background: showSearch ? PRIMARY : 'white',
            color: showSearch ? 'white' : 'var(--text-dark)',
          }}
          aria-label="بحث"
        >
          <MagnifyingGlassIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Search input (revealed on toggle) */}
      {showSearch && (
        <div className="mb-6">
          <input
            type="text"
            placeholder="ابحثي عن منتج..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            className="w-full px-4 py-3 rounded-xl border outline-none text-sm transition-colors"
            style={{ borderColor: 'var(--beige)', background: 'white', color: 'var(--text-dark)' }}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--beige)')}
          />
        </div>
      )}

      {/* Category pills */}
      {showCategories && categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedCategory('')}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
            style={{
              background: !selectedCategory ? PRIMARY : 'white',
              color: !selectedCategory ? 'white' : 'var(--text-dark)',
              border: '1.5px solid',
              borderColor: !selectedCategory ? PRIMARY : 'var(--beige)',
            }}
          >
            الكل
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(selectedCategory === c.name_ar ? '' : c.name_ar)}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
              style={{
                background: selectedCategory === c.name_ar ? PRIMARY : 'white',
                color: selectedCategory === c.name_ar ? 'white' : 'var(--text-dark)',
                border: '1.5px solid',
                borderColor: selectedCategory === c.name_ar ? PRIMARY : 'var(--beige)',
              }}
            >
              {c.name_ar}
            </button>
          ))}
        </div>
      )}

      {/* Count */}
      <p className="text-sm mb-6" style={{ color: '#9a7a6a' }}>
        عرض {filtered.length} منتج
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl shadow-sm">
          <div className="text-6xl mb-4" aria-hidden="true">🔍</div>
          <p className="text-xl font-bold mb-2 text-gray-800">لا توجد منتجات</p>
          <p className="text-sm text-gray-500">جربي فئة أو بحث مختلف</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  )
}
