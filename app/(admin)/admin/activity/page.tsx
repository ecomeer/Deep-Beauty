'use client'

import { useState } from 'react'
import { formatDateTime } from '@/lib/utils'
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline'
import { useAdminList } from '@/hooks/useAdminList'

interface ActivityEntry {
  id: string
  actor_email: string | null
  action: string
  entity: string
  entity_id: string | null
  meta: Record<string, unknown> | null
  created_at: string
}

const ACTION_LABELS: Record<string, string> = {
  create: 'إنشاء',
  update: 'تعديل',
  delete: 'حذف',
  status_change: 'تغيير الحالة',
}

const ENTITY_LABELS: Record<string, string> = {
  product: 'منتج',
  order: 'طلب',
  coupon: 'كوبون',
  setting: 'إعداد',
  banner: 'بنر',
  flash_sale: 'عرض فلاش',
  category: 'فئة',
}

const ACTION_COLORS: Record<string, string> = {
  create: 'badge-success',
  update: 'badge-primary',
  delete: 'badge-danger',
  status_change: 'badge-gray',
}

export default function AdminActivity() {
  const [page, setPage] = useState(1)
  const { items: activity, raw, loading } = useAdminList<ActivityEntry>(
    `/api/admin/activity?page=${page}`,
    (json) => (json as { activity?: ActivityEntry[] }).activity || []
  )
  const totalPages = (raw as { totalPages?: number } | null)?.totalPages ?? 1

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-dark)]">سجل النشاط</h1>
        <p className="text-sm opacity-60">سجل بعمليات الإنشاء والتعديل والحذف في لوحة التحكم</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: 'var(--beige)' }}>
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="animate-spin w-8 h-8 rounded-full border-4" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
          </div>
        ) : activity.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <ClipboardDocumentListIcon className="w-12 h-12 opacity-20" />
            <p className="text-sm opacity-50">لا يوجد نشاط مسجّل بعد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table text-sm">
              <thead>
                <tr>
                  <th>العملية</th>
                  <th>العنصر</th>
                  <th>المُنفّذ</th>
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {activity.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <span className={`badge ${ACTION_COLORS[a.action] || 'badge-gray'}`}>
                        {ACTION_LABELS[a.action] || a.action}
                      </span>
                    </td>
                    <td>
                      {ENTITY_LABELS[a.entity] || a.entity}
                      {a.entity_id && <span className="text-xs opacity-40 font-en mr-1" dir="ltr">#{String(a.entity_id).slice(0, 8)}</span>}
                    </td>
                    <td className="font-en text-xs" dir="ltr">{a.actor_email || '—'}</td>
                    <td className="text-xs" dir="ltr">{formatDateTime(a.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 rounded-xl border text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors"
            style={{ borderColor: 'var(--beige)' }}
          >السابق</button>
          <span className="text-sm opacity-60">صفحة {page} من {totalPages}</span>
          <button
            type="button"
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 rounded-xl border text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors"
            style={{ borderColor: 'var(--beige)' }}
          >التالي</button>
        </div>
      )}
    </div>
  )
}
