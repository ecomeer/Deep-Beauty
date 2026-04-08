-- ==========================================
-- 00001_initial_schema.sql
-- Deep Beauty E-Commerce Store Schema
-- ==========================================

-- Enable extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. CATEGORIES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 2. PRODUCTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description_ar TEXT,
    description_en TEXT,
    price NUMERIC(10, 3) NOT NULL,
    compare_price NUMERIC(10, 3),
    images TEXT[] DEFAULT array[]::text[],
    category TEXT, -- Or you can use category_id UUID REFERENCES categories(id)
    stock_quantity INTEGER DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    weight_grams NUMERIC(10, 2),
    ingredients_ar TEXT,
    ingredients_en TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 3. ORDERS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT NOT NULL,
    address_line1 TEXT NOT NULL,
    address_area TEXT NOT NULL,
    address_block TEXT,
    address_street TEXT,
    address_house TEXT,
    notes TEXT,
    subtotal NUMERIC(10, 3) NOT NULL,
    shipping_cost NUMERIC(10, 3) NOT NULL,
    total NUMERIC(10, 3) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    payment_method TEXT NOT NULL DEFAULT 'cod',
    payment_status TEXT NOT NULL DEFAULT 'unpaid',
    coupon_code TEXT,
    coupon_discount NUMERIC(10, 3) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 4. ORDER ITEMS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name_ar TEXT NOT NULL,
    product_name_en TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10, 3) NOT NULL,
    total_price NUMERIC(10, 3) NOT NULL
);

-- ==========================================
-- 5. COUPONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    description_ar TEXT,
    type TEXT NOT NULL, -- 'percentage' or 'fixed'
    value NUMERIC(10, 3) NOT NULL,
    min_order_amount NUMERIC(10, 3) DEFAULT 0,
    max_discount_amount NUMERIC(10, 3),
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 6. SETTINGS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT NOT NULL UNIQUE,
    value TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- RLS (ROW LEVEL SECURITY) POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Products: Everyone can read active products. Only admins can insert/update/delete.
CREATE POLICY "Public profiles are viewable by everyone." ON public.products
    FOR SELECT USING (true);

-- Categories: Everyone can read.
CREATE POLICY "Categories are viewable by everyone." ON public.categories
    FOR SELECT USING (true);

-- Orders: Anyone can insert an order (Guest checkout). 
-- Only authenticated users (admins) can view or update.
CREATE POLICY "Anyone can insert an order" ON public.orders
    FOR INSERT WITH CHECK (true);
    
-- Note: You might want an authenticated policy here if you define an admin role. For now, public selects are disabled for orders to protect privacy.

-- Order Items: Anyone can insert order items.
CREATE POLICY "Anyone can insert order items" ON public.order_items
    FOR INSERT WITH CHECK (true);

-- Coupons: Anyone can read active coupons to validate them at checkout.
CREATE POLICY "Coupons are viewable by everyone" ON public.coupons
    FOR SELECT USING (true);

-- ==========================================
-- UPDATED_AT TRIGGERS
-- ==========================================
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_modtime BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_orders_modtime BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
