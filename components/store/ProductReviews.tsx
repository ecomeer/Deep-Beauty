'use client'

import { useState, useEffect } from 'react'
import { StarIcon } from '@heroicons/react/24/solid'
import { StarIcon as StarOutline } from '@heroicons/react/24/outline'

interface Review {
  id: string
  product_id: string
  customer_name: string
  rating: number
  comment: string
  created_at: string
}

interface ProductReviewsProps {
  productId: string
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    customerName: '',
    rating: 5,
    comment: '',
  })
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    fetchReviews()
  }, [productId])

  async function fetchReviews() {
    try {
      const res = await fetch(`/api/reviews?productId=${productId}`)
      const data = await res.json()
      setReviews(data.reviews || [])
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          customerName: formData.customerName,
          rating: formData.rating,
          comment: formData.comment,
        }),
      })

      if (res.ok) {
        setSubmitted(true)
        setFormData({ customerName: '', rating: 5, comment: '' })
      }
    } catch (error) {
      console.error('Error submitting review:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0

  return (
    <div className="mt-12 pt-12 border-t" style={{ borderColor: 'var(--beige)' }}>
      <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'var(--font-cormorant), serif' }}>
        تقييمات العملاء
      </h2>

      {reviews.length > 0 && (
        <div className="flex items-center gap-4 mb-8 p-4 rounded-xl" style={{ background: 'var(--beige)' }}>
          <div className="text-4xl font-bold" style={{ color: 'var(--primary)' }}>
            {averageRating.toFixed(1)}
          </div>
          <div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon
                  key={star}
                  className={`w-5 h-5 ${star <= Math.round(averageRating) ? 'text-yellow-400' : 'text-gray-300'}`}
                />
              ))}
            </div>
            <p className="text-sm mt-1">{reviews.length} تقييم</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-20 rounded-xl" style={{ background: 'var(--beige)' }} />
          <div className="h-20 rounded-xl" style={{ background: 'var(--beige)' }} />
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-center py-8 opacity-60">
          لا توجد تقييمات حتى الآن. كن أول من يقيم هذا المنتج!
        </p>
      ) : (
        <div className="space-y-4 mb-8">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="p-4 rounded-xl"
              style={{ background: 'var(--off-white)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon
                      key={star}
                      className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium">{review.customer_name}</span>
              </div>
              <p className="text-sm leading-relaxed">{review.comment}</p>
            </div>
          ))}
        </div>
      )}

      {!showForm && !submitted && (
        <button
          onClick={() => setShowForm(true)}
          className="btn-outline w-full"
        >
          ✨ أضف تقييمك
        </button>
      )}

      {showForm && !submitted && (
        <form onSubmit={handleSubmit} className="p-6 rounded-xl" style={{ background: 'var(--off-white)' }}>
          <h3 className="font-bold mb-4">أضف تقييمك</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1">الاسم</label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                required
                className="input-field w-full"
                placeholder="اسمك"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">التقييم</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: star })}
                    className="p-1"
                  >
                    {star <= formData.rating ? (
                      <StarIcon className="w-6 h-6 text-yellow-400" />
                    ) : (
                      <StarOutline className="w-6 h-6 text-gray-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1">تعليقك</label>
              <textarea
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                required
                rows={4}
                className="input-field w-full"
                placeholder="شارك تجربتك مع المنتج..."
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-outline flex-1"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary flex-1"
              >
                {submitting ? '...' : 'إرسال'}
              </button>
            </div>
          </div>
        </form>
      )}

      {submitted && (
        <div className="p-6 rounded-xl text-center" style={{ background: 'var(--beige)' }}>
          <p className="text-lg mb-2">✅ شكراً لك!</p>
          <p className="text-sm opacity-70">تم إرسال تقييمك وهو قيد المراجعة</p>
        </div>
      )}
    </div>
  )
}
