declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
    snaptr?: (...args: unknown[]) => void
  }
}

function pushDataLayer(event: string, data: Record<string, unknown>) {
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event, ...data })
}

export function trackViewContent(product: { id: string; name_ar: string; price: number }) {
  if (typeof window === 'undefined') return
  window.fbq?.('track', 'ViewContent', {
    content_ids: [product.id],
    content_name: product.name_ar,
    content_type: 'product',
    value: product.price,
    currency: 'KWD',
  })
  window.snaptr?.('track', 'VIEW_CONTENT', {
    item_ids: [product.id],
    price: product.price,
    currency: 'KWD',
  })
  window.gtag?.('event', 'view_item', {
    items: [{ item_id: product.id, item_name: product.name_ar, price: product.price }],
  })
  pushDataLayer('view_item', {
    items: [{ item_id: product.id, item_name: product.name_ar, price: product.price }],
  })
}

export function trackAddToCart(product: { id: string; name_ar: string; price: number; quantity: number }) {
  if (typeof window === 'undefined') return
  window.fbq?.('track', 'AddToCart', {
    content_ids: [product.id],
    content_name: product.name_ar,
    content_type: 'product',
    value: product.price * product.quantity,
    currency: 'KWD',
  })
  window.snaptr?.('track', 'ADD_CART', {
    item_ids: [product.id],
    price: product.price * product.quantity,
    currency: 'KWD',
  })
  window.gtag?.('event', 'add_to_cart', {
    items: [{ item_id: product.id, item_name: product.name_ar, price: product.price, quantity: product.quantity }],
  })
  pushDataLayer('add_to_cart', {
    items: [{ item_id: product.id, item_name: product.name_ar, price: product.price, quantity: product.quantity }],
  })
}

export function trackInitiateCheckout(value: number, numItems: number) {
  if (typeof window === 'undefined') return
  window.fbq?.('track', 'InitiateCheckout', { value, currency: 'KWD', num_items: numItems })
  window.snaptr?.('track', 'START_CHECKOUT', { price: value, currency: 'KWD', number_items: numItems })
  window.gtag?.('event', 'begin_checkout', { value, currency: 'KWD' })
  pushDataLayer('begin_checkout', { value, currency: 'KWD', num_items: numItems })
}

export function trackPurchase(orderId: string, value: number, items: { id: string; name: string; price: number; quantity: number }[]) {
  if (typeof window === 'undefined') return
  // Guard against double-firing: store orderId in sessionStorage
  const key = `purchase_fired_${orderId}`
  if (sessionStorage.getItem(key)) return
  sessionStorage.setItem(key, '1')

  window.fbq?.('track', 'Purchase', { value, currency: 'KWD', order_id: orderId })
  window.snaptr?.('track', 'PURCHASE', {
    price: value,
    currency: 'KWD',
    transaction_id: orderId,
    item_ids: items.map(i => i.id),
  })
  window.gtag?.('event', 'purchase', {
    transaction_id: orderId,
    value,
    currency: 'KWD',
    items: items.map(i => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity })),
  })
  pushDataLayer('purchase', {
    transaction_id: orderId,
    value,
    currency: 'KWD',
    items: items.map(i => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity })),
  })
}
