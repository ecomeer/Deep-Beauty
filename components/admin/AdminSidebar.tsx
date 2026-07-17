'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

import {
  HomeIcon,
  ShoppingBagIcon,
  InboxIcon,
  UsersIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
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
  TagIcon,
  ShoppingCartIcon,
  UserGroupIcon,
  PaperAirplaneIcon,
  ChatBubbleLeftEllipsisIcon,
} from '@heroicons/react/24/outline'
import type { Permission } from '@/lib/admin-permissions'

// ─── Navigation structure ─────────────────────────────────────────────────
// `permission` gates a link for 'staff' accounts (undefined = always
// visible to any authenticated admin/staff). Full admins always see
// everything, regardless of `permission`.
const NAV_GROUPS: { label: string; links: { href: string; icon: React.ElementType; label: string; badgeKey?: string; permission?: Permission; adminOnly?: boolean }[] }[] = [
  {
    label: 'الرئيسي',
    links: [
      { href: '/admin/dashboard', icon: HomeIcon,     label: 'نظرة عامة' },
      { href: '/admin/orders',    icon: InboxIcon,    label: 'الطلبات',   badgeKey: 'pendingOrders', permission: 'orders' },
      { href: '/admin/stats',     icon: ChartBarIcon, label: 'الإحصائيات' },
    ],
  },
  {
    label: 'المتجر',
    links: [
      { href: '/admin/products',   icon: ShoppingBagIcon, label: 'المنتجات', permission: 'products' },
      { href: '/admin/categories', icon: Squares2X2Icon,  label: 'الفئات',   permission: 'products' },
      { href: '/admin/banners',    icon: PhotoIcon,        label: 'البنرات',  permission: 'products' },
      { href: '/admin/reviews',    icon: StarIcon,         label: 'التقييمات', permission: 'reviews' },
    ],
  },
  {
    label: 'العملاء',
    links: [
      { href: '/admin/customers',   icon: UsersIcon,    label: 'العملاء',    permission: 'customers' },
      { href: '/admin/newsletter',  icon: EnvelopeIcon, label: 'المشتركون',  permission: 'customers' },
    ],
  },
  {
    label: 'التسويق',
    links: [
      { href: '/admin/flash-sales', icon: BoltIcon,       label: 'عروض الفلاش', permission: 'marketing' },
      { href: '/admin/marketing',   icon: MegaphoneIcon,  label: 'التسويق',     permission: 'marketing' },
      { href: '/admin/marketing/campaigns', icon: PaperAirplaneIcon, label: 'الحملات', permission: 'marketing' },
      { href: '/admin/marketing/coupons', icon: TagIcon,   label: 'الكوبونات',  permission: 'marketing' },
      { href: '/admin/abandoned-carts', icon: ShoppingCartIcon, label: 'السلات المهملة', permission: 'marketing' },
      { href: '/admin/newsletter', icon: EnvelopeIcon, label: 'المشتركون', permission: 'marketing' },
      { href: '/admin/contact-messages', icon: ChatBubbleLeftEllipsisIcon, label: 'رسائل التواصل', permission: 'marketing' },
    ],
  },
  {
    label: 'الإعدادات',
    links: [
      { href: '/admin/shipping', icon: TruckIcon,       label: 'الشحن',       permission: 'settings' },
      { href: '/admin/settings', icon: Cog6ToothIcon,   label: 'الإعدادات',   permission: 'settings' },
      { href: '/admin/team',     icon: UserGroupIcon,   label: 'الفريق',      adminOnly: true },
    ],
  },
]

// Bottom nav quick links
const BOTTOM_NAV = [
  { href: '/admin/dashboard', icon: HomeIcon,        label: 'الرئيسية' },
  { href: '/admin/orders',    icon: InboxIcon,       label: 'الطلبات' },
  { href: '/admin/products',  icon: ShoppingBagIcon, label: 'المنتجات' },
  { href: '/admin/settings',  icon: Cog6ToothIcon,   label: 'الإعدادات' },
]

interface Badges { pendingOrders?: number }

// ─── NavLink component ────────────────────────────────────────────────────
function NavLink({
  href, icon: Icon, label, isActive, badge, onClick,
}: {
  href: string; icon: React.ElementType; label: string
  isActive: boolean; badge?: number; onClick?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl mx-2 mb-0.5 text-sm font-medium transition-all duration-200 ${
        isActive ? 'bg-primary text-white' : 'text-white/[0.62] hover:bg-white/[0.08]'
      }`}
    >
      <Icon className="w-4.5 h-4.5 flex-shrink-0 w-[18px] h-[18px]" />
      <span className="flex-1 leading-none">{label}</span>
      {badge != null && badge > 0 && (
        <span
          className="min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center"
          style={{ background: isActive ? 'rgba(255,255,255,0.25)' : 'var(--primary)', color: 'white' }}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────
export default function AdminSidebar() {
  const pathname  = usePathname()
  const router    = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [badges, setBadges]         = useState<Badges>({})
  const [role, setRole]             = useState<'admin' | 'staff'>('admin')
  const [permissions, setPermissions] = useState<Permission[]>([])

  // Fetch current admin's role/permissions once, so staff accounts only see
  // nav items they're actually authorized for.
  useEffect(() => {
    fetch('/api/admin/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.role === 'staff') {
          setRole('staff')
          setPermissions(d.permissions ?? [])
        }
      })
      .catch(() => {})
  }, [])

  const canSee = (link: { permission?: Permission; adminOnly?: boolean }) => {
    if (role === 'admin') return true
    if (link.adminOnly) return false
    return !link.permission || permissions.includes(link.permission)
  }

  // Fetch badge counts once on mount, then every 2 minutes — NOT on every navigation
  useEffect(() => {
    const load = () => {
      fetch('/api/admin/dashboard')
        .then(r => r.ok ? r.json() : null)
        .then(d => d?.stats && setBadges({ pendingOrders: d.stats.pendingOrders || 0 }))
        .catch(() => {})
    }
    load()
    const interval = setInterval(load, 2 * 60 * 1000) // refresh every 2 min
    return () => clearInterval(interval)
  }, []) // empty deps — runs once, not on every nav

  if (pathname === '/admin/login') return null

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  const SIDEBAR_BG = '#2a1d13'

  // ── Sidebar Nav Content ─────────────────────────────────────────────────
  // Rendered via function call (not <Component/>) so React doesn't remount
  // the subtree on every render of AdminSidebar
  const renderSidebarContent = (onLinkClick?: () => void) => {
    return (
      <>
        {/* Logo */}
        <div className="px-4 mb-6 pt-1">
          <Link href="/" target="_blank" className="flex items-center gap-3 group">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md bg-primary"
            >
              <span className="text-white font-bold text-sm tracking-widest">BD</span>
            </div>
            <div>
              <p className="text-white font-bold text-sm tracking-wider leading-tight">Deep Beauty</p>
              <span className="text-[10px] opacity-35 text-white">لوحة التحكم</span>
            </div>
          </Link>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 overflow-y-auto px-1 pb-4" style={{ scrollbarWidth: 'none' }}>
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-4">
              <p
                className="px-5 mb-1.5 text-[11px] font-bold uppercase tracking-[0.16em]"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                {group.label}
              </p>
              {group.links.filter(canSee).map((link) => {
                const badgeVal = link.badgeKey ? badges[link.badgeKey as keyof Badges] : undefined
                return (
                  <NavLink
                    key={link.href}
                    href={link.href}
                    icon={link.icon}
                    label={link.label}
                    isActive={!!pathname?.startsWith(link.href)}
                    badge={badgeVal}
                    onClick={onLinkClick}
                  />
                )
              })}
            </div>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="mx-2 mb-2 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm transition-all text-white/45 hover:bg-white/[0.06] hover:text-white/75"
          >
            <ShoppingBagIcon className="w-[18px] h-[18px] flex-shrink-0" />
            <span>عرض المتجر</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-red-500/70 hover:bg-red-500/10 hover:text-red-500/90"
          >
            <ArrowRightOnRectangleIcon className="w-[18px] h-[18px] flex-shrink-0" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      {/* ── Desktop Sidebar ───────────────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col w-[230px] flex-shrink-0 min-h-screen py-5"
        style={{ background: SIDEBAR_BG }}
      >
        {renderSidebarContent()}
      </aside>

      {/* ── Mobile Top Bar ────────────────────────────────────────────── */}
      <header
        className="md:hidden fixed top-0 right-0 left-0 z-40 flex items-center justify-between px-4 py-3 shadow-lg"
        style={{ background: SIDEBAR_BG }}
      >
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-2 rounded-xl transition-colors"
          style={{ color: 'rgba(255,255,255,0.7)' }}
          aria-label="فتح القائمة"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-sm tracking-wider">Deep Beauty</span>
          {badges.pendingOrders != null && badges.pendingOrders > 0 && (
            <span className="min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center text-white bg-primary">
              {badges.pendingOrders}
            </span>
          )}
        </div>

        <Link
          href="/"
          target="_blank"
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
        >
          المتجر
        </Link>
      </header>

      {/* ── Mobile Drawer ─────────────────────────────────────────────── */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div
            className="relative w-[260px] max-w-[85vw] h-full flex flex-col py-5 shadow-2xl overflow-hidden"
            style={{ background: SIDEBAR_BG }}
          >
            <button
              onClick={() => setDrawerOpen(false)}
              className="absolute top-4 left-4 p-1.5 rounded-lg transition-colors"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
            {renderSidebarContent(() => setDrawerOpen(false))}
          </div>
        </div>
      )}

      {/* ── Mobile Bottom Nav ─────────────────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 right-0 left-0 z-40 flex items-center border-t safe-area-bottom"
        style={{ background: SIDEBAR_BG, borderColor: 'rgba(255,255,255,0.08)' }}
      >
        {BOTTOM_NAV.map((link) => {
          const isActive = pathname?.startsWith(link.href)
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex-1 flex flex-col items-center gap-1 py-3 transition-colors"
              style={{ color: isActive ? 'var(--primary-light)' : 'rgba(255,255,255,0.4)' }}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{link.label}</span>
            </Link>
          )
        })}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex-1 flex flex-col items-center gap-1 py-3 relative"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          <span className="relative">
            <Bars3Icon className="w-5 h-5" />
            {badges.pendingOrders != null && badges.pendingOrders > 0 && (
              <span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[8px] font-bold flex items-center justify-center text-white bg-primary"
              >
                {badges.pendingOrders > 9 ? '9+' : badges.pendingOrders}
              </span>
            )}
          </span>
          <span className="text-[10px] font-medium">المزيد</span>
        </button>
      </nav>
    </>
  )
}
