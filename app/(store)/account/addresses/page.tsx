'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ArrowRightIcon, MapPinIcon, PlusIcon, PencilIcon, TrashIcon, StarIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'

interface Address {
  id: string
  label: string
  area: string
  block: string
  street: string
  house: string
  notes: string | null
  is_default: boolean
}

const BLANK = { label: 'المنزل', area: '', block: '', street: '', house: '', notes: '' }

export default function AccountAddressesPage() {
  const router = useRouter()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Address | null>(null)
  const [form, setForm] = useState(BLANK)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me').then(r => { if (!r.ok) router.push('/login') })
    loadAddresses()
  }, [])

  async function loadAddresses() {
    const r = await fetch('/api/account/addresses')
    if (r.ok) { const d = await r.json(); setAddresses(d.addresses) }
    setLoading(false)
  }

  function openNew() { setEditing(null); setForm(BLANK); setShowForm(true) }
  function openEdit(a: Address) {
    setEditing(a)
    setForm({ label: a.label, area: a.area, block: a.block, street: a.street, house: a.house, notes: a.notes || '' })
    setShowForm(true)
  }

  async function save() {
    if (!form.area.trim()) { toast.error('المنطقة مطلوبة'); return }
    setSaving(true)
    try {
      const url = editing ? `/api/account/addresses/${editing.id}` : '/api/account/addresses'
      const r = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!r.ok) { const d = await r.json(); throw new Error(d.error) }
      toast.success(editing ? 'حُدّث العنوان' : 'أُضيف العنوان')
      setShowForm(false)
      loadAddresses()
    } catch (e: any) { toast.error(e.message || 'تعذّر حفظ العنوان — حاولي مجدداً') }
    setSaving(false)
  }

  async function setDefault(id: string) {
    await fetch(`/api/account/addresses/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_default: true }),
    })
    loadAddresses()
  }

  async function remove(id: string) {
    if (!confirm('حذف هذا العنوان؟')) return
    await fetch(`/api/account/addresses/${id}`, { method: 'DELETE' })
    toast.success('تم الحذف')
    loadAddresses()
  }

  return (
    <div className="min-h-screen bg-surface pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/account" className="w-9 h-9 rounded-xl bg-white border border-outline-variant flex items-center justify-center">
            <ArrowRightIcon className="w-4 h-4 text-on-surface" />
          </Link>
          <h1 className="font-bold text-lg text-on-surface">عناويني</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <>
            <div className="space-y-3 mb-4">
              {addresses.length === 0 && (
                <div className="bg-white rounded-2xl p-10 text-center border border-outline-variant/50">
                  <MapPinIcon className="w-10 h-10 text-on-surface-variant mx-auto mb-3" />
                  <p className="text-sm text-on-surface-variant">لا توجد عناوين محفوظة بعد</p>
                </div>
              )}
              {addresses.map(a => (
                <div key={a.id} className="bg-white rounded-2xl p-4 border border-outline-variant/50 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPinIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-sm text-on-surface">{a.label}</span>
                      {a.is_default && <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">افتراضي</span>}
                    </div>
                    <p className="text-sm text-on-surface-variant">
                      {a.area}{a.block ? `، قطعة ${a.block}` : ''}{a.street ? `، شارع ${a.street}` : ''}{a.house ? `، ${a.house}` : ''}
                    </p>
                    {a.notes && <p className="text-xs text-on-surface-variant mt-1 opacity-70">{a.notes}</p>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!a.is_default && (
                      <button onClick={() => setDefault(a.id)} title="تعيين كافتراضي" className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant">
                        <StarIcon className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant">
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => remove(a.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={openNew} className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-outline-variant rounded-2xl text-sm text-on-surface-variant hover:border-primary hover:text-primary transition-colors">
              <PlusIcon className="w-4 h-4" />
              إضافة عنوان جديد
            </button>
          </>
        )}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4" onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}>
            <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-base">{editing ? 'تعديل العنوان' : 'عنوان جديد'}</h2>
                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-xl hover:bg-surface-container">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-on-surface-variant mb-1 block">التسمية</label>
                  <select value={form.label} onChange={e => setForm(f => ({...f, label: e.target.value}))} className="w-full border border-outline-variant rounded-xl px-3 py-2 text-sm bg-white">
                    {['المنزل','العمل','منزل الأهل','آخر'].map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-on-surface-variant mb-1 block">المنطقة <span className="text-red-400">*</span></label>
                  <input value={form.area} onChange={e => setForm(f => ({...f, area: e.target.value}))} placeholder="مثال: السالمية" className="w-full border border-outline-variant rounded-xl px-3 py-2 text-sm" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[['block','القطعة'],['street','الشارع'],['house','المنزل/الشقة']].map(([k,lbl]) => (
                    <div key={k}>
                      <label className="text-xs text-on-surface-variant mb-1 block">{lbl}</label>
                      <input value={(form as any)[k]} onChange={e => setForm(f => ({...f, [k]: e.target.value}))} className="w-full border border-outline-variant rounded-xl px-3 py-2 text-sm" />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="text-xs text-on-surface-variant mb-1 block">ملاحظات (اختياري)</label>
                  <input value={form.notes || ''} onChange={e => setForm(f => ({...f, notes: e.target.value}))} placeholder="مثال: الدور الثاني، جرس 3" className="w-full border border-outline-variant rounded-xl px-3 py-2 text-sm" />
                </div>
              </div>
              <button onClick={save} disabled={saving} className="w-full mt-5 py-3 bg-primary text-white rounded-xl font-medium text-sm disabled:opacity-60">
                {saving ? 'جارٍ الحفظ...' : 'حفظ العنوان'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
