export interface Product {
  id: string
  name_ar: string
  name_en: string
  slug: string
  description_ar?: string
  description_en?: string
  price: number
  compare_price?: number
  images: string[]
  category?: string
  stock_quantity: number
  is_active: boolean
  is_featured: boolean
  weight_grams?: number
  ingredients_ar?: string
  ingredients_en?: string
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name_ar: string
  name_en: string
  slug: string
  is_active: boolean
  image_url?: string
}

export interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_email?: string
  customer_phone: string
  address_line1: string
  address_area: string
  address_block?: string
  address_street?: string
  address_house?: string
  notes?: string
  subtotal: number
  shipping_cost: number
  total: number
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  payment_method: string
  payment_status: 'unpaid' | 'paid' | 'refunded'
  coupon_code?: string
  coupon_discount: number
  created_at: string
  updated_at: string
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id?: string
  product_name_ar: string
  product_name_en: string
  quantity: number
  unit_price: number
  total_price: number
}

export interface Coupon {
  id: string
  code: string
  description_ar?: string
  type: 'percentage' | 'fixed'
  value: number
  min_order_amount: number
  max_discount_amount?: number
  usage_limit?: number
  usage_count: number
  is_active: boolean
  starts_at: string
  expires_at?: string
  created_at: string
}

export interface FlashSale {
  id: string
  name_ar: string
  name_en: string
  discount_percentage: number
  starts_at: string
  ends_at: string
  is_active: boolean
  apply_to: 'all' | 'category' | 'products'
  category_id?: string
  product_ids?: string[]
  created_at: string
}

export interface Subscriber {
  id: string
  email: string
  name?: string
  source: string
  is_active: boolean
  subscribed_at: string
}

export interface AbandonedCart {
  id: string
  phone?: string
  email?: string
  cart_data?: CartItem[]
  total_value?: number
  reminder_sent: boolean
  reminder_sent_at?: string
  recovered: boolean
  created_at: string
}

export interface MarketingCampaign {
  id: string
  name: string
  type: 'whatsapp' | 'email' | 'sms' | 'popup'
  subject?: string
  message_ar: string
  message_en?: string
  target_audience: string
  status: 'draft' | 'scheduled' | 'sent' | 'cancelled'
  scheduled_at?: string
  sent_at?: string
  recipients_count: number
  created_at: string
}

export interface CartItem {
  id: string
  name_ar: string
  name_en: string
  price: number
  image: string
  quantity: number
  slug: string
}

export interface Setting {
  id: string
  key: string
  value?: string
  updated_at: string
}

export interface Review {
  id: string
  product_id: string
  customer_name: string
  rating: number
  comment: string
  is_approved: boolean
  order_id?: string
  created_at: string
}
