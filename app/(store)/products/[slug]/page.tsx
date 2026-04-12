import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import EnhancedProductDetail from './EnhancedProductDetail'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('products')
    .select('name_ar, description_ar, images')
    .eq('slug', slug)
    .single()

  if (!data) return { title: 'منتج | Deep Beauty' }

  return {
    title: `${data.name_ar} | Deep Beauty`,
    description: data.description_ar ?? undefined,
    openGraph: {
      title: data.name_ar,
      description: data.description_ar ?? undefined,
      images: data.images?.[0] ? [{ url: data.images[0] }] : [],
    },
  }
}

export default function ProductPage() {
  return <EnhancedProductDetail />
}
