'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Product, Category } from '@/types'
import EnhancedProductCard from './EnhancedProductCard'
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline'
import { useSearchParams } from 'next/navigation'

// ─── Sort Options ──────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: 'newest',     label: 'الأحدث' },
  { value: 'price_asc',  label: 'السعر: من الأقل' },
  { value: 'price_desc', label: 'السعر: من الأعلى' },
  { value: 'featured',   label: 'المميزة أولاً' },
]

export default function ProductsClientShell({
  products,
  categories,
  defaultCategory = '',
}: {
  products: Product[]
  categories: Category[]
  defaultCategory?: string
}) {
  const searchParams = useSearchParams()
  const urlSearch = searchParams?.get('search') || ''

  const [selectedCategory, setSelectedCategory] = useState(defaultCategory)
  const [sortBy, setSortBy] = useState('newest')
  const [search, setSearch] = useState(urlSearch)
  const [filterOpen, setFilterOpen] = useState(false)

  useEffect(() => {
    if (urlSearch) setSearch(urlSearch)
  }, [urlSearch])

  const filtered = useMemo(() => {
    return products
      .filter((p) => !selectedCategory || p.category === selectedCategory)
      .filter((p) => {
        if (!search) return true
        const q = search.toLowerCase()
        return (
          p.name_ar.includes(search) ||
          p.name_en?.toLowerCase().includes(q) ||
          p.category?.includes(search) ||
          p.description_ar?.includes(search)
        )
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.price - b.price
        if (sortBy === 'price_desc') return b.price - a.price
        if (sortBy === 'featured') return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
  }, [products, selectedCategory, sortBy, search])

  const clearFilters = () => {
    setSelectedCategory('')
    setSearch('')
    setSortBy('newest')
  }

  const hasActiveFilters = Boolean(selectedCategory || search || sortBy !== 'newest')

  return (
    <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 py-8">

      {/* ─── Filter / Sort Bar ─── */}
      <div className="flex flex-col gap-4 mb-8">

        {/* Top Row */}
        <div className="flex items-center gap-2 flex-wrap">

          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <MagnifyingGlassIcon className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--on-surface-variant)]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحثي عن منتج..."
              aria-label="البحث في المنتجات"
              className="w-full pr-10 pl-4 py-2.5 rounded-xl text-sm outline-none border transition-all bg-white"
              style={{ borderColor: 'var(--dark-beige)', color: 'var(--text-dark)' }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--dark-beige)')}
            />
            {search && (
              <button
                type="button"
                aria-label="مسح البحث"
                onClick={() => setSearch('')}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="ترتيب المنتجات"
            className="px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors bg-white flex-shrink-0"
            style={{ borderColor: 'var(--dark-beige)', color: 'var(--text-dark)' }}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--dark-beige)')}
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Category Filter Toggle */}
          {categories.length > 0 && (
            <button
              onClick={() => setFilterOpen(s => !s)}
              aria-expanded={filterOpen}
              aria-controls="category-filters"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all flex-shrink-0"
              style={{
                borderColor: (filterOpen || selectedCategory) ? 'var(--primary)' : 'var(--dark-beige)',
                background: (filterOpen || selectedCategory) ? 'var(--primary)' : 'white',
                color: (filterOpen || selectedCategory) ? 'white' : 'var(--text-dark)',
              }}
            >
              <FunnelIcon className="w-4 h-4" />
              {selectedCategory || 'الفئات'}
              {selectedCategory && (
                <span
                  onClick={(e) => { e.stopPropagation(); setSelectedCategory('') }}
                  className="w-4 h-4 rounded-full bg-white/25 flex items-center justify-center hover:bg-white/40 transition-colors"
                  role="button"
                  aria-label="مسح الفئة"
                >
                  <XMarkIcon className="w-2.5 h-2.5" />
                </span>
              )}
            </button>
          )}

          {/* Clear All */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs font-medium text-[var(--primary)] hover:underline flex-shrink-0 px-2"
            >
              مسح الكل
            </button>
          )}

          {/* Product Count */}
          <span
            className="ms-auto text-xs font-medium flex-shrink-0"
            style={{ color: 'var(--on-surface-variant)' }}
            aria-live="polite"
          >
            {filtered.length} منتج
          </span>
        </div>

        {/* Category Pills */}
        <AnimatePresence>
          {filterOpen && categories.length > 0 && (
            <motion.div
              id="category-filters"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => setSelectedCategory('')}
                  className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                  style={{
                    background: !selectedCategory ? 'var(--primary)' : 'white',
                    color: !selectedCategory ? 'white' : 'var(--text-dark)',
                    border: `1.5px solid ${!selectedCategory ? 'var(--primary)' : 'var(--dark-beige)'}`,
                  }}
                >
                  الكل ({products.length})
                </button>
                {categories.filter(c => c.is_active).map((c) => {
                  const count = products.filter(p => p.category === c.name_ar).length
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCategory(selectedCategory === c.name_ar ? '' : c.name_ar)}
                      className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                      style={{
                        background: selectedCategory === c.name_ar ? 'var(--primary)' : 'white',
                        color: selectedCategory === c.name_ar ? 'white' : 'var(--text-dark)',
                        border: `1.5px solid ${selectedCategory === c.name_ar ? 'var(--primary)' : 'var(--dark-beige)'}`,
                      }}
                    >
                      {c.name_ar}
                      <span className="ms-1.5 opacity-60 text-xs">({count})</span>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Products Grid ─── */}
      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center py-24 bg-white rounded-2xl shadow-sm border border-[var(--beige)]"
          >
            <div className="text-6xl mb-4" aria-hidden="true">🌿</div>
            <p className="text-xl font-bold mb-2 text-[var(--text-dark)]">
              {search ? `لا نتائج لـ "${search}"` : 'لا توجد منتجات'}
            </p>
            <p className="text-sm text-[var(--on-surface-variant)] mb-6">
              {search ? 'جربي كلمة بحث مختلفة' : 'جربي فئة مختلفة'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-6 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90"
                style={{ background: 'var(--primary)' }}
              >
                مسح الفلاتر
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5"
          >
            {filtered.map((p, i) => (
              <EnhancedProductCard key={p.id} product={p} index={i} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
