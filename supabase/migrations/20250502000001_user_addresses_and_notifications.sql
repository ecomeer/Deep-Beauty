-- ============================================================
-- user_addresses + notifications
-- ============================================================

-- ─── user_addresses ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_addresses (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label      text        NOT NULL DEFAULT 'المنزل',
  area       text        NOT NULL,
  block      text        NOT NULL DEFAULT '',
  street     text        NOT NULL DEFAULT '',
  house      text        NOT NULL DEFAULT '',
  notes      text,
  is_default boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "addresses: own select" ON public.user_addresses FOR SELECT  USING (auth.uid() = user_id);
CREATE POLICY "addresses: own insert" ON public.user_addresses FOR INSERT  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "addresses: own update" ON public.user_addresses FOR UPDATE  USING (auth.uid() = user_id);
CREATE POLICY "addresses: own delete" ON public.user_addresses FOR DELETE  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS user_addresses_user_id_idx ON public.user_addresses(user_id);

-- ─── notifications ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       text        NOT NULL DEFAULT 'system', -- order_status | promo | system
  title_ar   text        NOT NULL,
  body_ar    text        NOT NULL,
  link       text,
  is_read    boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications: own select" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications: own update" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx   ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx   ON public.notifications(user_id, is_read);

-- ─── trigger: order status → notification ────────────────────
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  status_label text;
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;
  IF NEW.user_id IS NULL       THEN RETURN NEW; END IF;

  status_label := CASE NEW.status
    WHEN 'confirmed'  THEN 'تم تأكيد طلبك'
    WHEN 'processing' THEN 'جارٍ تجهيز طلبك'
    WHEN 'shipped'    THEN 'تم شحن طلبك'
    WHEN 'delivered'  THEN 'تم توصيل طلبك'
    WHEN 'cancelled'  THEN 'تم إلغاء طلبك'
    ELSE NULL
  END;

  IF status_label IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.notifications (user_id, type, title_ar, body_ar, link)
  VALUES (
    NEW.user_id,
    'order_status',
    status_label,
    'طلب رقم ' || NEW.order_number,
    '/account/orders'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_order_status_change ON public.orders;
CREATE TRIGGER on_order_status_change
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_order_status_change();
