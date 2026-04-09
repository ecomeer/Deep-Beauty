-- Shipping Zones Table
CREATE TABLE IF NOT EXISTS shipping_zones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  countries TEXT[] NOT NULL DEFAULT '{}',
  base_rate DECIMAL(10,3) NOT NULL DEFAULT 0,
  free_shipping_threshold DECIMAL(10,3),
  estimated_days_min INTEGER NOT NULL DEFAULT 1,
  estimated_days_max INTEGER NOT NULL DEFAULT 3,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS update_shipping_zones_updated_at
  BEFORE UPDATE ON shipping_zones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default shipping zones for Gulf countries
INSERT INTO shipping_zones (name_ar, name_en, countries, base_rate, free_shipping_threshold, estimated_days_min, estimated_days_max, is_active, sort_order)
VALUES
  ('الكويت', 'Kuwait', ARRAY['KW'], 0, NULL, 1, 2, true, 1),
  ('السعودية', 'Saudi Arabia', ARRAY['SA'], 2.500, 50.000, 3, 5, true, 2),
  ('الإمارات', 'UAE', ARRAY['AE'], 2.500, 50.000, 2, 4, true, 3),
  ('قطر', 'Qatar', ARRAY['QA'], 3.000, 50.000, 2, 4, true, 4),
  ('البحرين', 'Bahrain', ARRAY['BH'], 2.500, 50.000, 2, 3, true, 5),
  ('عمان', 'Oman', ARRAY['OM'], 3.500, 60.000, 3, 5, true, 6)
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE shipping_zones ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON shipping_zones
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Enable all access for admin" ON shipping_zones
  FOR ALL USING (auth.role() = 'authenticated');
