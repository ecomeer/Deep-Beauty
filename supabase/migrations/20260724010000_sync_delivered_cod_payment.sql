-- A delivered cash-on-delivery order means the cash was collected.
-- Keep payment state and revenue reporting in sync regardless of which admin
-- path performs the status transition (single order, bulk, or tracking).

CREATE OR REPLACE FUNCTION public.sync_delivered_cod_payment()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.status = 'delivered'
     AND OLD.status IS DISTINCT FROM NEW.status
     AND NEW.payment_method = 'cod'
     AND NEW.payment_status = 'unpaid' THEN
    NEW.payment_status := 'paid';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_delivered_cod_payment ON public.orders;
CREATE TRIGGER trg_sync_delivered_cod_payment
BEFORE UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.sync_delivered_cod_payment();

-- Repair historical COD orders that were delivered before the trigger existed.
UPDATE public.orders
SET payment_status = 'paid',
    updated_at = now()
WHERE status = 'delivered'
  AND payment_method = 'cod'
  AND payment_status = 'unpaid';
