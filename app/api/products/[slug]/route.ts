import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const [productRes, relatedRes] = await Promise.all([
    supabaseAdmin.from('products').select('*').eq('slug', slug).eq('is_active', true).single(),
    supabaseAdmin.from('products').select('*').eq('is_active', true).limit(4),
  ])

  if (productRes.error || !productRes.data)
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  const product = productRes.data
  const related = (relatedRes.data || [])
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4)

  return NextResponse.json({ product, related })
}
