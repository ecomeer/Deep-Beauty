'use client'

import Link from 'next/link'
import { 
  TicketIcon, 
  MegaphoneIcon, 
  EnvelopeIcon, 
  DevicePhoneMobileIcon,
  BellIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'

const MARKETING_SECTIONS = [
  {
    title: 'كوبونات الخصم',
    description: 'إنشاء وإدارة أكواد الخصم والعروض الترويجية',
    href: '/admin/marketing/coupons',
    icon: TicketIcon,
    color: 'bg-orange-100 text-orange-600'
  },
  {
    title: 'الحملات التسويقية',
    description: 'إدارة حملات البريد الإلكتروني والرسائل والإشعارات',
    href: '/admin/marketing/campaigns',
    icon: MegaphoneIcon,
    color: 'bg-blue-100 text-blue-600'
  },
  {
    title: 'النشرة البريدية',
    description: 'إدارة المشتركين وإرسال النشرات الدورية',
    href: '/admin/newsletter',
    icon: EnvelopeIcon,
    color: 'bg-green-100 text-green-600'
  }
]

const CHANNELS = [
  { icon: EnvelopeIcon, label: 'بريد إلكتروني', count: 'قريباً' },
  { icon: DevicePhoneMobileIcon, label: 'رسائل SMS', count: 'قريباً' },
  { icon: BellIcon, label: 'إشعارات Push', count: 'مفعل' }
]

export default function AdminMarketing() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>التسويق</h1>
        <p className="text-sm opacity-60">إدارة الكوبونات والحملات التسويقية والنشرة البريدية</p>
      </div>

      {/* Main Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {MARKETING_SECTIONS.map(section => (
          <Link
            key={section.href}
            href={section.href}
            className="bg-white rounded-2xl shadow-sm border p-6 hover:shadow-md transition-shadow group"
            style={{ borderColor: 'var(--beige)' }}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${section.color}`}>
                <section.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-800 group-hover:text-[#9C6644] transition-colors">
                  {section.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{section.description}</p>
                <div className="flex items-center gap-1 mt-3 text-sm font-medium" style={{ color: 'var(--primary)' }}>
                  <span>إدارة</span>
                  <ArrowLeftIcon className="w-4 h-4 rotate-180" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Channels Status */}
      <div className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor: 'var(--beige)' }}>
        <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-dark)' }}>قنوات التواصل</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {CHANNELS.map(channel => (
            <div key={channel.label} className="flex items-center gap-3 p-4 rounded-xl bg-gray-50">
              <channel.icon className="w-5 h-5" style={{ color: 'var(--primary)' }} />
              <div>
                <p className="font-medium text-sm">{channel.label}</p>
                <p className="text-xs opacity-50">{channel.count}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Tips */}
      <div className="mt-8 bg-blue-50 border border-blue-100 rounded-2xl p-6">
        <h3 className="font-bold text-blue-800 mb-2">💡 نصائح للتسويق الفعال</h3>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>استخدم كوبونات الخصم لزيادة المبيعات في المناسبات</li>
          <li>جمع البريد الإلكتروني للعملاء لإرسال العروض</li>
          <li>فعّل الإشعارات ليصلك تنبيه فوري بالطلبات الجديدة</li>
        </ul>
      </div>
    </div>
  )
}
