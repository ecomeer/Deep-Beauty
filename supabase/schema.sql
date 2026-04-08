-- ============================================================
-- Deep Beauty — Supabase Schema
-- Run this in Supabase → SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- CATEGORIES
-- ============================================================
create table if not exists categories (
  id          uuid primary key default uuid_generate_v4(),
  name_ar     text not null,
  name_en     text not null,
  slug        text not null unique,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Sample categories
insert into categories (name_ar, name_en, slug) values
  ('سيروم', 'Serum', 'serum'),
  ('مرطبات', 'Moisturizers', 'moisturizers'),
  ('زيوت الوجه', 'Face Oils', 'face-oils'),
  ('العناية بالشعر', 'Hair Care', 'hair-care')
on conflict (slug) do nothing;

-- ============================================================
-- PRODUCTS
-- ============================================================
create table if not exists products (
  id                uuid primary key default uuid_generate_v4(),
  name_ar           text not null,
  name_en           text not null,
  slug              text not null unique,
  description_ar    text,
  description_en    text,
  price             numeric(10,3) not null,
  compare_price     numeric(10,3),
  images            text[] not null default '{}',
  category          text,
  stock_quantity    integer not null default 0,
  is_active         boolean not null default true,
  is_featured       boolean not null default false,
  weight_grams      integer,
  ingredients_ar    text,
  ingredients_en    text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists trg_products_updated_at on products;
create trigger trg_products_updated_at
  before update on products
  for each row execute procedure update_updated_at();

-- ============================================================
-- ORDERS
-- ============================================================
create table if not exists orders (
  id               uuid primary key default uuid_generate_v4(),
  order_number     text not null unique,
  customer_name    text not null,
  customer_email   text,
  customer_phone   text not null,
  address_line1    text not null,
  address_area     text not null,
  address_block    text,
  address_street   text,
  address_house    text,
  notes            text,
  subtotal         numeric(10,3) not null,
  shipping_cost    numeric(10,3) not null default 1.5,
  total            numeric(10,3) not null,
  status           text not null default 'pending'
                   check (status in ('pending','confirmed','processing','shipped','delivered','cancelled')),
  payment_method   text not null default 'cod',
  payment_status   text not null default 'unpaid'
                   check (payment_status in ('unpaid','paid','refunded')),
  coupon_code      text,
  coupon_discount  numeric(10,3) not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

drop trigger if exists trg_orders_updated_at on orders;
create trigger trg_orders_updated_at
  before update on orders
  for each row execute procedure update_updated_at();

-- ============================================================
-- ORDER ITEMS
-- ============================================================
create table if not exists order_items (
  id               uuid primary key default uuid_generate_v4(),
  order_id         uuid not null references orders(id) on delete cascade,
  product_id       uuid references products(id) on delete set null,
  product_name_ar  text not null,
  product_name_en  text not null,
  quantity         integer not null,
  unit_price       numeric(10,3) not null,
  total_price      numeric(10,3) not null,
  created_at       timestamptz not null default now()
);

-- ============================================================
-- COUPONS
-- ============================================================
create table if not exists coupons (
  id                  uuid primary key default uuid_generate_v4(),
  code                text not null unique,
  description_ar      text,
  type                text not null default 'percentage'
                      check (type in ('percentage','fixed')),
  value               numeric(10,3) not null,
  min_order_amount    numeric(10,3) not null default 0,
  max_discount_amount numeric(10,3),
  usage_limit         integer,
  usage_count         integer not null default 0,
  is_active           boolean not null default true,
  starts_at           timestamptz not null default now(),
  expires_at          timestamptz,
  created_at          timestamptz not null default now()
);

-- ============================================================
-- FLASH SALES
-- ============================================================
create table if not exists flash_sales (
  id                   uuid primary key default uuid_generate_v4(),
  name_ar              text not null,
  name_en              text not null default '',
  discount_percentage  integer not null check (discount_percentage between 1 and 90),
  starts_at            timestamptz not null,
  ends_at              timestamptz not null,
  is_active            boolean not null default true,
  apply_to             text not null default 'all'
                       check (apply_to in ('all','category','products')),
  category_id          uuid references categories(id) on delete set null,
  product_ids          uuid[],
  created_at           timestamptz not null default now()
);

-- ============================================================
-- SETTINGS
-- ============================================================
create table if not exists settings (
  key        text primary key,
  value      text,
  updated_at timestamptz not null default now()
);

-- Default settings
insert into settings (key, value) values
  ('store_name',          'Deep Beauty'),
  ('shipping_cost',       '1.500'),
  ('free_shipping_above', '20.000'),
  ('whatsapp_number',     '96522289182'),
  ('instagram_url',       'https://instagram.com/deepbeautykw'),
  ('announcement_text',   '🚚 شحن مجاني للطلبات فوق ٢٠ د.ك')
on conflict (key) do nothing;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Products: public read, authenticated write
alter table products enable row level security;
create policy "public can read active products"
  on products for select using (is_active = true);
create policy "authenticated can manage products"
  on products for all using (auth.role() = 'authenticated');

-- Categories: public read
alter table categories enable row level security;
create policy "public can read active categories"
  on categories for select using (is_active = true);
create policy "authenticated can manage categories"
  on categories for all using (auth.role() = 'authenticated');

-- Orders: authenticated only
alter table orders enable row level security;
create policy "authenticated can manage orders"
  on orders for all using (auth.role() = 'authenticated');
-- Allow anon insert (customers placing orders)
create policy "anon can insert orders"
  on orders for insert with check (true);

-- Order items: same as orders
alter table order_items enable row level security;
create policy "authenticated can manage order_items"
  on order_items for all using (auth.role() = 'authenticated');
create policy "anon can insert order_items"
  on order_items for insert with check (true);

-- Coupons: anon read for checkout, authenticated write
alter table coupons enable row level security;
create policy "public can read active coupons"
  on coupons for select using (is_active = true);
create policy "authenticated can manage coupons"
  on coupons for all using (auth.role() = 'authenticated');

-- Flash sales: public read, authenticated write
alter table flash_sales enable row level security;
create policy "public can read active flash_sales"
  on flash_sales for select using (is_active = true);
create policy "authenticated can manage flash_sales"
  on flash_sales for all using (auth.role() = 'authenticated');

-- Settings: public read, authenticated write
alter table settings enable row level security;
create policy "public can read settings"
  on settings for select using (true);
create policy "authenticated can manage settings"
  on settings for all using (auth.role() = 'authenticated');

-- ============================================================
-- RPC FUNCTIONS
-- ============================================================

-- تقليل المخزون عند الطلب
create or replace function decrement_stock(product_id uuid, qty integer)
returns void language plpgsql security definer as $$
begin
  update products
  set stock_quantity = greatest(stock_quantity - qty, 0)
  where id = product_id;
end; $$;

-- زيادة عداد استخدام الكوبون
create or replace function increment_coupon_usage(coupon_code text)
returns void language plpgsql security definer as $$
begin
  update coupons
  set usage_count = usage_count + 1
  where code = coupon_code;
end; $$;

-- ============================================================
-- STORAGE BUCKET: product-images
-- Run separately in Supabase → Storage → New bucket
-- Name: product-images | Public: true
-- ============================================================
