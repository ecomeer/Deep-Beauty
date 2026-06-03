# Deep Beauty E-Commerce (Next.js + Supabase)

Production-ready e-commerce storefront and admin dashboard for beauty products.

## Tech Stack

- Next.js 16 (App Router, TypeScript)
- React 19
- Supabase (Auth, Postgres, Storage, RLS)
- Tailwind CSS
- Payments: MyFatoorah (primary flow) + Tap checkout route support

## 1) Prerequisites

- Node.js 20+
- npm 10+
- Supabase project

## 2) Environment Variables

Copy `.env.example` to `.env.local` and fill values:

```bash
cp .env.example .env.local
```

Required for app startup:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`

Required for online payments:

- MyFatoorah flow: `MYFATOORAH_TOKEN`, `MYFATOORAH_API_URL`
- Tap flow: `TAP_SECRET_KEY`

Required for admin access sync:

- `ADMIN_EMAILS` (comma-separated), or `ADMIN_EMAIL`

Optional:

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`

## 3) Database Setup (Supabase)

Run migrations in order:

1. `supabase/migrations/00001_initial_schema.sql`
2. `supabase/migrations/00002_seed_data.sql`
3. Continue sequentially through latest migration

Optional helper scripts:

- `scripts/apply-migration-simple.mjs`
- `scripts/apply-migration.ps1`

## 4) Install & Run

```bash
npm install
npm run dev
```

App runs at `http://localhost:3000`.

## 5) Build Validation

```bash
npm run build
```

Build should pass before deployment.

## 6) Core Routes

Storefront:

- `/`
- `/products`
- `/products/[slug]`
- `/cart`
- `/checkout`
- `/orders`
- `/orders/[id]`
- `/profile`
- `/auth/login`
- `/auth/signup`

Admin:

- `/admin`
- `/admin/dashboard`
- `/admin/products`
- `/admin/orders`

## 7) Deployment

1. Set all required env vars in your hosting provider.
2. Apply Supabase migrations in production.
3. Deploy:

```bash
npm run build
npm run start
```

## Notes

- Admin API access is enforced server-side via `requireAdmin`.
- Guest order detail access requires `id + order number` tokenized link from success flow.
- Avoid importing `lib/supabase-admin.ts` in any client component.
