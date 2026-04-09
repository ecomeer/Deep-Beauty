'use client'

import { useState, useEffect } from 'react'
import { 
  TruckIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { GULF_COUNTRIES, GulfCountry } from '@/lib/currency'
import toast from 'react-hot-toast'

interface ShippingZone {
  id: string
  name_ar: string
  name_en: string
  countries: string[]
  base_rate: number
  free_shipping_threshold: number | null
  estimated_days_min: number
  estimated_days_max: number
  is_active: boolean
  sort_order: number
}

const EMPTY_ZONE: Omit<ShippingZone, 'id'> = {
  name_ar: '',
  name_en: '',
  countries: [],
  base_rate: 0,
  free_shipping_threshold: null,
  estimated_days_min: 1,
  estimated_days_max: 3,
  is_active: true,
  sort_order: 0
}

export default function ShippingManagementPage() {
  const [zones, setZones] = useState<ShippingZone[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<ShippingZone | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchZones()
  }, [])

  async function fetchZones() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/shipping')
      const data = await res.json()
      setZones(data.zones || [])
    } catch {
      toast.error('فشل تحميل مناطق الشحن')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(zone: ShippingZone | Omit<ShippingZone, 'id'>, isEdit: boolean) {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/shipping', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(zone)
      })

      if (res.ok) {
        toast.success(isEdit ? 'تم تحديث منطقة الشحن' : 'تم إنشاء منطقة شحن جديدة')
        fetchZones()
        setEditing(null)
        setIsCreating(false)
      } else {
        throw new Error('Failed')
      }
    } catch {
      toast.error('حدث خطأ أثناء الحفظ')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('هل أنت متأكد من حذف منطقة الشحن؟')) return

    try {
      const res = await fetch(`/api/admin/shipping?id=${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success('تم حذف منطقة الشحن')
        fetchZones()
      } else {
        throw new Error('Failed')
      }
    } catch {
      toast.error('فشل الحذف')
    }
  }

  async function toggleActive(zone: ShippingZone) {
    try {
      const res = await fetch('/api/admin/shipping', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: zone.id,
          is_active: !zone.is_active
        })
      })

      if (res.ok) {
        toast.success(zone.is_active ? 'تم تعطيل منطقة الشحن' : 'تم تفعيل منطقة الشحن')
        fetchZones()
      } else {
        throw new Error('Failed')
      }
    } catch {
      toast.error('فشل التحديث')
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TruckIcon className="w-7 h-7" />
          إدارة الشحن
        </h1>
        <button
          onClick={() => {
            setIsCreating(true)
            setEditing(null)
          }}
          className="btn-primary flex items-center gap-2 px-4 py-2"
        >
          <PlusIcon className="w-5 h-5" />
          إضافة منطقة
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <p className="text-sm text-gray-500">إجمالي المناطق</p>
          <p className="text-2xl font-bold">{zones.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <p className="text-sm text-gray-500">المناطق النشطة</p>
          <p className="text-2xl font-bold text-green-600">
            {zones.filter(z => z.is_active).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <p className="text-sm text-gray-500">الدول المدعومة</p>
          <p className="text-2xl font-bold text-blue-600">
            {new Set(zones.flatMap(z => z.countries)).size}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <p className="text-sm text-gray-500">متوسط سعر الشحن</p>
          <p className="text-2xl font-bold text-purple-600">
            {(zones.filter(z => z.base_rate > 0).reduce((sum, z) => sum + z.base_rate, 0) / 
              Math.max(1, zones.filter(z => z.base_rate > 0).length)).toFixed(2)} د.ك
          </p>
        </div>
      </div>

      {/* Form */}
      {(isCreating || editing) && (
        <ZoneForm
          zone={editing || EMPTY_ZONE}
          isEdit={!!editing}
          onSave={handleSave}
          onCancel={() => {
            setIsCreating(false)
            setEditing(null)
          }}
          saving={saving}
        />
      )}

      {/* Zones List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 rounded-full border-4 border-[#9C6644] border-t-transparent" />
        </div>
      ) : zones.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl">
          <TruckIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 mb-4">لا توجد مناطق شحن مضافة</p>
          <button
            onClick={() => setIsCreating(true)}
            className="btn-primary px-6 py-2"
          >
            إضافة أول منطقة
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className={`bg-white rounded-xl p-6 shadow-sm transition-all ${
                !zone.is_active ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold">{zone.name_ar}</h3>
                    <span className="text-sm text-gray-500">({zone.name_en})</span>
                    {zone.is_active ? (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                        نشط
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">
                        معطل
                      </span>
                    )}
                  </div>

                  {/* Countries */}
                  <div className="flex items-center gap-2 mb-3">
                    <GlobeAltIcon className="w-4 h-4 text-gray-400" />
                    <div className="flex gap-2">
                      {zone.countries.map((code) => {
                        const country = GULF_COUNTRIES[code as GulfCountry]
                        return country ? (
                          <span
                            key={code}
                            className="text-2xl"
                            title={country.name_ar}
                          >
                            {country.flag}
                          </span>
                        ) : null
                      })}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">سعر الشحن:</span>
                      <span className="font-bold mr-1">
                        {zone.base_rate === 0 ? 'مجاني' : `${zone.base_rate.toFixed(3)} د.ك`}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">الشحن المجاني:</span>
                      <span className="font-bold mr-1">
                        {zone.free_shipping_threshold 
                          ? `عند ${zone.free_shipping_threshold.toFixed(3)} د.ك`
                          : 'غير متاح'
                        }
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">مدة التوصيل:</span>
                      <span className="font-bold mr-1">
                        {zone.estimated_days_min === zone.estimated_days_max
                          ? `${zone.estimated_days_min} يوم`
                          : `من ${zone.estimated_days_min} إلى ${zone.estimated_days_max} أيام`
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(zone)}
                    className={`p-2 rounded-lg transition-colors ${
                      zone.is_active 
                        ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title={zone.is_active ? 'تعطيل' : 'تفعيل'}
                  >
                    {zone.is_active ? (
                      <CheckCircleIcon className="w-5 h-5" />
                    ) : (
                      <XCircleIcon className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(zone)
                      setIsCreating(false)
                    }}
                    className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                    title="تعديل"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(zone.id)}
                    className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                    title="حذف"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Zone Form Component
function ZoneForm({
  zone,
  isEdit,
  onSave,
  onCancel,
  saving
}: {
  zone: ShippingZone | Omit<ShippingZone, 'id'>
  isEdit: boolean
  onSave: (zone: any, isEdit: boolean) => void
  onCancel: () => void
  saving: boolean
}) {
  const [form, setForm] = useState(zone)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form, isEdit)
  }

  const toggleCountry = (code: string) => {
    setForm(prev => ({
      ...prev,
      countries: prev.countries.includes(code)
        ? prev.countries.filter(c => c !== code)
        : [...prev.countries, code]
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm mb-8">
      <h2 className="text-lg font-bold mb-4">
        {isEdit ? 'تعديل منطقة الشحن' : 'إضافة منطقة شحن جديدة'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Name Arabic */}
        <div>
          <label className="block text-sm font-medium mb-1">الاسم (عربي) *</label>
          <input
            type="text"
            required
            value={form.name_ar}
            onChange={e => setForm({ ...form, name_ar: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#9C6644] focus:border-[#9C6644]"
            placeholder="مثال: المملكة العربية السعودية"
          />
        </div>

        {/* Name English */}
        <div>
          <label className="block text-sm font-medium mb-1">الاسم (English) *</label>
          <input
            type="text"
            required
            value={form.name_en}
            onChange={e => setForm({ ...form, name_en: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#9C6644] focus:border-[#9C6644]"
            placeholder="e.g., Saudi Arabia"
          />
        </div>

        {/* Base Rate */}
        <div>
          <label className="block text-sm font-medium mb-1">سعر الشحن الأساسي (د.ك) *</label>
          <input
            type="number"
            step="0.001"
            min="0"
            required
            value={form.base_rate}
            onChange={e => setForm({ ...form, base_rate: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#9C6644] focus:border-[#9C6644]"
          />
          <p className="text-xs text-gray-500 mt-1">ادخل 0 للشحن المجاني</p>
        </div>

        {/* Free Shipping Threshold */}
        <div>
          <label className="block text-sm font-medium mb-1">حد الشحن المجاني (د.ك)</label>
          <input
            type="number"
            step="0.001"
            min="0"
            value={form.free_shipping_threshold || ''}
            onChange={e => setForm({ 
              ...form, 
              free_shipping_threshold: e.target.value ? parseFloat(e.target.value) : null 
            })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#9C6644] focus:border-[#9C6644]"
          />
          <p className="text-xs text-gray-500 mt-1">اتركه فارغاً إذا لا يوجد شحن مجاني</p>
        </div>

        {/* Estimated Days */}
        <div>
          <label className="block text-sm font-medium mb-1">الحد الأدنى للتوصيل (أيام) *</label>
          <input
            type="number"
            min="1"
            required
            value={form.estimated_days_min}
            onChange={e => setForm({ ...form, estimated_days_min: parseInt(e.target.value) || 1 })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#9C6644] focus:border-[#9C6644]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">الحد الأقصى للتوصيل (أيام) *</label>
          <input
            type="number"
            min="1"
            required
            value={form.estimated_days_max}
            onChange={e => setForm({ ...form, estimated_days_max: parseInt(e.target.value) || 1 })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#9C6644] focus:border-[#9C6644]"
          />
        </div>

        {/* Sort Order */}
        <div>
          <label className="block text-sm font-medium mb-1">الترتيب</label>
          <input
            type="number"
            min="0"
            value={form.sort_order}
            onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#9C6644] focus:border-[#9C6644]"
          />
        </div>

        {/* Active */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_active"
            checked={form.is_active}
            onChange={e => setForm({ ...form, is_active: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-[#9C6644] focus:ring-[#9C6644]"
          />
          <label htmlFor="is_active" className="text-sm font-medium">نشط</label>
        </div>
      </div>

      {/* Countries Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">الدول المشمولة *</label>
        <div className="flex flex-wrap gap-3">
          {Object.entries(GULF_COUNTRIES).map(([code, country]) => (
            <button
              key={code}
              type="button"
              onClick={() => toggleCountry(code)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                form.countries.includes(code)
                  ? 'border-[#9C6644] bg-[#9C6644]/10 text-[#9C6644]'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-xl">{country.flag}</span>
              <span className="text-sm">{country.name_ar}</span>
            </button>
          ))}
        </div>
        {form.countries.length === 0 && (
          <p className="text-red-500 text-sm mt-2">يجب اختيار دولة واحدة على الأقل</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving || form.countries.length === 0}
          className="btn-primary px-6 py-2 disabled:opacity-50"
        >
          {saving ? 'جاري الحفظ...' : isEdit ? 'حفظ التغييرات' : 'إضافة المنطقة'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          إلغاء
        </button>
      </div>
    </form>
  )
}
