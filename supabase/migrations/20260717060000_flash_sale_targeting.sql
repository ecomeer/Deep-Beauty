-- Flash sales admin UI already offered "category" / "specific products"
-- targeting (flash_sales.apply_to), but there was never a column or table
-- to store WHICH category/products — lib/flash-sale.ts ignored apply_to
-- entirely and discounted every product storewide. Add real targeting
-- storage so apply_to can actually be enforced.

ALTER TABLE public.flash_sales
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.flash_sale_products (
  flash_sale_id uuid NOT NULL REFERENCES public.flash_sales(id) ON DELETE CASCADE,
  product_id    uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  PRIMARY KEY (flash_sale_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_flash_sale_products_product ON public.flash_sale_products(product_id);

ALTER TABLE public.flash_sale_products ENABLE ROW LEVEL SECURITY;

-- Public reads (needed for storefront price computation via anon key);
-- all writes go through supabaseAdmin (service role) from admin API routes,
-- matching flash_sales itself.
DROP POLICY IF EXISTS "flash_sale_products_select" ON public.flash_sale_products;
CREATE POLICY "flash_sale_products_select" ON public.flash_sale_products
  FOR SELECT USING (true);

REVOKE INSERT, UPDATE, DELETE ON TABLE public.flash_sale_products FROM anon, authenticated;
