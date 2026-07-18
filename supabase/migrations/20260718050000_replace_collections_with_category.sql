-- ============================================================
-- Simplify: collections are just products under a dedicated
-- "المجموعات" category, exactly like any other product — no separate
-- collections/collection_products system, no dedicated admin screen.
-- ============================================================

insert into public.categories (name_ar, name_en, slug, is_active)
values ('المجموعات', 'Collections', 'collections', true)
on conflict (slug) do nothing;

update public.products
set category = 'المجموعات'
where slug in (
  'aker-fassi-brightening-collection',
  'vitamin-c-turmeric-collection',
  'silk-collection',
  'herbal-dalka-collection'
);

drop table if exists public.collection_products;
drop table if exists public.collections;
