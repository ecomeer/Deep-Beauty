'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ShoppingBagIcon,
  HeartIcon,
  MapPinIcon,
  BellIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  PencilIcon,
  CubeIcon,
  ChevronLeftIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface User {
  id: string
  name: string
  email: string
  phone?: string
}

interface Order {
  id: string
  order_number: string
  total: number
  status: string
  created_at: string
  item_count: number
}

const MENU_ITEMS = [
  { icon: ShoppingBagIcon, label: 'طلباتي',     href: '/account/orders',        color: '#3B82F6' },
  { icon: HeartIcon,        label: 'المفضلة',    href: '/wishlist',              color: '#F43F5E' },
  { icon: MapPinIcon,       label: 'عناويني',    href: '/account/addresses',     color: '#22C55E' },
  { icon: BellIcon,         label: 'الإشعارات',  href: '/account/notifications', color: '#F59E0B' },
  { icon: Cog6ToothIcon,    label: 'الإعدادات',  href: '/account/settings',      color: '#6B7280' },
]

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  delivered: { label: 'تم التوصيل',   bg: '#DCFCE7', color: '#16A34A' },
  shipped:   { label: 'تم الشحن',     bg: '#DBEAFE', color: '#1D4ED8' },
  pending:   { label: 'قيد المعالجة', bg: '#FEF3C7', color: '#B45309' },
  cancelled: { label: 'ملغى',         bg: '#FEE2E2', color: '#DC2626' },
}

export default function AccountPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalOrders: 0, totalSpent: 0, wishlistCount: 0 })

  useEffect(() => { fetchUserData() }, [])

  async function fetchUserData() {
    try {
      const userRes = await fetch('/api/auth/me')
      if (!userRes.ok) { router.push('/login'); return }
      const userData = await userRes.json()
      setUser(userData.user)

      const [ordersRes, statsRes] = await Promise.all([
        fetch('/api/account/orders?limit=3'),
        fetch('/api/account/stats'),
      ])
      const ordersData = await ordersRes.json()
      const statsData  = await statsRes.json()
      setRecentOrders(ordersData.orders || [])
      setStats(statsData)
    } catch {
      toast.error('حدث خطأ أثناء تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      toast.success('تم تسجيل الخروج بنجاح')
      router.push('/')
    } catch {
      toast.error('حدث خطأ أثناء تسجيل الخروج')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--off-white)', paddingTop: 'var(--nav-height)' }}>
        <div className="w-10 h-10 rounded-full border-4 animate-spin" style={{ borderColor: 'var(--beige)', borderTopColor: 'var(--primary)' }} />
      </div>
    )
  }

  if (!user) return null

  const initials = user.name ? user.name.slice(0, 2) : '؟'

  return (
    <div className="min-h-screen" style={{ background: 'var(--off-white)', paddingTop: 'var(--nav-height)' }}>

      {/* Hero strip */}
      <div style={{ background: 'linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 100%)' }}>
        <div className="max-w-2xl mx-auto px-4 pt-6 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.22)' }}
            >
              {initials}
            </div>
            <div>
              <h1 className="font-bold text-white text-base leading-tight">{user.name}</h1>
              <p className="text-white/70 text-xs mt-0.5 truncate max-w-[180px]">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/account/settings" className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
              <PencilIcon className="w-4 h-4 text-white" />
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-2xl mx-auto px-4 pb-5 grid grid-cols-3 gap-3 mt-2">
          {[
            { val: stats.totalOrders,                     label: 'طلب' },
            { val: Number(stats.totalSpent).toFixed(3),   label: 'د.ك' },
            { val: stats.wishlistCount,                    label: 'مفضلة' },
          ].map(({ val, label }) => (
            <div key={label} className="text-center rounded-2xl py-3" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <p className="text-white font-bold text-xl leading-none">{val}</p>
              <p className="text-white/70 text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">

        {/* Menu */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl overflow-hidden"
          style={{ border: '1px solid var(--beige)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        >
          {MENU_ITEMS.map((item, i) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors"
              style={{ borderBottom: i < MENU_ITEMS.length - 1 ? '1px solid var(--beige)' : 'none' }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: item.color + '1A' }}>
                <item.icon className="w-5 h-5" style={{ color: item.color }} />
              </div>
              <span className="flex-1 font-medium text-sm" style={{ color: 'var(--text-dark)' }}>{item.label}</span>
              <ChevronLeftIcon className="w-4 h-4" style={{ color: 'var(--on-surface-variant)' }} />
            </Link>
          ))}
        </motion.div>

        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="bg-white rounded-2xl overflow-hidden"
          style={{ border: '1px solid var(--beige)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        >
          <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: '1px solid var(--beige)' }}>
            <div className="flex items-center gap-2">
              <CubeIcon className="w-5 h-5" style={{ color: 'var(--primary)' }} />
              <h3 className="font-bold text-sm" style={{ color: 'var(--text-dark)' }}>آخر الطلبات</h3>
            </div>
            <Link href="/account/orders" className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--primary)' }}>
              عرض الكل <ChevronLeftIcon className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="py-10 text-center">
              <ShoppingBagIcon className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--dark-beige)' }} />
              <p className="text-sm mb-4" style={{ color: 'var(--on-surface-variant)' }}>لا توجد طلبات بعد</p>
              <Link href="/products" className="inline-block px-5 py-2 rounded-xl text-sm font-bold text-white" style={{ background: 'var(--primary)' }}>
                تسوقي الآن
              </Link>
            </div>
          ) : (
            <div>
              {recentOrders.map((order, i) => {
                const st = STATUS_MAP[order.status] || STATUS_MAP.pending
                return (
                  <div
                    key={order.id}
                    className="flex items-center gap-3 px-4 py-3.5"
                    style={{ borderBottom: i < recentOrders.length - 1 ? '1px solid var(--beige)' : 'none' }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--beige)' }}>
                      <CubeIcon className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm" style={{ color: 'var(--text-dark)' }} dir="ltr">{order.order_number}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--on-surface-variant)' }}>{order.item_count} منتجات</p>
                    </div>
                    <div className="text-left flex-shrink-0">
                      <p className="font-bold text-sm mb-1" style={{ color: 'var(--text-dark)' }} dir="ltr">{order.total} د.ك</p>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* Logout */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          onClick={handleLogout}
          className="w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-colors hover:opacity-90"
          style={{ border: '1.5px solid #FCA5A5', color: '#DC2626', background: '#FFF1F2' }}
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          تسجيل الخروج
        </motion.button>

      </div>
    </div>
  )
}
