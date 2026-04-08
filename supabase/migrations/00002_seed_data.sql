-- ==========================================
-- 00002_seed_data.sql
-- Mock Data for Deep Beauty
-- ==========================================

-- INSERT CATEGORIES
INSERT INTO public.categories (id, name_ar, name_en, slug, is_active)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'العناية بالوجه', 'Face Care', 'face-care', true),
    ('22222222-2222-2222-2222-222222222222', 'العناية بالجسم', 'Body Care', 'body-care', true),
    ('33333333-3333-3333-3333-333333333333', 'مجموعات الهدايا', 'Gift Sets', 'gift-sets', true)
ON CONFLICT (slug) DO NOTHING;

-- INSERT PRODUCTS
INSERT INTO public.products (name_ar, name_en, slug, description_ar, description_en, price, compare_price, images, category, stock_quantity, is_active, is_featured, ingredients_ar)
VALUES 
    (
        'سيروم النضارة بخلاصة فيتامين سي', 
        'Vitamin C Radiance Serum', 
        'vitamin-c-radiance-serum', 
        'سيروم غني بفيتامين سي المركز لتفتيح البشرة، توحيد لونها، وإعطائها نضارة وإشراقة طبيعية. يعمل على مكافحة علامات التقدم بالسن وتجديد الخلايا.', 
        'A concentrated Vitamin C serum that brightens and evens out skin tone, giving it a natural radiance. Fights signs of aging and rejuvenates cells.', 
        28.500, 
        35.000, 
        ARRAY['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800&auto=format&fit=crop'], 
        'العناية بالوجه', 
        50, 
        true, 
        true,
        'ماء، فيتامين سي (حمض الأسكوربيك)، حمض الهيالورونيك، خلاصة الصبار، جليسرين نباتي'
    ),
    (
        'كريم الترطيب العميق الليلي', 
        'Deep Hydration Night Cream', 
        'deep-hydration-night-cream', 
        'كريم ليلي غني ومغذي يمنح بشرتك ترطيباً عميقاً أثناء النوم. يحتوي على حمض الهيالورونيك والزيوت الطبيعية لاستعادة نعومة ومرونة البشرة.', 
        'A rich, nourishing night cream providing deep hydration while you sleep. Contains Hyaluronic acid and natural oils to restore skin softness and elasticity.', 
        32.000, 
        null, 
        ARRAY['https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=800&auto=format&fit=crop'], 
        'العناية بالوجه', 
        30, 
        true, 
        true,
        'زبدة الشيا، حمض الهيالورونيك، زيت الجوجوبا، فيتامين E، خلاصة البابونج'
    ),
    (
        'زيت الأرجان النقي للجسم', 
        'Pure Argan Body Oil', 
        'pure-argan-body-oil', 
        'زيت جسم فاخر وطبيعي %100 المعصور على البارد. يغذي البشرة بفضل احتوائه على مضادات الأكسدة ويتركها ناعمة كالحرير دون ملمس دهني.', 
        'Luxurious 100% natural cold-pressed body oil. Nourishes skin with antioxidants, leaving it silky smooth without a greasy feel.', 
        18.750, 
        22.000, 
        ARRAY['https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=800&auto=format&fit=crop'], 
        'العناية بالجسم', 
        100, 
        true, 
        false,
        'زيت الأرجان العضوي الصافي المعصور على البارد'
    ),
    (
        'غسول رغوي منقي بالورد', 
        'Purifying Rose Foaming Cleanser', 
        'purifying-rose-foaming-cleanser', 
        'غسول يومي لطيف يتحول إلى رغوة غنية وينظف مسام البشرة بعمق، معزز بخلاصة ماء الورد لتهدئة البشرة وتركها منتعشة.', 
        'A gentle daily foaming cleanser that deeply cleanses pores. Infused with rose water extract to soothe and refresh skin.', 
        14.500, 
        null, 
        ARRAY['https://images.unsplash.com/photo-1556228720-1c2a46895ca0?q=80&w=800&auto=format&fit=crop'], 
        'العناية بالوجه', 
        85, 
        true, 
        true,
        'ماء الورد المقطر، جليسرين، منظفات مشتقة من جوز الهند، خلاصة الشاي الأخضر'
    ),
    (
        'مجموعة الهدية الذهبية', 
        'Golden Gift Set', 
        'golden-gift-set', 
        'الهدية المثالية لمن تحب! تتضمن أفضل ثلاث منتجات مبيعاً لدينا لتكوين روتين عناية متكامل، في صندوق فاخر.', 
        'The perfect gift! Includes our top 3 best-selling products for a complete skincare routine, packaged in a luxurious box.', 
        65.000, 
        80.000, 
        ARRAY['https://images.unsplash.com/photo-1599305090598-fe179d501227?q=80&w=800&auto=format&fit=crop'], 
        'مجموعات الهدايا', 
        15, 
        true, 
        true,
        'تتضمن السيروم، الغسول وكريم الليل'
    )
ON CONFLICT (slug) DO NOTHING;

-- INSERT COUPONS
INSERT INTO public.coupons (code, description_ar, type, value, min_order_amount, is_active, expires_at)
VALUES 
    ('NEW10', 'خصم ترحيبي 10%', 'percentage', 10, 0, true, timezone('utc'::text, now() + interval '30 days')),
    ('VIP20', 'خصم للعملاء المميزين 20 دينار', 'fixed', 20, 50, true, timezone('utc'::text, now() + interval '30 days'))
ON CONFLICT (code) DO NOTHING;
