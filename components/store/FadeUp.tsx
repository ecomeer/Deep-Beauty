'use client'

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'

/**
 * Scroll-into-view fade-up reveal (replaces framer-motion's whileInView
 * fadeUp variant on the homepage so framer-motion stays out of the
 * homepage bundle). Animates once, with the same values the old variant
 * used: from opacity 0 / y 24px, -40px viewport margin.
 */
export default function FadeUp({
  children,
  className,
  style,
  duration = 0.55,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
  duration?: number
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '-40px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(24px)',
        transition: `opacity ${duration}s ${EASE} ${delay}s, transform ${duration}s ${EASE} ${delay}s`,
      }}
    >
      {children}
    </div>
  )
}
