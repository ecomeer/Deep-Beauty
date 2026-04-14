'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingBagIcon, Bars3Icon, XMarkIcon, HeartIcon, MagnifyingGlassIcon, UserIcon } from '@heroicons/react/24/outline'
import { useCartContext } from '@/context/CartContext'
import { useWishlistContext } from '@/context/WishlistContext'
import EnhancedCartSidebar from './EnhancedCartSidebar'
import CountrySelector from './CountrySelector'
import CurrencySelector from './CurrencySelector'

const NAV_LINKS = [
  { href: '/products', label: 'المنتجات' },
  { href: '/about', label: 'من نحن' },
  { href: '/track', label: 'تتبع الطلب' },
]

export default function Navbar() {
  const { totalItems, setIsOpen } = useCartContext()
  const { totalItems: wishlistCount } = useWishlistContext()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <nav className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
        scrolled ? 'glass-nav shadow-sm' : 'bg-surface'
      }`}>
        {/* dir="ltr" keeps layout consistent regardless of page dir */}
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between" dir="ltr">

          {/* LEFT: mobile hamburger + desktop icons */}
          <div className="flex items-center gap-1">
            {/* Mobile Toggle */}
            <button
              type="button"
              aria-label={mobileOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
              className="md:hidden p-2 rounded-xl transition-colors hover:bg-surface-container"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen
                ? <XMarkIcon className="w-6 h-6 text-on-surface" />
                : <Bars3Icon className="w-6 h-6 text-on-surface" />
              }
            </button>

            {/* Desktop: Search */}
            <button className="hidden md:flex p-2 rounded-full hover:bg-surface-container transition-colors">
              <MagnifyingGlassIcon className="w-5 h-5 text-on-surface" />
            </button>
            {/* Desktop: Wishlist */}
            <Link href="/wishlist" className="hidden md:flex relative p-2 rounded-full hover:bg-surface-container transition-colors" aria-label="المفضلة">
              <HeartIcon className="w-5 h-5 text-on-surface" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center bg-primary text-white">{wishlistCount}</span>
              )}
            </Link>
            {/* Desktop: Account */}
            <Link href="/account" className="hidden md:flex p-2 rounded-full hover:bg-surface-container transition-colors">
              <UserIcon className="w-5 h-5 text-on-surface" />
            </Link>
            {/* Cart — always visible */}
            <button
              type="button"
              aria-label="فتح سلة التسوق"
              onClick={() => setIsOpen(true)}
              className="relative p-2 rounded-full hover:bg-surface-container transition-colors"
            >
              <ShoppingBagIcon className="w-5 h-5 text-on-surface" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white" style={{ background: 'var(--primary)' }}>
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </button>
            {/* Desktop: Country Selector */}
            <div className="hidden md:block">
              <CountrySelector />
            </div>

            {/* Desktop: EN/AR */}
            <div className="hidden md:block bg-surface-container-high px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest cursor-pointer hover:bg-surface-variant transition-colors ms-2">
              EN/AR
            </div>
          </div>

          {/* CENTER: Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8 text-sm" dir="rtl">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-on-surface font-body hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* RIGHT: Logo — wrapper clips whitespace, image scaled so logo fills 52px */}
          <Link href="/" className="flex-shrink-0 flex items-center justify-center overflow-hidden" style={{ width: '140px', height: '52px' }}>
            <img
              src="/logo.png"
              alt="Deep Beauty"
              style={{ width: '104px', height: '104px', objectFit: 'contain', flexShrink: 0 }}
            />
          </Link>

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
            <div className="border-t border-outline-variant my-2 mx-6" />
            <Link
              href="/wishlist"
              onClick={() => setMobileOpen(false)}
              className="mobile-nav-link flex items-center gap-3"
            >
              <HeartIcon className="w-5 h-5" />
              المفضلة {wishlistCount > 0 && `(${wishlistCount})`}
            </Link>
            <Link
              href="/account"
              onClick={() => setMobileOpen(false)}
              className="mobile-nav-link flex items-center gap-3"
            >
              <UserIcon className="w-5 h-5" />
              حسابي
            </Link>
            <div className="border-t border-outline-variant my-2 mx-6" />
            {/* Country Selector in mobile menu */}
            <div className="px-6 py-2">
              <p className="text-xs text-on-surface-variant mb-2 opacity-60">الدولة / العملة</p>
              <CountrySelector />
            </div>
          </div>
        )}
      </nav>

      <EnhancedCartSidebar />
    </>
  )
}
