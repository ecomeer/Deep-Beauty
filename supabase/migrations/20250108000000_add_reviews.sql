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

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(is_approved);

-- Create RLS policies
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read approved reviews
CREATE POLICY "Allow public read of approved reviews"
    ON reviews FOR SELECT
    USING (is_approved = true);

-- Allow anyone to create reviews (pending approval)
CREATE POLICY "Allow public to create reviews"
    ON reviews FOR INSERT
    WITH CHECK (true);

-- Allow admin to update/delete reviews
CREATE POLICY "Allow admin full access"
    ON reviews FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Function to calculate average rating for a product
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
