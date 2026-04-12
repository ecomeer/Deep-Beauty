'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

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
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

const NAV_LINKS = [
  { href: '/admin/dashboard', icon: HomeIcon, label: 'الرئيسية' },
  { href: '/admin/orders', icon: InboxIcon, label: 'الطلبات' },
  { href: '/admin/products', icon: ShoppingBagIcon, label: 'المنتجات' },
  { href: '/admin/categories', icon: Squares2X2Icon, label: 'الفئات' },
  { href: '/admin/banners', icon: PhotoIcon, label: 'البنرات' },
  { href: '/admin/customers', icon: UsersIcon, label: 'العملاء' },
  { href: '/admin/reviews', icon: StarIcon, label: 'التقييمات' },
  { href: '/admin/stats', icon: ChartBarIcon, label: 'الإحصائيات' },
  { href: '/admin/shipping', icon: TruckIcon, label: 'الشحن' },
  { href: '/admin/newsletter', icon: EnvelopeIcon, label: 'المشتركون' },
  { href: '/admin/flash-sales', icon: BoltIcon, label: 'عروض الفلاش' },
  { href: '/admin/marketing', icon: MegaphoneIcon, label: 'التسويق' },
  { href: '/admin/settings', icon: Cog6ToothIcon, label: 'الإعدادات' },
]

// Bottom nav shows only top 4 links + menu button
const BOTTOM_NAV = [
  { href: '/admin/dashboard', icon: HomeIcon, label: 'الرئيسية' },
  { href: '/admin/orders', icon: InboxIcon, label: 'الطلبات' },
  { href: '/admin/products', icon: ShoppingBagIcon, label: 'المنتجات' },
  { href: '/admin/settings', icon: Cog6ToothIcon, label: 'الإعدادات' },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)

  if (pathname === '/admin/login') return null

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  return (
    <>
      {/* ── Desktop Sidebar ─────────────────────────────── */}
      <aside className="admin-sidebar py-6 flex-col hidden md:flex">
        <div className="px-6 mb-8 text-center">
          <Link href="/" target="_blank" className="inline-block">
            <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center text-white font-bold font-en text-xl mb-2 shadow-lg" style={{ background: 'var(--primary)' }}>BD</div>
            <h2 className="font-en tracking-widest text-[#dcc8b8] text-xs uppercase">Deep Beauty</h2>
            <span className="text-xs opacity-40 block mt-0.5">لوحة التحكم</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto">
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
        <div className="px-3 mt-4 pt-4 border-t border-white/10">
          <button onClick={handleLogout} className="admin-nav-link text-red-300 w-full hover:bg-red-500/10 hover:text-red-200">
            <ArrowRightOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile Top Bar ──────────────────────────────── */}
      <header className="md:hidden fixed top-0 right-0 left-0 z-40 flex items-center justify-between px-4 py-3 shadow-md" style={{ background: '#3a2a1e' }}>
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="فتح القائمة"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>
        <span className="text-white font-bold text-sm tracking-wider font-en">Deep Beauty</span>
        <Link href="/" target="_blank" className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors text-xs">
          المتجر
        </Link>
      </header>

      {/* ── Mobile Drawer ───────────────────────────────── */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Drawer panel */}
          <div className="relative w-72 max-w-[85vw] h-full flex flex-col py-6 shadow-2xl overflow-y-auto" style={{ background: '#3a2a1e' }}>
            <div className="px-5 mb-6 flex items-center justify-between">
              <div>
                <p className="text-white font-bold text-sm font-en tracking-widest">Deep Beauty</p>
                <span className="text-xs opacity-40 text-white">لوحة التحكم</span>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1">
              {NAV_LINKS.map((link) => {
                const isActive = pathname?.startsWith(link.href)
                const Icon = link.icon
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setDrawerOpen(false)}
                    className={`admin-nav-link ${isActive ? 'active' : ''}`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span>{link.label}</span>
                  </Link>
                )
              })}
            </nav>

            <div className="px-3 mt-4 pt-4 border-t border-white/10">
              <button onClick={handleLogout} className="admin-nav-link text-red-300 w-full hover:bg-red-500/10 hover:text-red-200">
                <ArrowRightOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile Bottom Nav ───────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 right-0 left-0 z-40 flex items-center border-t" style={{ background: '#3a2a1e', borderColor: 'rgba(255,255,255,0.1)' }}>
        {BOTTOM_NAV.map((link) => {
          const isActive = pathname?.startsWith(link.href)
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors"
              style={{ color: isActive ? 'var(--primary-light)' : 'rgba(255,255,255,0.5)' }}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{link.label}</span>
            </Link>
          )
        })}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors"
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          <Bars3Icon className="w-5 h-5" />
          <span className="text-[10px] font-medium">المزيد</span>
        </button>
      </nav>
    </>
  )
}
