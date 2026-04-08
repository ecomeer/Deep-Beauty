'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Product, Category } from '@/types'
import ProductCard from '@/components/store/ProductCard'
import { AdjustmentsHorizontalIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from('products').select('*').eq('is_active', true),
      supabase.from('categories').select('*').eq('is_active', true),
    ])
    setProducts(prods || [])
    setCategories(cats || [])
    setLoading(false)
  }

  const filtered = products
    .filter((p) => !selectedCategory || p.category === selectedCategory)
    .filter((p) => !search || p.name_ar.includes(search) || p.name_en.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price
      if (sortBy === 'price_desc') return b.price - a.price
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  return (
    <div className="min-h-screen" style={{ background: 'var(--off-white)' }}>
      {/* Header */}
      <div className="py-14 px-6 text-center" style={{ background: 'var(--beige)' }}>
        <p className="text-sm font-medium mb-2" style={{ color: 'var(--primary)' }}>✦ مجموعتنا الكاملة</p>
        <h1 className="section-title mb-3">جميع المنتجات</h1>
        <p className="section-subtitle">اكتشفي عالم العناية الفاخرة</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 p-4 rounded-2xl" style={{ background: 'white' }}>
          {/* Search */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="ابحثي عن منتج..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pr-10"
            />
          </div>
          {/* Category */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-field sm:w-48"
          >
            <option value="">كل الفئات</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name_ar}>{c.name_ar}</option>
            ))}
          </select>
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-field sm:w-52"
          >
            <option value="newest">الأحدث</option>
            <option value="price_asc">السعر: من الأقل</option>
            <option value="price_desc">السعر: من الأعلى</option>
          </select>
        </div>

        {/* Results count */}
        <p className="text-sm mb-6 opacity-60" style={{ color: 'var(--text-dark)' }}>
          {filtered.length} منتج
        </p>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-96 rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-xl font-bold mb-2" style={{ color: 'var(--text-dark)' }}>لا توجد منتجات</p>
            <p className="text-sm opacity-60">جربي فئة أو بحث مختلف</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  )
}
