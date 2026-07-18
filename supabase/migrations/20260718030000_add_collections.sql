-- ============================================================
-- Collections: curated product groupings managed from the admin
-- dashboard, replacing the previously hardcoded storefront array.
-- ============================================================

create table if not exists public.collections (
  id               uuid primary key default gen_random_uuid(),
  name_ar          text not null,
  name_en          text not null,
  slug             text not null unique,
  description_ar   text,
  description_en   text,
  image_url        text,
  status           text not null default 'active' check (status in ('active', 'inactive')),
  is_featured      boolean not null default false,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

create table if not exists public.collection_products (
  id             uuid primary key default gen_random_uuid(),
  collection_id  uuid not null references public.collections(id) on delete cascade,
  product_id     uuid not null references public.products(id) on delete cascade,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now(),
  unique (collection_id, product_id)
);

create index if not exists idx_collections_status on public.collections(status) where deleted_at is null;
create index if not exists idx_collections_slug on public.collections(slug);
create index if not exists idx_collection_products_collection_id on public.collection_products(collection_id);
create index if not exists idx_collection_products_product_id on public.collection_products(product_id);

create trigger update_collections_updated_at
  before update on public.collections
  for each row
  execute function public.update_updated_at_column();

alter table public.collections enable row level security;
alter table public.collection_products enable row level security;

-- Public storefront can read collections; the app layer additionally
-- filters status = 'active' and deleted_at is null for display.
create policy collections_select on public.collections
  for select using (true);

create policy collections_admin_insert on public.collections
  for insert with check (public.is_admin());

create policy collections_admin_update on public.collections
  for update using (public.is_admin()) with check (public.is_admin());

create policy collections_admin_delete on public.collections
  for delete using (public.is_admin());

create policy collection_products_select on public.collection_products
  for select using (true);

create policy collection_products_admin_insert on public.collection_products
  for insert with check (public.is_admin());

create policy collection_products_admin_update on public.collection_products
  for update using (public.is_admin()) with check (public.is_admin());

create policy collection_products_admin_delete on public.collection_products
  for delete using (public.is_admin());

-- ============================================================
-- Seed real collections from the 4 bundle products already in the
-- catalog, replacing the old hardcoded/disconnected storefront list.
-- ============================================================

insert into public.collections (name_ar, name_en, slug, description_ar, image_url, status, is_featured, sort_order)
select 'مجموعة التوريد بالعكر الفاسي', 'Aker Fassi Brightening Collection', 'aker-fassi-brightening-collection',
       description_ar, images[1], 'active', true, 1
from public.products where slug = 'aker-fassi-brightening-collection'
on conflict (slug) do nothing;

insert into public.collections (name_ar, name_en, slug, description_ar, image_url, status, is_featured, sort_order)
select 'مجموعة فيتامين سي بالكركم', 'Vitamin C & Turmeric Collection', 'vitamin-c-turmeric-collection',
       description_ar, images[1], 'active', true, 2
from public.products where slug = 'vitamin-c-turmeric-collection'
on conflict (slug) do nothing;

insert into public.collections (name_ar, name_en, slug, description_ar, image_url, status, is_featured, sort_order)
select 'مجموعة سلك حرير', 'Silk Collection', 'silk-collection',
       description_ar, images[1], 'active', true, 3
from public.products where slug = 'silk-collection'
on conflict (slug) do nothing;

insert into public.collections (name_ar, name_en, slug, description_ar, image_url, status, is_featured, sort_order)
select 'مجموعة الدلكة بالأعشاب', 'Herbal Dalka Collection', 'herbal-dalka-collection',
       description_ar, images[1], 'active', true, 4
from public.products where slug = 'herbal-dalka-collection'
on conflict (slug) do nothing;

-- Link each collection to the individual products it packages together
-- (the bundle product row itself represents the collection/its own
-- discounted price and is intentionally not listed as a member of itself).
insert into public.collection_products (collection_id, product_id, sort_order)
select c.id, p.id, ordering.sort_order
from public.collections c
join (values
  ('aker-fassi-brightening-collection', 'aker-fassi-brightening-scrub', 0),
  ('aker-fassi-brightening-collection', 'aker-fassi-brightening-soap', 1),
  ('aker-fassi-brightening-collection', 'aker-fassi-brightening-spray', 2),
  ('vitamin-c-turmeric-collection', 'vitamin-c-turmeric-scrub', 0),
  ('vitamin-c-turmeric-collection', 'vitamin-c-turmeric-cream', 1),
  ('vitamin-c-turmeric-collection', 'vitamin-c-turmeric-soap', 2),
  ('silk-collection', 'silk-shower-gel', 0),
  ('silk-collection', 'silk-body-cream', 1),
  ('silk-collection', 'silk-khumria', 2),
  ('herbal-dalka-collection', 'herbal-body-dalka', 0),
  ('herbal-dalka-collection', 'herbal-dalka-oil', 1)
) as ordering(collection_slug, product_slug, sort_order) on ordering.collection_slug = c.slug
join public.products p on p.slug = ordering.product_slug
on conflict (collection_id, product_id) do nothing;
