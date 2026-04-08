'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBagIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { useCartContext } from '@/context/CartContext'
import CartSidebar from './CartSidebar'

const NAV_LINKS = [
  { href: '/products', label: 'المنتجات' },
  { href: '/about', label: 'من نحن' },
  { href: '/#contact', label: 'تواصل معنا' },
]

export default function Navbar() {
  const { totalItems, setIsOpen } = useCartContext()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [lang, setLang] = useState<'ar' | 'en'>('ar')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <nav className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
        scrolled ? 'shadow-md' : 'shadow-sm'
      } bg-white`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center flex-shrink-0">
            <Image
              src="/logo-horizontal.png"
              alt="Deep Beauty"
              width={400}
              height={100}
              priority
              className="object-contain"
              style={{ height: '44px', width: 'auto' }}
            />
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="navbar-link">
                {link.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <button
              type="button"
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors hover:border-[#9C6644] hover:text-[#9C6644]"
              style={{ borderColor: 'var(--dark-beige)', color: 'var(--text-dark)' }}
              aria-label="تغيير اللغة"
            >
              {lang === 'ar' ? 'EN' : 'عر'}
            </button>

            {/* Cart */}
            <button
              type="button"
              aria-label="فتح سلة التسوق"
              onClick={() => setIsOpen(true)}
              className="relative p-2 rounded-xl transition-all duration-200 hover:bg-[#EEE0D5]"
            >
              <ShoppingBagIcon className="w-6 h-6" style={{ color: 'var(--text-dark)' }} />
              {totalItems > 0 && (
                <span className="cart-badge">{totalItems}</span>
              )}
            </button>

            {/* Mobile Toggle */}
            <button
              type="button"
              aria-label={mobileOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
              className="md:hidden p-2 rounded-xl transition-colors hover:bg-[#EEE0D5]"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen
                ? <XMarkIcon className="w-6 h-6" style={{ color: 'var(--text-dark)' }} />
                : <Bars3Icon className="w-6 h-6" style={{ color: 'var(--text-dark)' }} />
              }
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="mobile-menu">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="mobile-nav-link"
              >
                {link.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="mobile-nav-link text-right w-full"
            >
              {lang === 'ar' ? '🌐 English' : '🌐 العربية'}
            </button>
          </div>
        )}
      </nav>

      <CartSidebar />
    </>
  )
}
