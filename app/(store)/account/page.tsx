'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  UserIcon,
  ShoppingBagIcon,
  HeartIcon,
  MapPinIcon,
  BellIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  PencilIcon,
  CubeIcon,
  ChevronLeftIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface User {
  id: string
  name: string
  email: string
  phone: string
  avatar?: string
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
  { icon: ShoppingBagIcon, label: 'طلباتي', href: '/account/orders', color: 'bg-blue-500' },
  { icon: HeartIcon, label: 'المفضلة', href: '/wishlist', color: 'bg-rose-500' },
  { icon: MapPinIcon, label: 'عناويني', href: '/account/addresses', color: 'bg-green-500' },
  { icon: BellIcon, label: 'الإشعارات', href: '/account/notifications', color: 'bg-amber-500' },
  { icon: Cog6ToothIcon, label: 'الإعدادات', href: '/account/settings', color: 'bg-gray-500' },
]

export default function AccountPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    wishlistCount: 0
  })

  useEffect(() => {
    fetchUserData()
  }, [])

  async function fetchUserData() {
    try {
      const userRes = await fetch('/api/auth/me')
      if (!userRes.ok) {
        router.push('/login')
        return
      }
      const userData = await userRes.json()
      setUser(userData.user)

      // Fetch recent orders
      const ordersRes = await fetch('/api/account/orders?limit=3')
      const ordersData = await ordersRes.json()
      setRecentOrders(ordersData.orders || [])

      // Fetch stats
      const statsRes = await fetch('/api/account/stats')
      const statsData = await statsRes.json()
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-[#9C6644] border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">حسابي</h1>
              <p className="text-gray-500 text-sm mt-1">إدارة حسابك وطلباتك</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              <span className="hidden sm:inline">تسجيل الخروج</span>
            </motion.button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 shadow-sm mb-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#9C6644] to-[#D4A574] flex items-center justify-center text-white text-2xl font-bold">
                  {user.name?.[0] || <UserIcon className="w-8 h-8" />}
                </div>
                <div className="flex-1">
                  <h2 className="font-bold text-lg">{user.name}</h2>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
                <Link href="/account/settings">
                  <PencilIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                </Link>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-3 gap-2 mb-4"
            >
              <div className="bg-white rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-[#9C6644]">{stats.totalOrders}</p>
                <p className="text-xs text-gray-500">طلب</p>
              </div>
              <div className="bg-white rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-green-600">{stats.totalSpent}</p>
                <p className="text-xs text-gray-500">د.ك</p>
              </div>
              <div className="bg-white rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-rose-500">{stats.wishlistCount}</p>
                <p className="text-xs text-gray-500">مفضلة</p>
              </div>
            </motion.div>

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-sm overflow-hidden"
            >
              {MENU_ITEMS.map((item, i) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors border-b last:border-b-0"
                >
                  <div className={`w-10 h-10 rounded-xl ${item.color} bg-opacity-10 flex items-center justify-center`}>
                    <item.icon className={`w-5 h-5 ${item.color.replace('bg-', 'text-')}`} />
                  </div>
                  <span className="flex-1 font-medium">{item.label}</span>
                  <ChevronLeftIcon className="w-5 h-5 text-gray-400" />
                </Link>
              ))}
            </motion.div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Recent Orders */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-sm"
            >
              <div className="p-6 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CubeIcon className="w-6 h-6 text-[#9C6644]" />
                  <h3 className="font-bold text-lg">آخر الطلبات</h3>
                </div>
                <Link href="/account/orders" className="text-[#9C6644] text-sm hover:underline flex items-center gap-1">
                  عرض الكل
                  <ChevronLeftIcon className="w-4 h-4" />
                </Link>
              </div>

              {recentOrders.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <ShoppingBagIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 mb-4">لا توجد طلبات بعد</p>
                  <Link href="/products" className="btn-primary inline-block px-6 py-2">
                    تسوق الآن
                  </Link>
                </div>
              ) : (
                <div className="divide-y">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#F5EBE0] flex items-center justify-center">
                          <CubeIcon className="w-6 h-6 text-[#9C6644]" />
                        </div>
                        <div>
                          <p className="font-bold">{order.order_number}</p>
                          <p className="text-sm text-gray-500">{order.item_count} منتجات</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="font-bold">{order.total} د.ك</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                          order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {order.status === 'delivered' ? 'تم التوصيل' :
                           order.status === 'shipped' ? 'تم الشحن' : 'قيد المعالجة'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Promo Banner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-r from-[#9C6644] to-[#D4A574] rounded-2xl p-6 text-white"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <SparklesIcon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">عروض حصرية لأعضائنا</h3>
                  <p className="text-white/80 text-sm">احصلي على خصم 15% على طلبك القادم</p>
                </div>
                <Link href="/products" className="px-4 py-2 bg-white text-[#9C6644] rounded-xl font-bold text-sm hover:bg-white/90 transition-colors">
                  تسوقي الآن
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
