// Granular permission categories a 'staff' user can be granted. Full
// admins always have every permission implicitly — this list only gates
// staff accounts. Edge-safe: no Node-only imports.

export const PERMISSIONS = [
  'orders',
  'products',
  'marketing',
  'customers',
  'reviews',
  'settings',
] as const

export type Permission = (typeof PERMISSIONS)[number]

export const PERMISSION_LABELS: Record<Permission, string> = {
  orders: 'الطلبات',
  products: 'المنتجات والفئات',
  marketing: 'التسويق والعروض والكوبونات',
  customers: 'العملاء والمشتركون',
  reviews: 'التقييمات',
  settings: 'الإعدادات والشحن',
}

export function isPermission(value: string): value is Permission {
  return (PERMISSIONS as readonly string[]).includes(value)
}
