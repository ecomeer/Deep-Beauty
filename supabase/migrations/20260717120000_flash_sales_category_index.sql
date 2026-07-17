-- Flagged by the Supabase performance advisor: flash_sales.category_id has
-- a foreign key to categories but no covering index, so every
-- category-targeted flash-sale lookup (getActiveFlashSales / admin list)
-- does a full scan when joining/filtering on it.
CREATE INDEX IF NOT EXISTS idx_flash_sales_category_id ON public.flash_sales(category_id);
