-- Performance indexes for Deep Beauty
-- Run in Supabase SQL Editor

-- products: الأكثر استخداماً في الـ queries
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products (is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products (is_featured, is_active);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category, is_active);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products (slug);

-- orders: للبحث والفلترة
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders (customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders (order_number);

-- order_items: للجلب مع الطلبات
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items (order_id);

-- categories
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON public.categories (is_active);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories (slug);

-- flash_sales: للفلترة بالتاريخ
CREATE INDEX IF NOT EXISTS idx_flash_sales_active_dates ON public.flash_sales (is_active, starts_at, ends_at);

-- coupons
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons (code);
