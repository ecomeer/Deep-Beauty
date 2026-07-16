/* eslint-disable @typescript-eslint/no-explicit-any */
// Shared jsdom mock factories for Next.js / animation modules that don't
// render meaningfully in tests. Each factory is passed to vi.mock() by the
// importing test file (vi.mock calls are hoisted, so the factories must be
// required lazily inside them).
import React from 'react'

const MOTION_PROPS = new Set([
  'variants',
  'initial',
  'animate',
  'exit',
  'transition',
  'whileHover',
  'whileTap',
  'layout',
])

function stripMotionProps(props: Record<string, unknown>) {
  const clean: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(props)) {
    if (!MOTION_PROPS.has(key)) clean[key] = value
  }
  return clean
}

/** framer-motion → plain elements; AnimatePresence renders children. */
export function framerMotionMock() {
  // Cache one component per tag: returning a fresh function on every
  // `motion.div` access would change the element type each render and make
  // React remount the whole subtree (detaching nodes tests hold onto).
  const cache = new Map<string, React.ComponentType<any>>()
  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: new Proxy(
      {},
      {
        get(_t, tag: string) {
          if (!cache.has(tag)) {
            const Component = ({ children, ...props }: any) =>
              React.createElement(tag, stripMotionProps(props), children)
            cache.set(tag, Component)
          }
          return cache.get(tag)
        },
      }
    ),
  }
}

/** next/image → plain <img>. */
export function nextImageMock() {
  return {
    default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
  }
}

/** next/link → plain <a>. */
export function nextLinkMock() {
  return {
    default: ({ href, children, ...props }: any) => (
      <a href={href} {...props}>
        {children}
      </a>
    ),
  }
}
