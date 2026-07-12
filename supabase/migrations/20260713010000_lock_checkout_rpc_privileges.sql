-- Keep the restock RPC callable only by trusted server-side code.
-- REVOKE from PUBLIC is required because anon/authenticated inherit it.
REVOKE EXECUTE ON FUNCTION public.restock_order_atomic(uuid) FROM PUBLIC, anon, authenticated;

-- Pin the search path for both checkout RPC overloads.
ALTER FUNCTION public.create_order_atomic(jsonb, jsonb) SET search_path = public;
ALTER FUNCTION public.create_order_atomic(jsonb, jsonb, text) SET search_path = public;
