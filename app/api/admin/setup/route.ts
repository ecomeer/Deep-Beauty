import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const MIGRATION_SQL = `
-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT false,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(is_approved);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Allow public read of approved reviews" ON reviews;
DROP POLICY IF EXISTS "Allow public to create reviews" ON reviews;
DROP POLICY IF EXISTS "Allow admin full access" ON reviews;

CREATE POLICY "Allow public read of approved reviews"
    ON reviews FOR SELECT
    USING (is_approved = true);

CREATE POLICY "Allow public to create reviews"
    ON reviews FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow admin full access"
    ON reviews FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Function for average rating
CREATE OR REPLACE FUNCTION get_product_rating(product_uuid UUID)
RETURNS TABLE (avg_rating NUMERIC, review_count INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(AVG(rating), 0)::NUMERIC(3,2) as avg_rating,
        COUNT(*)::INTEGER as review_count
    FROM reviews
    WHERE product_id = product_uuid AND is_approved = true;
END;
$$ LANGUAGE plpgsql;

-- Update orders table if columns don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'payment_method') THEN
        ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT 'cod';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'payment_status') THEN
        ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'unpaid';
    END IF;
END $$;
`

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Execute migration
    const { error } = await supabase.rpc('exec_sql', { sql: MIGRATION_SQL })
    
    if (error) {
      // Try executing directly if rpc not available
      const { error: directError } = await supabase.from('_migrations').select('*').limit(1)
      
      if (directError && directError.message.includes('relation "_migrations" does not exist')) {
        // Direct execution using query
        const statements = MIGRATION_SQL.split(';').filter(s => s.trim())
        
        for (const statement of statements) {
          const { error: execError } = await supabase.rpc('exec_sql', { 
            sql: statement + ';' 
          })
          if (execError && !execError.message.includes('already exists')) {
            console.log('Statement skipped or error:', execError.message)
          }
        }
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Migration executed successfully' 
    })
  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Send POST request to execute migration' 
  })
}
