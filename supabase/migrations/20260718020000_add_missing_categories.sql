-- ============================================================
-- Fix orphaned product category references.
--
-- products.category is free text (not a FK to categories.id), and several
-- active products carry category text ("معطرات", "رجالي") that has no
-- matching row in the categories table at all. Anything that filters
-- products against the live categories list (category chips, category
-- pages, category-scoped sections) silently drops these products.
-- Backfilling the missing category rows makes them resolvable everywhere.
-- ============================================================

insert into public.categories (name_ar, name_en, slug, is_active)
values
  ('معطرات', 'Fragrances', 'fragrances', true),
  ('رجالي', 'Men', 'men', true)
on conflict (slug) do nothing;
