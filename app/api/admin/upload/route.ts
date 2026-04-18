import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-admin'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
const MAX_SIZE_MB = 5

export async function POST(req: NextRequest) {
  const authErr = await requireAdmin(req)
  if (authErr) return authErr

  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    const folder = (form.get('folder') as string) || 'misc'

    if (!file) {
      return NextResponse.json({ error: 'لم يتم إرفاق ملف' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'نوع الملف غير مدعوم. يُسمح بـ JPG/PNG/WebP/GIF/AVIF فقط' }, { status: 400 })
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json({ error: `حجم الملف يتجاوز ${MAX_SIZE_MB}MB` }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const safeName = `${Date.now()}.${ext}`
    const uploadPath = `${folder}/${safeName}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from('product-images')
      .upload(uploadPath, file, { upsert: true, contentType: file.type })

    if (uploadError) {
      // Bucket might not exist — try to create it
      if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('not found')) {
        return NextResponse.json({
          error: 'storage bucket "product-images" غير موجود في Supabase. أنشئه من Storage dashboard.'
        }, { status: 500 })
      }
      return NextResponse.json({ error: `فشل الرفع: ${uploadError.message}` }, { status: 500 })
    }

    const { data } = supabaseAdmin.storage.from('product-images').getPublicUrl(uploadPath)
    return NextResponse.json({ url: data.publicUrl })
  } catch (err) {
    return NextResponse.json({ error: `خطأ في الخادم: ${String(err)}` }, { status: 500 })
  }
}
