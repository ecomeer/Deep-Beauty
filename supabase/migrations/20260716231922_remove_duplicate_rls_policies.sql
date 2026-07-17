
-- Remove superseded duplicate policies; optimized replacements remain.
DROP POLICY IF EXISTS "admin_push_subscriptions" ON public.push_subscriptions;

DROP POLICY IF EXISTS "notifications: own select" ON public.notifications;
DROP POLICY IF EXISTS "notifications: own update" ON public.notifications;

DROP POLICY IF EXISTS "addresses: own select" ON public.user_addresses;
DROP POLICY IF EXISTS "addresses: own insert" ON public.user_addresses;
DROP POLICY IF EXISTS "addresses: own update" ON public.user_addresses;
DROP POLICY IF EXISTS "addresses: own delete" ON public.user_addresses;

DROP POLICY IF EXISTS "wishlists: own read" ON public.wishlists;
DROP POLICY IF EXISTS "wishlists: own insert" ON public.wishlists;
DROP POLICY IF EXISTS "wishlists: own update" ON public.wishlists;
DROP POLICY IF EXISTS "wishlists: own delete" ON public.wishlists;
