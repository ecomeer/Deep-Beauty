import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('file') as File
    const folder = (form.get('folder') as string) || 'misc'

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const path = `${folder}/${Date.now()}-${file.name}`
    const { error } = await supabaseAdmin.storage.from('product-images').upload(path, file, { upsert: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { data } = supabaseAdmin.storage.from('product-images').getPublicUrl(path)
    return NextResponse.json({ url: data.publicUrl })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
