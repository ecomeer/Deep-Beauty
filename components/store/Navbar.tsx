'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  ShoppingBagIcon,
  Bars3Icon,
  XMarkIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  UserIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline'
import { useCartContext } from '@/context/CartContext'
import { useWishlistContext } from '@/context/WishlistContext'
import EnhancedCartSidebar from './EnhancedCartSidebar'
import CountrySelector from './CountrySelector'

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
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const pathname = usePathname()

  const rafId = useRef<number | null>(null)
  const handleScroll = useCallback(() => {
    if (rafId.current !== null) return
    rafId.current = requestAnimationFrame(() => {
      setScrolled(window.scrollY > 10)
      rafId.current = null
    })
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafId.current !== null) cancelAnimationFrame(rafId.current)
    }
  }, [handleScroll])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
    setSearchOpen(false)
  }, [pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const isActive = (href: string) => pathname === href

  return (
    <>
      {/* ─── Main Nav ─── */}
      <nav
        aria-label="التنقل الرئيسي"
        className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 h-[var(--nav-height)] bg-[var(--off-white)] border-b-2 border-[var(--dark-beige)] ${
          scrolled ? 'shadow-[0_4px_16px_rgba(58,42,30,0.12)]' : 'shadow-[0_1px_6px_rgba(58,42,30,0.06)]'
        }`}
      >
        {/* ── RTL-aware inner container — NO dir override ── */}
        <div className="max-w-[var(--container-max)] mx-auto px-5 h-full flex items-center justify-between">

          {/* ── RIGHT (RTL start): Logo ── */}
          <Link
            href="/"
            aria-label="الصفحة الرئيسية — Deep Beauty"
            className="flex-shrink-0 flex items-center justify-center"
          >
            <Image
              src="/logo.png"
              alt="Deep Beauty"
              width={56}
              height={56}
              priority
              className="object-contain block"
            />
          </Link>

          {/* ── CENTER: Desktop Nav Links ── */}
          <nav aria-label="روابط الموقع" className="hidden md:flex items-center gap-7 text-sm">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`font-medium transition-colors relative py-1 ${
                  isActive(link.href)
                    ? 'text-[var(--primary)]'
                    : 'text-[var(--text-dark)] hover:text-[var(--primary)]'
                }`}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className="absolute -bottom-0.5 inset-x-0 h-0.5 rounded-full bg-[var(--primary)]" />
                )}
              </Link>
            ))}
          </nav>

          {/* ── LEFT (RTL end): Actions ── */}
          <div className="flex items-center gap-0.5">
            {/* Country Selector (desktop) */}
            <div className="hidden md:block me-1">
              <CountrySelector />
            </div>

            {/* Desktop: Account */}
            <Link
              href="/account"
              aria-label="حسابي"
              className="hidden md:flex p-2 rounded-xl hover:bg-[var(--beige)] transition-colors text-[var(--text-dark)]"
            >
              <UserIcon className="w-5 h-5" />
            </Link>

            {/* Desktop: Wishlist */}
            <Link
              href="/wishlist"
              aria-label={`المفضلة${wishlistCount > 0 ? ` (${wishlistCount})` : ''}`}
              className="hidden md:flex relative p-2 rounded-xl hover:bg-[var(--beige)] transition-colors text-[var(--text-dark)]"
            >
              <HeartIcon className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -top-0.5 -left-0.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center bg-rose-500 text-white leading-none"
                >
                  {wishlistCount > 9 ? '9+' : wishlistCount}
                </span>
              )}
            </Link>

            {/* Desktop: Search */}
            <button
              type="button"
              aria-label="البحث"
              aria-expanded={searchOpen ? 'true' : 'false'}
              className={`hidden md:flex p-2 rounded-xl transition-colors ${
                searchOpen
                  ? 'bg-[var(--beige)] text-[var(--primary)]'
                  : 'hover:bg-[var(--beige)] text-[var(--text-dark)]'
              }`}
              onClick={() => setSearchOpen(!searchOpen)}
            >
              <MagnifyingGlassIcon className="w-5 h-5" />
            </button>

            {/* Cart — always visible */}
            <button
              type="button"
              aria-label={`سلة التسوق${totalItems > 0 ? ` (${totalItems} منتجات)` : ''}`}
              onClick={() => setIsOpen(true)}
              className="relative p-2 rounded-xl hover:bg-[var(--beige)] transition-colors text-[var(--text-dark)]"
            >
              <ShoppingBagIcon className="w-5 h-5" />
              {totalItems > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -top-0.5 -left-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-bold flex items-center justify-center text-white leading-none bg-[var(--primary)]"
                >
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </button>

            {/* Hamburger (mobile only) */}
            <button
              type="button"
              aria-label={mobileOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              className="md:hidden p-2 rounded-xl transition-colors hover:bg-[var(--beige)] text-[var(--text-dark)]"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen
                ? <XMarkIcon className="w-5 h-5" />
                : <Bars3Icon className="w-5 h-5" />
              }
            </button>
          </div>
        </div>

        {/* ── Search Bar (slides down, desktop only) ── */}
        {searchOpen && (
          <div className="hidden md:block border-t border-[var(--beige)] bg-white px-5 py-3">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (searchQuery.trim()) {
                  window.location.href = `/products?search=${encodeURIComponent(searchQuery.trim())}`
                }
              }}
              className="max-w-lg mx-auto relative"
            >
              <MagnifyingGlassIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--primary)]" />
              <input
                type="search"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحثي عن منتج..."
                className="w-full pr-11 pl-4 py-2.5 rounded-xl text-sm outline-none border border-[var(--beige)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10 transition-all bg-[var(--off-white)]"
              />
            </form>
          </div>
        )}
      </nav>

      {/* ─── Mobile Menu Overlay ─── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden backdrop-blur-sm"
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ─── Mobile Menu Drawer ─── */}
      <aside
        id="mobile-menu"
        aria-label="القائمة المتنقلة"
        aria-hidden={mobileOpen ? 'false' : 'true'}
        className={`fixed top-[var(--nav-height)] inset-x-0 z-40 md:hidden transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-y-0 visible' : '-translate-y-full pointer-events-none invisible'
        }`}
      >
        <div className="bg-white shadow-xl border-b border-[var(--beige)] pb-4">
          {/* Search */}
          <div className="px-5 pt-4 pb-3 border-b border-[var(--beige)]">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (searchQuery.trim()) {
                  window.location.href = `/products?search=${encodeURIComponent(searchQuery.trim())}`
                }
              }}
              className="relative"
            >
              <MagnifyingGlassIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحثي عن منتج..."
                className="w-full pr-11 pl-4 py-2.5 rounded-xl text-sm outline-none border border-[var(--beige)] focus:border-[var(--primary)] bg-[var(--off-white)] transition-all"
              />
            </form>
          </div>

          {/* Nav Links */}
          <nav className="px-4 pt-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center justify-between px-4 py-3 rounded-xl mb-1 text-sm font-medium transition-all ${
                  isActive(link.href)
                    ? 'bg-[var(--beige)] text-[var(--primary)]'
                    : 'text-[var(--text-dark)] hover:bg-[var(--off-white)]'
                }`}
              >
                {link.label}
                <ChevronDownIcon className="w-4 h-4 rotate-90 opacity-40" />
              </Link>
            ))}
          </nav>

          <div className="mx-5 my-2 h-px bg-[var(--beige)]" />

          <div className="px-4">
            <Link
              href="/wishlist"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[var(--text-dark)] hover:bg-[var(--off-white)] transition-all"
            >
              <HeartIcon className="w-5 h-5 text-[var(--primary)]" />
              المفضلة
              {wishlistCount > 0 && (
                <span className="ms-auto bg-rose-100 text-rose-600 text-xs font-bold px-2 py-0.5 rounded-full">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <Link
              href="/account"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[var(--text-dark)] hover:bg-[var(--off-white)] transition-all"
            >
              <UserIcon className="w-5 h-5 text-[var(--primary)]" />
              حسابي
            </Link>
          </div>

          <div className="mx-5 my-2 h-px bg-[var(--beige)]" />

          <div className="px-5 pb-2">
            <p className="text-[10px] text-[var(--on-surface-variant)] uppercase tracking-wider font-semibold mb-2">الدولة / العملة</p>
            <CountrySelector />
          </div>
        </div>
      </aside>

      <EnhancedCartSidebar />
    </>
  )
}
