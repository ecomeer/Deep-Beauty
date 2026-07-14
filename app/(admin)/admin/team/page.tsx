'use client'

import { useState } from 'react'
import { UserPlusIcon, UsersIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useAdminList } from '@/hooks/useAdminList'
import { PERMISSIONS, PERMISSION_LABELS, type Permission } from '@/lib/admin-permissions'

interface StaffMember {
  id: string
  name: string
  email: string
  permissions: Permission[]
  is_active: boolean
  created_at: string
}

const EMPTY_FORM = { name: '', email: '', password: '', permissions: [] as Permission[] }

export default function AdminTeamPage() {
  const { items: staff, setItems: setStaff, loading, refetch } = useAdminList<StaffMember>(
    '/api/admin/staff',
    (json) => (json as { staff?: StaffMember[] }).staff || []
  )
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  function togglePermission(perm: Permission) {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(perm)
        ? f.permissions.filter(p => p !== perm)
        : [...f.permissions, perm],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || form.password.length < 8) {
      toast.error('الاسم والبريد مطلوبان، وكلمة المرور 8 أحرف على الأقل')
      return
    }
    setSaving(true)
    const res = await fetch('/api/admin/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (!res.ok) {
      const { error } = await res.json()
      toast.error('حدث خطأ: ' + error)
      return
    }
    toast.success('تم إضافة الموظف')
    setForm(EMPTY_FORM)
    setShowForm(false)
    refetch()
  }

  async function togglePermissionOnStaff(member: StaffMember, perm: Permission) {
    const newPermissions = member.permissions.includes(perm)
      ? member.permissions.filter(p => p !== perm)
      : [...member.permissions, perm]
    const res = await fetch(`/api/admin/staff/${member.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissions: newPermissions }),
    })
    if (!res.ok) { toast.error('حدث خطأ'); return }
    setStaff(prev => prev.map(s => s.id === member.id ? { ...s, permissions: newPermissions } : s))
  }

  async function toggleActive(member: StaffMember) {
    const res = await fetch(`/api/admin/staff/${member.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !member.is_active }),
    })
    if (!res.ok) { toast.error('حدث خطأ'); return }
    setStaff(prev => prev.map(s => s.id === member.id ? { ...s, is_active: !member.is_active } : s))
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-dark)]">الفريق</h1>
          <p className="text-sm opacity-60">إدارة حسابات الموظفين وصلاحياتهم ({staff.length})</p>
        </div>
        <button type="button" onClick={() => setShowForm(!showForm)} className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2">
          <UserPlusIcon className="w-4 h-4" /> {showForm ? 'إلغاء' : 'موظف جديد'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8" style={{ borderColor: 'var(--beige)' }}>
          <h2 className="text-base font-bold mb-5 text-[var(--text-dark)]">إضافة موظف جديد</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">الاسم *</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">البريد الإلكتروني *</label>
                <input required type="email" dir="ltr" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">كلمة المرور *</label>
                <input required type="password" dir="ltr" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="input-field" placeholder="8 أحرف على الأقل" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">الصلاحيات</label>
              <div className="flex flex-wrap gap-2">
                {PERMISSIONS.map(perm => (
                  <button
                    key={perm}
                    type="button"
                    onClick={() => togglePermission(perm)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                      form.permissions.includes(perm)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {PERMISSION_LABELS[perm]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary px-6 py-2.5 text-sm disabled:opacity-50">
                {saving ? 'جاري الحفظ...' : 'حفظ'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }} className="btn-outline px-6 py-2.5 text-sm">إلغاء</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="animate-spin w-8 h-8 rounded-full border-4" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
        </div>
      ) : staff.length === 0 ? (
        <div className="bg-white rounded-2xl border p-16 text-center" style={{ borderColor: 'var(--beige)' }}>
          <UsersIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm opacity-50">لا يوجد موظفون بعد — أضف أول موظف بصلاحيات محدودة</p>
        </div>
      ) : (
        <div className="space-y-4">
          {staff.map(member => (
            <div key={member.id} className="bg-white rounded-2xl shadow-sm border p-5" style={{ borderColor: 'var(--beige)' }}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h3 className="font-bold text-sm text-[var(--text-dark)]">{member.name}</h3>
                  <p className="text-xs opacity-50 mt-0.5" dir="ltr">{member.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleActive(member)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    member.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {member.is_active ? <CheckCircleIcon className="w-4 h-4" /> : <XCircleIcon className="w-4 h-4" />}
                  {member.is_active ? 'نشط' : 'موقوف'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {PERMISSIONS.map(perm => (
                  <button
                    key={perm}
                    type="button"
                    onClick={() => togglePermissionOnStaff(member, perm)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                      member.permissions.includes(perm)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {PERMISSION_LABELS[perm]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
