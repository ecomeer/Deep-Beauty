// Single source of truth for the order lifecycle: statuses, valid
// transitions, active/terminal groupings, and display config.
// Every layer (types, API routes, store pages, admin pages) imports
// from here instead of hardcoding its own lists.

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

// Orders the customer still expects movement on
export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
]

// Which statuses an order may move to from its current one
export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'shipped', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
}

export const STATUS_LABELS: Record<string, string> = {
  pending: 'قيد الانتظار',
  confirmed: 'مؤكد',
  processing: 'قيد المعالجة',
  shipped: 'تم الشحن',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
}

export const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-orange-100 text-orange-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

// Customer-facing notification copy per status (WhatsApp / email)
export const STATUS_CUSTOMER_MESSAGES: Record<string, string> = {
  confirmed: 'تم تأكيد طلبك',
  shipped: 'تم شحن طلبك وهو في الطريق إليك',
  delivered: 'تم توصيل طلبك بنجاح، شكراً لتسوقك معنا! 💚',
  cancelled: 'تم إلغاء طلبك. للاستفسار تواصل معنا.',
}
