import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const toArabicPrice = (price: number): string =>
  price.toFixed(3).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[+d]) + ' د.ك'

export const isKuwaitPhone = (phone: string): boolean =>
  /^(\+965|965|0)?[569]\d{7}$/.test(phone.replace(/\s/g, ''))

// Normalizes a phone number for wa.me links: digits only, Kuwait country
// code prepended for local 8-digit numbers.
export const toWhatsAppPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '').replace(/^0+/, '')
  if (digits.startsWith('965')) return digits
  if (digits.length === 8) return `965${digits}`
  return digits
}

export const generateOrderNumber = (): string => {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `DB-${dateStr}-${rand}`
}

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('ar-KW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('ar-KW', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export const slugify = (text: string): string =>
  text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')

export const KUWAIT_AREAS = [
  'العاصمة',
  'حولي',
  'الفروانية',
  'الأحمدي',
  'الجهراء',
  'مبارك الكبير',
  'السالمية',
  'الرميثية',
  'البيان',
  'الزهراء',
  'الجابرية',
  'النقرة',
  'الفنيطيس',
  'المنقف',
  'أبو حليفة',
  'الفحيحيل',
  'الزور',
  'الوفرة',
  'صباح الأحمد',
  'الخيران',
]

export const COUNTRY_AREAS: Record<string, string[]> = {
  KW: KUWAIT_AREAS,
  SA: [
    'الرياض',
    'جدة',
    'مكة المكرمة',
    'المدينة المنورة',
    'الدمام',
    'الخبر',
    'الظهران',
    'الأحساء',
    'تبوك',
    'أبها',
    'القصيم',
    'حائل',
    'جازان',
    'نجران',
    'الباحة',
    'الجوف',
    'عسير',
    'الطائف',
    'ينبع',
    'القطيف',
  ],
  AE: [
    'دبي',
    'أبوظبي',
    'الشارقة',
    'عجمان',
    'رأس الخيمة',
    'الفجيرة',
    'أم القيوين',
    'العين',
    'الظفرة',
  ],
  QA: [
    'الدوحة',
    'الريان',
    'الوكرة',
    'أم صلال',
    'الخور',
    'الشمال',
    'الشيحانية',
    'الضعاين',
  ],
  BH: [
    'المنامة',
    'المحرق',
    'الرفاع',
    'مدينة عيسى',
    'مدينة حمد',
    'الجنوبية',
    'الشمالية',
    'سترة',
  ],
  OM: [
    'مسقط',
    'صلالة',
    'صحار',
    'نزوى',
    'مطرح',
    'البريمي',
    'صور',
    'إبراء',
    'الرستاق',
    'خصب',
  ],
}

// Order-status display config lives in lib/order-status.ts; re-exported
// here so existing `from '@/lib/utils'` imports keep working.
export { STATUS_LABELS, STATUS_COLORS } from './order-status'
