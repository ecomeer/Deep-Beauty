create schema if not exists internal_backups;

create table if not exists internal_backups.products_before_deep_beauty_import_20260718 as
table public.products with data;

alter table public.products
  add column if not exists seo_title text,
  add column if not exists meta_description text,
  add column if not exists image_alt text,
  add column if not exists usage_ar text,
  add column if not exists benefits_ar text,
  add column if not exists product_type text not null default 'product';

comment on column public.products.seo_title is 'Custom SEO title for product pages';
comment on column public.products.meta_description is 'Custom meta description for search and social previews';
comment on column public.products.image_alt is 'Accessible alt text for the primary product image';
comment on column public.products.usage_ar is 'Arabic usage directions';
comment on column public.products.benefits_ar is 'Arabic product benefits separated by pipes or new lines';
comment on column public.products.product_type is 'product or bundle';
