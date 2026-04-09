-- Order Tracking Table
CREATE TABLE IF NOT EXISTS order_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  status_label_ar TEXT NOT NULL,
  status_label_en TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  location TEXT,
  is_customer_visible BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_order_tracking_order_id ON order_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_order_tracking_created_at ON order_tracking(created_at DESC);

-- Add trigger for updated_at on orders table (if not exists)
CREATE OR REPLACE FUNCTION update_order_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Enable RLS
ALTER TABLE order_tracking ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY IF NOT EXISTS "Enable read access for order owners" ON order_tracking
  FOR SELECT USING (
    auth.uid() IN (
      SELECT auth.uid() FROM orders WHERE orders.id = order_tracking.order_id
    ) OR 
    auth.role() = 'authenticated'
  );

CREATE POLICY IF NOT EXISTS "Enable insert for admin only" ON order_tracking
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Enable update for admin only" ON order_tracking
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Enable delete for admin only" ON order_tracking
  FOR DELETE USING (auth.role() = 'authenticated');

-- Insert initial tracking statuses for existing orders
INSERT INTO order_tracking (order_id, status, status_label_ar, status_label_en, description_ar, is_customer_visible)
SELECT 
  id as order_id,
  status,
  CASE status
    WHEN 'pending' THEN 'قيد الانتظار'
    WHEN 'confirmed' THEN 'تم التأكيد'
    WHEN 'preparing' THEN 'جاري التحضير'
    WHEN 'shipped' THEN 'تم الشحن'
    WHEN 'delivered' THEN 'تم التوصيل'
    WHEN 'cancelled' THEN 'تم الإلغاء'
    ELSE status
  END as status_label_ar,
  CASE status
    WHEN 'pending' THEN 'Pending'
    WHEN 'confirmed' THEN 'Confirmed'
    WHEN 'preparing' THEN 'Preparing'
    WHEN 'shipped' THEN 'Shipped'
    WHEN 'delivered' THEN 'Delivered'
    WHEN 'cancelled' THEN 'Cancelled'
    ELSE status
  END as status_label_en,
  CASE status
    WHEN 'pending' THEN 'تم استلام طلبك وهو قيد المراجعة'
    WHEN 'confirmed' THEN 'تم تأكيد طلبك وسيتم تحضيره قريباً'
    WHEN 'preparing' THEN 'طلبك قيد التحضير حالياً'
    WHEN 'shipped' THEN 'تم شحن طلبك وهو في الطريق إليك'
    WHEN 'delivered' THEN 'تم توصيل طلبك بنجاح'
    WHEN 'cancelled' THEN 'تم إلغاء الطلب'
    ELSE 'تحديث حالة الطلب'
  END as description_ar,
  true as is_customer_visible
FROM orders
WHERE NOT EXISTS (SELECT 1 FROM order_tracking WHERE order_tracking.order_id = orders.id);
