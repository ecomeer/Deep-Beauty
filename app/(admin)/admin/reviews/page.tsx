'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { StarIcon } from '@heroicons/react/24/solid'
import { CheckCircleIcon, XCircleIcon, TrashIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface Review {
  id: string
  customer_name: string
  rating: number
  comment: string
  is_approved: boolean
  created_at: string
  products: {
    name_ar: string
    images: string[]
  }
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all')
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    fetchReviews()
  }, [filter])

  async function fetchReviews() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/reviews?status=${filter}`)
      const data = await res.json()
      setReviews(data.reviews || [])
    } catch (error) {
      console.error('Error fetching reviews:', error)
      toast.error('فشل تحميل التقييمات')
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(id: string, approve: boolean) {
    setProcessing(id)
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isApproved: approve }),
      })
      
      if (res.ok) {
        toast.success(approve ? 'تمت الموافقة على التقييم' : 'تم رفض التقييم')
        fetchReviews()
      } else {
        throw new Error('Failed')
      }
    } catch {
      toast.error('حدث خطأ')
    } finally {
      setProcessing(null)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا التقييم؟')) return
    
    setProcessing(id)
    try {
      const res = await fetch(`/api/admin/reviews?id=${id}`, {
        method: 'DELETE',
      })
      
      if (res.ok) {
        toast.success('تم حذف التقييم')
        fetchReviews()
      } else {
        throw new Error('Failed')
      }
    } catch {
      toast.error('حدث خطأ')
    } finally {
      setProcessing(null)
    }
  }

  const stats = {
    total: reviews.length,
    pending: reviews.filter(r => !r.is_approved).length,
    approved: reviews.filter(r => r.is_approved).length,
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">إدارة التقييمات</h1>
        <div className="flex gap-2">
          {(['all', 'pending', 'approved'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-[#9C6644] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {f === 'all' ? 'الكل' : f === 'pending' ? 'قيد الانتظار' : 'تمت الموافقة'}
              {f === 'pending' && stats.pending > 0 && (
                <span className="mr-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {stats.pending}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <p className="text-sm text-gray-500">إجمالي التقييمات</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <p className="text-sm text-gray-500">في الانتظار</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <p className="text-sm text-gray-500">تمت الموافقة</p>
          <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 rounded-full border-4 border-[#9C6644] border-t-transparent" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl">
          <p className="text-gray-500">لا توجد تقييمات</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className={`bg-white rounded-xl p-6 shadow-sm transition-opacity ${
                processing === review.id ? 'opacity-50' : ''
              } ${!review.is_approved ? 'border-r-4 border-yellow-400' : ''}`}
            >
              <div className="flex items-start gap-4">
                {/* Product Image */}
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {review.products?.images?.[0] ? (
                    <img
                      src={review.products.images[0]}
                      alt={review.products.name_ar}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🧴</div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{review.products?.name_ar}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <StarIcon
                              key={star}
                              className={`w-4 h-4 ${
                                star <= review.rating ? 'text-yellow-400' : 'text-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">{review.customer_name}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(review.created_at).toLocaleDateString('ar-KW')}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {!review.is_approved && (
                        <button
                          onClick={() => handleApprove(review.id, true)}
                          disabled={processing === review.id}
                          className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                          title="موافقة"
                        >
                          <CheckCircleIcon className="w-5 h-5" />
                        </button>
                      )}
                      {review.is_approved && (
                        <button
                          onClick={() => handleApprove(review.id, false)}
                          disabled={processing === review.id}
                          className="p-2 rounded-lg bg-yellow-100 text-yellow-600 hover:bg-yellow-200 transition-colors"
                          title="رفض"
                        >
                          <XCircleIcon className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(review.id)}
                        disabled={processing === review.id}
                        className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                        title="حذف"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <p className="mt-3 text-gray-700 leading-relaxed">{review.comment}</p>
                  
                  {!review.is_approved && (
                    <span className="inline-block mt-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                      قيد المراجعة
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
