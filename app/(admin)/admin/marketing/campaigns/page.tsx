'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { PlusIcon, MegaphoneIcon, EnvelopeIcon, DevicePhoneMobileIcon, ShareIcon, BellIcon, PencilSquareIcon, TrashIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'

interface Campaign {
  id: string
  title: string
  description: string | null
  type: 'email' | 'sms' | 'push' | 'social'
  target_audience: 'all' | 'customers' | 'vip' | 'new'
  content: any
  scheduled_at: string | null
  sent_at: string | null
  is_active: boolean
  sent_count: number
  created_at: string
}

const TYPE_ICONS = {
  email: EnvelopeIcon,
  sms: DevicePhoneMobileIcon,
  push: BellIcon,
  social: ShareIcon
}

const TYPE_LABELS = {
  email: 'بريد إلكتروني',
  sms: 'رسائل نصية',
  push: 'إشعارات',
  social: 'وسائل التواصل'
}

const AUDIENCE_LABELS = {
  all: 'الجميع',
  customers: 'العملاء',
  vip: 'VIP',
  new: 'عملاء جدد'
}

export default function MarketingCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCampaigns = async () => {
    const res = await fetch('/api/admin/marketing')
    const data = await res.json()
    setCampaigns(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { fetchCampaigns() }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الحملة؟')) return
    const res = await fetch(`/api/admin/marketing/${id}`, { method: 'DELETE' })
    if (!res.ok) toast.error('حدث خطأ أثناء الحذف')
    else { toast.success('تم حذف الحملة'); fetchCampaigns() }
  }

  const handleSend = async (id: string) => {
    if (!confirm('هل تريد إرسال هذه الحملة الآن؟')) return
    const res = await fetch(`/api/admin/marketing/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'send' })
    })
    if (!res.ok) toast.error('حدث خطأ أثناء الإرسال')
    else {
      const data = await res.json()
      toast.success(`تم إرسال الحملة إلى ${data.sent_count} مستلم`)
      fetchCampaigns()
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>الحملات التسويقية</h1>
          <p className="text-sm opacity-60">إدارة حملات البريد والرسائل والإشعارات ({campaigns.length})</p>
        </div>
        <Link href="/admin/marketing/campaigns/new" className="btn-primary py-2 px-4 shadow-md flex items-center gap-2">
          <PlusIcon className="w-5 h-5" /> حملة جديدة
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: 'var(--beige)' }}>
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>الحملة</th>
                <th>النوع</th>
                <th>الجمهور</th>
                <th>الحالة</th>
                <th>الإحصائيات</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 opacity-50">جاري التحميل...</td></tr>
              ) : campaigns.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 opacity-50">لا توجد حملات بعد</td></tr>
              ) : (
                campaigns.map(c => {
                  const TypeIcon = TYPE_ICONS[c.type]
                  return (
                    <tr key={c.id}>
                      <td>
                        <div className="font-bold">{c.title}</div>
                        <div className="text-xs opacity-50">{c.description || 'لا يوجد وصف'}</div>
                      </td>
                      <td>
                        <span className="badge badge-primary flex items-center gap-1">
                          <TypeIcon className="w-3 h-3" />
                          {TYPE_LABELS[c.type]}
                        </span>
                      </td>
                      <td><span className="badge badge-gray">{AUDIENCE_LABELS[c.target_audience]}</span></td>
                      <td>
                        {c.sent_at ? (
                          <span className="badge badge-success">تم الإرسال</span>
                        ) : c.scheduled_at ? (
                          <span className="badge badge-warning">مجدولة</span>
                        ) : (
                          <span className="badge badge-primary">جاهزة</span>
                        )}
                      </td>
                      <td className="text-sm">
                        {c.sent_count > 0 ? `${c.sent_count} مستلم` : 'لم ترسل بعد'}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          {!c.sent_at && (
                            <button
                              onClick={() => handleSend(c.id)}
                              className="p-2 rounded-lg hover:bg-green-50 text-green-500"
                              title="إرسال الآن"
                            >
                              <PaperAirplaneIcon className="w-5 h-5" />
                            </button>
                          )}
                          <Link href={`/admin/marketing/campaigns/${c.id}`} className="p-2 rounded-lg hover:bg-blue-50 text-blue-500">
                            <PencilSquareIcon className="w-5 h-5" />
                          </Link>
                          <button onClick={() => handleDelete(c.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500">
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden p-4 space-y-3">
          {loading ? (
            <div className="text-center py-10 opacity-50">جاري التحميل...</div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-10 opacity-50">لا توجد حملات بعد</div>
          ) : (
            campaigns.map(c => {
              const TypeIcon = TYPE_ICONS[c.type]
              return (
                <div key={c.id} className="border rounded-xl p-4" style={{ borderColor: 'var(--beige)' }}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <TypeIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">{c.title}</div>
                      <div className="flex gap-2 mt-1">
                        <span className="badge badge-primary text-xs">{TYPE_LABELS[c.type]}</span>
                        <span className="badge badge-gray text-xs">{AUDIENCE_LABELS[c.target_audience]}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs opacity-60 mb-3">{c.description || 'لا يوجد وصف'}</p>
                  <div className="flex justify-between items-center">
                    <div className="text-sm">
                      {c.sent_at ? (
                        <span className="text-green-600">✓ تم الإرسال ({c.sent_count})</span>
                      ) : c.scheduled_at ? (
                        <span className="text-orange-500">⏳ مجدولة</span>
                      ) : (
                        <span className="text-blue-500">✓ جاهزة</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {!c.sent_at && (
                        <button
                          onClick={() => handleSend(c.id)}
                          className="p-2 rounded-lg hover:bg-green-50 text-green-500"
                          title="إرسال الآن"
                        >
                          <PaperAirplaneIcon className="w-5 h-5" />
                        </button>
                      )}
                      <button onClick={() => handleDelete(c.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500">
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
