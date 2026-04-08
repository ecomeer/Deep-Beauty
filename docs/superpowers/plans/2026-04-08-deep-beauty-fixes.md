# Deep Beauty — Critical Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all critical issues preventing Deep Beauty from working correctly — middleware auth protection, missing DB functions/tables, RLS policies, Storage bucket, and admin write operations.

**Architecture:** Three layers of fixes: (1) DB migrations for missing objects, (2) Next.js middleware for route protection, (3) API Routes using supabaseAdmin for all admin write operations so RLS is bypassed correctly.

**Tech Stack:** Next.js 16 App Router, Supabase (supabase-js v2, @supabase/ssr), TypeScript, Tailwind CSS v4

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `middleware.ts` | Create | Protect all `/admin/*` routes except `/admin/login` |
| `supabase/migrations/00005_rpc_functions.sql` | Create | `decrement_stock` + `increment_coupon_usage` RPC functions |
| `supabase/migrations/00006_flash_sales.sql` | Create | `flash_sales` table + RLS |
| `supabase/migrations/00007_storage_and_rls.sql` | Create | `product-images` bucket policy + admin RLS policies |
| `app/api/admin/products/route.ts` | Create | POST (create product) |
| `app/api/admin/products/[id]/route.ts` | Create | PATCH (update), DELETE (delete product) |
| `app/api/admin/orders/[id]/route.ts` | Create | PATCH (update order status/payment) |
| `app/api/admin/categories/route.ts` | Create | POST (create category) |
| `app/api/admin/categories/[id]/route.ts` | Create | PATCH (update), DELETE (delete category) |
| `app/api/admin/banners/route.ts` | Create | POST (create banner) |
| `app/api/admin/banners/[id]/route.ts` | Create | PATCH (update), DELETE (delete banner) |
| `app/api/admin/settings/route.ts` | Create | POST (upsert settings) |
| `app/(admin)/admin/products/[id]/page.tsx` | Modify | Use API routes for save/delete |
| `app/(admin)/admin/products/page.tsx` | Modify | Use API routes for delete/toggleStatus |
| `app/(admin)/admin/orders/page.tsx` | Modify | Use API route for updateStatus |
| `app/(admin)/admin/orders/[id]/page.tsx` | Modify | Use API route for updateStatus |
| `app/(admin)/admin/categories/page.tsx` | Modify | Use API routes for create/delete |
| `app/(admin)/admin/banners/page.tsx` | Modify | Use API routes for create/update/delete |
| `app/(admin)/admin/settings/page.tsx` | Modify | Use API route for save |

---

## Task 1: Middleware — Protect Admin Routes

**Files:**
- Create: `middleware.ts` (project root)

- [ ] **Step 1: Create middleware.ts**

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const isLoginPage = request.nextUrl.pathname === '/admin/login'

  if (isAdminRoute && !isLoginPage && !user) {
    const loginUrl = new URL('/admin/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  if (isLoginPage && user) {
    const dashboardUrl = new URL('/admin/dashboard', request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/admin/:path*'],
}
```

- [ ] **Step 2: Verify dev server starts without errors**

```bash
cd c:/Users/SURFACE/deep-beauty && npm run dev
```

Expected: Server starts on port 3000. Visit `http://localhost:3000/admin/dashboard` — should redirect to `/admin/login`.

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat: add middleware for admin route protection"
```

---

## Task 2: DB Migration — RPC Functions

**Files:**
- Create: `supabase/migrations/00005_rpc_functions.sql`

- [ ] **Step 1: Create migration file**

```sql
-- supabase/migrations/00005_rpc_functions.sql
-- RPC: decrement stock safely (no negative stock)
CREATE OR REPLACE FUNCTION public.decrement_stock(product_id UUID, qty INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.products
  SET stock_quantity = GREATEST(0, stock_quantity - qty)
  WHERE id = product_id;
END;
$$;

-- RPC: increment coupon usage count
CREATE OR REPLACE FUNCTION public.increment_coupon_usage(coupon_code TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.coupons
  SET usage_count = usage_count + 1
  WHERE code = coupon_code;
END;
$$;
```

- [ ] **Step 2: Apply migration via Supabase dashboard**

Go to Supabase dashboard → SQL Editor → paste the contents of `supabase/migrations/00005_rpc_functions.sql` → Run.

Expected: "Success. No rows returned."

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/00005_rpc_functions.sql
git commit -m "feat: add decrement_stock and increment_coupon_usage RPC functions"
```

---

## Task 3: DB Migration — Flash Sales Table

**Files:**
- Create: `supabase/migrations/00006_flash_sales.sql`

- [ ] **Step 1: Create migration file**

```sql
-- supabase/migrations/00006_flash_sales.sql
CREATE TABLE IF NOT EXISTS public.flash_sales (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar             TEXT NOT NULL,
  discount_percentage NUMERIC(5, 2) NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
  starts_at           TIMESTAMPTZ NOT NULL,
  ends_at             TIMESTAMPTZ NOT NULL,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  apply_to            TEXT NOT NULL DEFAULT 'all' CHECK (apply_to IN ('all', 'category', 'products')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ends_after_starts CHECK (ends_at > starts_at)
);

ALTER TABLE public.flash_sales ENABLE ROW LEVEL SECURITY;

-- Anyone can read active flash sales
CREATE POLICY "public_read_flash_sales" ON public.flash_sales
  FOR SELECT USING (is_active = true AND starts_at <= now() AND ends_at >= now());

-- Authenticated (admin) can do everything
CREATE POLICY "admin_all_flash_sales" ON public.flash_sales
  FOR ALL USING (auth.role() = 'authenticated');
```

- [ ] **Step 2: Apply migration via Supabase dashboard**

Go to Supabase dashboard → SQL Editor → paste contents → Run.

Expected: "Success. No rows returned."

- [ ] **Step 3: Add FlashSale type to types/index.ts**

Open `types/index.ts` and append at the end:

```typescript
export interface FlashSale {
  id: string
  name_ar: string
  discount_percentage: number
  starts_at: string
  ends_at: string
  is_active: boolean
  apply_to: 'all' | 'category' | 'products'
  created_at: string
}
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/00006_flash_sales.sql types/index.ts
git commit -m "feat: add flash_sales table and FlashSale type"
```

---

## Task 4: DB Migration — RLS Admin Policies + Storage

**Files:**
- Create: `supabase/migrations/00007_admin_rls_and_storage.sql`

- [ ] **Step 1: Create migration file**

```sql
-- supabase/migrations/00007_admin_rls_and_storage.sql

-- Allow authenticated admins to write products
CREATE POLICY "admin_all_products" ON public.products
  FOR ALL USING (auth.role() = 'authenticated');

-- Allow authenticated admins to write categories
CREATE POLICY "admin_all_categories" ON public.categories
  FOR ALL USING (auth.role() = 'authenticated');

-- Allow authenticated admins to read/write orders
CREATE POLICY "admin_all_orders" ON public.orders
  FOR ALL USING (auth.role() = 'authenticated');

-- Allow authenticated admins to read/write order_items
CREATE POLICY "admin_all_order_items" ON public.order_items
  FOR ALL USING (auth.role() = 'authenticated');

-- Allow authenticated admins to write coupons
CREATE POLICY "admin_all_coupons" ON public.coupons
  FOR ALL USING (auth.role() = 'authenticated');

-- Allow authenticated admins to write settings
CREATE POLICY "admin_all_settings" ON public.settings
  FOR ALL USING (auth.role() = 'authenticated');

-- Allow public to read settings
CREATE POLICY "public_read_settings" ON public.settings
  FOR SELECT USING (true);
```

- [ ] **Step 2: Apply migration via Supabase dashboard**

SQL Editor → paste → Run.

Expected: "Success. No rows returned."

- [ ] **Step 3: Create Storage bucket via Supabase dashboard**

Go to Storage → New bucket:
- Name: `product-images`
- Public: ✅ Yes

Then add these policies for the bucket:
- **SELECT** (public): `true`
- **INSERT** (authenticated): `auth.role() = 'authenticated'`
- **DELETE** (authenticated): `auth.role() = 'authenticated'`

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/00007_admin_rls_and_storage.sql
git commit -m "feat: add admin RLS policies and note storage bucket setup"
```

---

## Task 5: API Routes — Admin Products

**Files:**
- Create: `app/api/admin/products/route.ts`
- Create: `app/api/admin/products/[id]/route.ts`

- [ ] **Step 1: Create POST route for new product**

```typescript
// app/api/admin/products/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  const body = await req.json()

  const { data, error } = await supabaseAdmin
    .from('products')
    .insert({
      name_ar: body.name_ar,
      name_en: body.name_en,
      slug: body.slug,
      category: body.category || null,
      price: body.price,
      compare_price: body.compare_price || null,
      stock_quantity: body.stock_quantity,
      weight_grams: body.weight_grams || null,
      is_active: body.is_active,
      is_featured: body.is_featured,
      description_ar: body.description_ar || null,
      description_en: body.description_en || null,
      ingredients_ar: body.ingredients_ar || null,
      ingredients_en: body.ingredients_en || null,
      images: body.images || [],
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}
```

- [ ] **Step 2: Create PATCH and DELETE routes for existing product**

```typescript
// app/api/admin/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()

  const { data, error } = await supabaseAdmin
    .from('products')
    .update({
      name_ar: body.name_ar,
      name_en: body.name_en,
      slug: body.slug,
      category: body.category || null,
      price: body.price,
      compare_price: body.compare_price || null,
      stock_quantity: body.stock_quantity,
      weight_grams: body.weight_grams || null,
      is_active: body.is_active,
      is_featured: body.is_featured,
      description_ar: body.description_ar || null,
      description_en: body.description_en || null,
      ingredients_ar: body.ingredients_ar || null,
      ingredients_en: body.ingredients_en || null,
      images: body.images || [],
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await supabaseAdmin.from('products').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/products/
git commit -m "feat: add admin products API routes"
```

---

## Task 6: API Routes — Admin Orders

**Files:**
- Create: `app/api/admin/orders/[id]/route.ts`

- [ ] **Step 1: Create PATCH route for order status**

```typescript
// app/api/admin/orders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()

  const updateFields: Record<string, string> = {}
  if (body.status !== undefined) updateFields.status = body.status
  if (body.payment_status !== undefined) updateFields.payment_status = body.payment_status

  const { data, error } = await supabaseAdmin
    .from('orders')
    .update(updateFields)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/admin/orders/
git commit -m "feat: add admin orders API route"
```

---

## Task 7: API Routes — Admin Categories

**Files:**
- Create: `app/api/admin/categories/route.ts`
- Create: `app/api/admin/categories/[id]/route.ts`

- [ ] **Step 1: Create POST route for new category**

```typescript
// app/api/admin/categories/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  const body = await req.json()

  const { data, error } = await supabaseAdmin
    .from('categories')
    .insert({
      name_ar: body.name_ar,
      name_en: body.name_en,
      slug: body.slug,
      image_url: body.image_url || null,
      is_active: body.is_active ?? true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}
```

- [ ] **Step 2: Create PATCH and DELETE routes**

```typescript
// app/api/admin/categories/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()

  const { data, error } = await supabaseAdmin
    .from('categories')
    .update({
      name_ar: body.name_ar,
      name_en: body.name_en,
      slug: body.slug,
      image_url: body.image_url || null,
      is_active: body.is_active ?? true,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await supabaseAdmin.from('categories').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/categories/
git commit -m "feat: add admin categories API routes"
```

---

## Task 8: API Routes — Admin Banners

**Files:**
- Create: `app/api/admin/banners/route.ts`
- Create: `app/api/admin/banners/[id]/route.ts`

- [ ] **Step 1: Create POST route**

```typescript
// app/api/admin/banners/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  const body = await req.json()

  const { data, error } = await supabaseAdmin
    .from('banners')
    .insert({
      title_ar: body.title_ar,
      subtitle_ar: body.subtitle_ar || null,
      image_url: body.image_url,
      link_url: body.link_url || '/products',
      is_active: body.is_active ?? true,
      sort_order: body.sort_order ?? 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}
```

- [ ] **Step 2: Create PATCH and DELETE routes**

```typescript
// app/api/admin/banners/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()

  const { data, error } = await supabaseAdmin
    .from('banners')
    .update({
      title_ar: body.title_ar,
      subtitle_ar: body.subtitle_ar || null,
      image_url: body.image_url,
      link_url: body.link_url || '/products',
      is_active: body.is_active ?? true,
      sort_order: body.sort_order ?? 0,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await supabaseAdmin.from('banners').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/banners/
git commit -m "feat: add admin banners API routes"
```

---

## Task 9: API Route — Admin Settings

**Files:**
- Create: `app/api/admin/settings/route.ts`

- [ ] **Step 1: Create POST route (upsert all settings)**

```typescript
// app/api/admin/settings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  const body = await req.json()
  // body is Record<string, string> — e.g. { store_name: 'Deep Beauty', shipping_cost: '1.500', ... }

  const rows = Object.entries(body as Record<string, string>).map(([key, value]) => ({
    key,
    value: value ?? '',
  }))

  const { error } = await supabaseAdmin
    .from('settings')
    .upsert(rows, { onConflict: 'key' })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/admin/settings/
git commit -m "feat: add admin settings API route"
```

---

## Task 10: Update Admin Pages — Products

**Files:**
- Modify: `app/(admin)/admin/products/page.tsx`
- Modify: `app/(admin)/admin/products/[id]/page.tsx`

- [ ] **Step 1: Update products list page — replace supabase writes with fetch calls**

In `app/(admin)/admin/products/page.tsx`, replace the `handleDelete` and `toggleStatus` functions:

```typescript
const handleDelete = async (id: string) => {
  if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return
  const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
  if (!res.ok) toast.error('حدث خطأ أثناء الحذف')
  else { toast.success('تم حذف المنتج بنجاح'); fetchProducts() }
}

const toggleStatus = async (id: string, currentStatus: boolean) => {
  const res = await fetch(`/api/admin/products/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_active: !currentStatus }),
  })
  if (!res.ok) toast.error('حدث خطأ')
  else fetchProducts()
}
```

Note: the PATCH route accepts partial updates — only `is_active` being sent is fine since the route spreads the body. However, the current PATCH route requires all fields. Update the PATCH handler in `app/api/admin/products/[id]/route.ts` to use a partial update instead:

Replace the PATCH handler body with:

```typescript
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()

  // Build only the fields that were sent
  const updateFields: Record<string, unknown> = {}
  const allowed = [
    'name_ar','name_en','slug','category','price','compare_price',
    'stock_quantity','weight_grams','is_active','is_featured',
    'description_ar','description_en','ingredients_ar','ingredients_en','images',
  ]
  for (const key of allowed) {
    if (key in body) updateFields[key] = body[key]
  }

  const { data, error } = await supabaseAdmin
    .from('products')
    .update(updateFields)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}
```

- [ ] **Step 2: Update product form page — replace supabase writes with fetch calls**

In `app/(admin)/admin/products/[id]/page.tsx`, find the `handleSubmit` function and replace the supabase insert/update calls.

Find the section that does `supabase.from('products').insert(...)` or `.update(...)` and replace:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)
  try {
    const payload = {
      ...form,
      compare_price: form.compare_price || null,
      weight_grams: form.weight_grams || null,
    }

    const url = isEdit ? `/api/admin/products/${params.id}` : '/api/admin/products'
    const method = isEdit ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const { error } = await res.json()
      throw new Error(error)
    }

    toast.success(isEdit ? 'تم تحديث المنتج بنجاح' : 'تم إضافة المنتج بنجاح')
    router.push('/admin/products')
  } catch (err: unknown) {
    toast.error(err instanceof Error ? err.message : 'حدث خطأ')
  }
  setLoading(false)
}
```

- [ ] **Step 3: Commit**

```bash
git add app/\(admin\)/admin/products/ app/api/admin/products/
git commit -m "fix: use API routes for admin product writes"
```

---

## Task 11: Update Admin Pages — Orders

**Files:**
- Modify: `app/(admin)/admin/orders/page.tsx`
- Modify: `app/(admin)/admin/orders/[id]/page.tsx`

- [ ] **Step 1: Update orders list page**

In `app/(admin)/admin/orders/page.tsx`, replace `updateStatus`:

```typescript
const updateStatus = async (id: string, newStatus: string) => {
  const res = await fetch(`/api/admin/orders/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus }),
  })
  if (!res.ok) toast.error('حدث خطأ أثناء تحديث الحالة')
  else { toast.success('تم تحديث الطلب بنجاح'); fetchOrders() }
}
```

- [ ] **Step 2: Update order detail page**

In `app/(admin)/admin/orders/[id]/page.tsx`, replace `updateStatus`:

```typescript
const updateStatus = async (newStatus: string) => {
  const res = await fetch(`/api/admin/orders/${order.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus }),
  })
  if (!res.ok) {
    toast.error('حدث خطأ أثناء تحديث الحالة')
  } else {
    toast.success('تم تحديث الطلب بنجاح')
    setOrder({ ...order, status: newStatus })
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add app/\(admin\)/admin/orders/
git commit -m "fix: use API route for admin order status updates"
```

---

## Task 12: Update Admin Pages — Categories

**Files:**
- Modify: `app/(admin)/admin/categories/page.tsx`

- [ ] **Step 1: Update categories page — replace all supabase write calls**

In `app/(admin)/admin/categories/page.tsx`, find and replace the save (insert/update) and delete functions:

Replace the create/save function (look for `supabase.from('categories').insert`):

```typescript
async function handleSave() {
  if (!form.name_ar || !form.name_en || !form.slug) {
    toast.error('يرجى ملء جميع الحقول المطلوبة')
    return
  }
  setSaving(true)
  const res = await fetch('/api/admin/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...form, image_url: form.image_url || null }),
  })
  if (!res.ok) {
    const { error } = await res.json()
    toast.error(error || 'حدث خطأ')
  } else {
    toast.success('تمت الإضافة بنجاح')
    setForm(EMPTY_FORM)
    setShowForm(false)
    fetchCategories()
  }
  setSaving(false)
}
```

Replace the delete function (look for `supabase.from('categories').delete`):

```typescript
async function handleDelete(id: string) {
  if (!confirm('حذف هذه الفئة؟')) return
  const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
  if (!res.ok) toast.error('حدث خطأ')
  else { toast.success('تم الحذف'); fetchCategories() }
}
```

Replace the inline edit save (look for `supabase.from('categories').update`):

```typescript
async function saveInlineEdit(cat: Category) {
  setEditUploading(true)
  const res = await fetch(`/api/admin/categories/${cat.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name_ar: cat.name_ar,
      name_en: cat.name_en,
      slug: cat.slug,
      image_url: editImageUrl || cat.image_url || null,
      is_active: cat.is_active,
    }),
  })
  if (!res.ok) toast.error('حدث خطأ')
  else { toast.success('تم الحفظ'); setEditingId(null); fetchCategories() }
  setEditUploading(false)
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(admin\)/admin/categories/
git commit -m "fix: use API routes for admin category writes"
```

---

## Task 13: Update Admin Pages — Banners

**Files:**
- Modify: `app/(admin)/admin/banners/page.tsx`

- [ ] **Step 1: Update banners page — replace all supabase write calls**

In `app/(admin)/admin/banners/page.tsx`, find and replace save/delete/reorder functions.

Replace the save function (look for `supabase.from('banners').insert`):

```typescript
async function handleSave() {
  if (!form.title_ar || !form.image_url) {
    toast.error('العنوان والصورة مطلوبان')
    return
  }
  setSaving(true)
  const res = await fetch('/api/admin/banners', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...form,
      sort_order: banners.length,
    }),
  })
  if (!res.ok) {
    const { error } = await res.json()
    toast.error(error || 'حدث خطأ')
  } else {
    toast.success('تمت الإضافة بنجاح')
    setForm(EMPTY_FORM)
    setShowForm(false)
    fetchBanners()
  }
  setSaving(false)
}
```

Replace the delete function (look for `supabase.from('banners').delete`):

```typescript
async function handleDelete(id: string) {
  if (!confirm('حذف هذا البنر؟')) return
  const res = await fetch(`/api/admin/banners/${id}`, { method: 'DELETE' })
  if (!res.ok) toast.error('حدث خطأ')
  else { toast.success('تم الحذف'); fetchBanners() }
}
```

Replace the toggle active function (look for `supabase.from('banners').update({ is_active`)):

```typescript
async function toggleActive(banner: Banner) {
  const res = await fetch(`/api/admin/banners/${banner.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...banner, is_active: !banner.is_active }),
  })
  if (!res.ok) toast.error('حدث خطأ')
  else fetchBanners()
}
```

Replace the reorder functions (look for `supabase.from('banners').update({ sort_order`)):

```typescript
async function moveUp(index: number) {
  if (index === 0) return
  const updated = [...banners]
  ;[updated[index - 1], updated[index]] = [updated[index], updated[index - 1]]
  await Promise.all([
    fetch(`/api/admin/banners/${updated[index - 1].id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...updated[index - 1], sort_order: index - 1 }),
    }),
    fetch(`/api/admin/banners/${updated[index].id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...updated[index], sort_order: index }),
    }),
  ])
  fetchBanners()
}

async function moveDown(index: number) {
  if (index === banners.length - 1) return
  const updated = [...banners]
  ;[updated[index], updated[index + 1]] = [updated[index + 1], updated[index]]
  await Promise.all([
    fetch(`/api/admin/banners/${updated[index].id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...updated[index], sort_order: index }),
    }),
    fetch(`/api/admin/banners/${updated[index + 1].id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...updated[index + 1], sort_order: index + 1 }),
    }),
  ])
  fetchBanners()
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(admin\)/admin/banners/
git commit -m "fix: use API routes for admin banner writes"
```

---

## Task 14: Update Admin Pages — Settings

**Files:**
- Modify: `app/(admin)/admin/settings/page.tsx`

- [ ] **Step 1: Update settings save function**

In `app/(admin)/admin/settings/page.tsx`, find the save function (look for `supabase.from('settings').upsert`) and replace:

```typescript
async function handleSave(e: React.FormEvent) {
  e.preventDefault()
  setSaving(true)
  const res = await fetch('/api/admin/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  })
  if (!res.ok) toast.error('حدث خطأ أثناء الحفظ')
  else toast.success('تم حفظ الإعدادات بنجاح')
  setSaving(false)
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(admin\)/admin/settings/
git commit -m "fix: use API route for admin settings writes"
```

---

## Task 15: Final Verification

- [ ] **Step 1: Build check**

```bash
cd c:/Users/SURFACE/deep-beauty && npm run build
```

Expected: Build completes with no errors. Warnings about `any` types are acceptable.

- [ ] **Step 2: Manual smoke test — Store**

Start dev server: `npm run dev`

1. Visit `http://localhost:3000` — home page loads with products
2. Visit `http://localhost:3000/products` — product list loads
3. Add a product to cart, go to `/cart` — items show correctly
4. Go to `/checkout`, fill form, submit — order is created (check Supabase dashboard → orders table)

- [ ] **Step 3: Manual smoke test — Admin**

1. Visit `http://localhost:3000/admin/dashboard` — redirected to `/admin/login` ✅
2. Login with admin credentials — redirected to `/admin/dashboard` ✅
3. Go to Products → Add a product → Save — product appears in list ✅
4. Go to Orders — orders from checkout test appear ✅
5. Update an order status — status changes ✅

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "fix: complete critical fixes for Deep Beauty — middleware, DB migrations, API routes"
```
