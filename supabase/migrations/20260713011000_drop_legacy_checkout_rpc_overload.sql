-- The new coupon-aware function has a default third argument, so keeping
-- the legacy two-argument overload makes PostgREST report an ambiguous RPC.
DROP FUNCTION IF EXISTS public.create_order_atomic(jsonb, jsonb);
