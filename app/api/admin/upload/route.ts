import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('file') as File
    const folder = (form.get('folder') as string) || 'misc'

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    // Validate Supabase Admin is configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is missing')
      return NextResponse.json({ error: 'Server configuration error: Missing service role key' }, { status: 500 })
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${folder}/${Date.now()}-${safeName}`
    console.log('Uploading file to:', path)

    const { error } = await supabaseAdmin.storage.from('product-images').upload(path, file, { upsert: true })

    if (error) {
      console.error('Supabase upload error:', error)
      return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 })
    }

    const { data } = supabaseAdmin.storage.from('product-images').getPublicUrl(path)
    console.log('File uploaded successfully:', data.publicUrl)
    return NextResponse.json({ url: data.publicUrl })
  } catch (err) {
    console.error('Upload API error:', err)
    return NextResponse.json({ error: `Server error: ${String(err)}` }, { status: 500 })
  }
}
