'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  HomeIcon,
  ShoppingBagIcon,
  InboxIcon,
  UsersIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  TagIcon,
  BoltIcon,
  MegaphoneIcon,
  EnvelopeIcon,
  Squares2X2Icon,
  PhotoIcon,
  StarIcon,
  ChartBarIcon,
  TruckIcon,
} from '@heroicons/react/24/outline'

const NAV_LINKS = [
  { href: '/admin/dashboard', icon: HomeIcon, label: 'لوحة التحكم' },
  { href: '/admin/products', icon: ShoppingBagIcon, label: 'المنتجات' },
  { href: '/admin/categories', icon: Squares2X2Icon, label: 'الفئات' },
  { href: '/admin/banners', icon: PhotoIcon, label: 'البنرات' },
  { href: '/admin/orders', icon: InboxIcon, label: 'الطلبات' },
  { href: '/admin/customers', icon: UsersIcon, label: 'العملاء' },
  { href: '/admin/reviews', icon: StarIcon, label: 'التقييمات' },
  { href: '/admin/stats', icon: ChartBarIcon, label: 'الإحصائيات' },
  { href: '/admin/shipping', icon: TruckIcon, label: 'الشحن' },
  { href: '/admin/newsletter', icon: EnvelopeIcon, label: 'المشتركون' },
  { href: '/admin/flash-sales', icon: BoltIcon, label: 'عروض الفلاش' },
  { href: '/admin/marketing', icon: MegaphoneIcon, label: 'التسويق' },
  { href: '/admin/settings', icon: Cog6ToothIcon, label: 'الإعدادات' },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  // Don't show sidebar on login page
  if (pathname === '/admin/login') return null

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  return (
    <aside className="admin-sidebar py-6 flex flex-col">
      <div className="px-6 mb-10 text-center">
        <Link href="/" target="_blank" className="inline-block">
          <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-white font-bold font-en text-2xl mb-3 shadow-lg" style={{ background: 'var(--primary)' }}>BD</div>
          <h2 className="font-en tracking-widest text-[#dcc8b8] text-sm uppercase">Deep Beauty</h2>
          <span className="text-xs opacity-50 block mt-1">لوحة التحكم</span>
        </Link>
      </div>

      <nav className="flex-1">
        {NAV_LINKS.map((link) => {
          const isActive = pathname?.startsWith(link.href)
          const Icon = link.icon
          return (
            <Link key={link.href} href={link.href} className={`admin-nav-link ${isActive ? 'active' : ''}`}>
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{link.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="px-3 mt-auto pt-6">
        <button onClick={handleLogout} className="admin-nav-link text-red-300 w-full hover:bg-red-500/10 hover:text-red-200">
          <ArrowRightOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  )
}
