/**
 * upload-remaining-images.mjs
 * Uploads the 5 unmatched images manually mapped to products,
 * then ADDS them to the product's images array (not replacing).
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, extname } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
const envContent = readFileSync(join(__dir, '../.env.local'), 'utf-8')
for (const line of envContent.split('\n')) {
  const t = line.trim()
  if (!t || t.startsWith('#')) continue
  const eq = t.indexOf('=')
  if (eq < 0) continue
  const k = t.slice(0, eq).trim()
  const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
  if (k && !process.env[k]) process.env[k] = v
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const BUCKET     = 'product-images'
const IMAGES_DIR = 'C:/Users/SURFACE/Downloads/drive-download-20260602T220606Z-3-001'

// ─── Manual mapping: file → product slug ──────────────────────────────────
// Logic:
//   سنفرة للرجال.jpg   → سكراب صابوني رجالي  (men's scrub)
//   صابونية للرجال.jpg → سكراب صابوني رجالي  (men's soap — 2nd image)
//   كريم للرجال.jpg    → لوشن رجالي            (men's lotion/cream)
//   مجموعة الأرز واللبان.jpg → كريم الأرز واللبان (rice & frankincense cream — group shot)
//   مجموعة للرجال.jpg  → لوشن رجالي            (men's group shot — 2nd image)
const MANUAL_MAP = [
  { file: 'سنفرة للرجال.jpg',           slug: 'skrab-sabooni-rijali',       addAsSecond: false },
  { file: 'صابونية للرجال.jpg',          slug: 'skrab-sabooni-rijali',       addAsSecond: true  },
  { file: 'كريم للرجال.jpg',            slug: 'lotion-rijali',               addAsSecond: false },
  { file: 'مجموعة الأرز واللبان.jpg',  slug: 'krim-al-arz-wal-luban',       addAsSecond: false },
  { file: 'مجموعة للرجال.jpg',          slug: 'lotion-rijali',               addAsSecond: true  },
]

async function main() {
  console.log('🚀 رفع الصور المتبقية...\n')

  for (const { file, slug, addAsSecond } of MANUAL_MAP) {
    const filePath = join(IMAGES_DIR, file)
    const ext      = extname(file).toLowerCase()
    const mimeMap  = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' }
    const mime     = mimeMap[ext] || 'image/jpeg'
    // Use a unique storage path to avoid overwriting
    const storageKey = addAsSecond ? `${slug}-2${ext}` : `${slug}${ext}`
    const storagePath = `products/${storageKey}`

    process.stdout.write(`  ⬆️  ${file} → ${slug}${addAsSecond ? ' (صورة ٢)' : ''} ... `)

    try {
      const buffer = readFileSync(filePath)

      // Upload
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, buffer, { contentType: mime, upsert: true })
      if (upErr) throw upErr

      // Get public URL
      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)

      // Fetch current product images
      const { data: product, error: fetchErr } = await supabase
        .from('products')
        .select('id, images')
        .eq('slug', slug)
        .single()
      if (fetchErr) throw fetchErr

      // Update images array
      const currentImages = product.images || []
      const newImages = addAsSecond
        ? [...new Set([...currentImages, publicUrl])]  // add to existing
        : [publicUrl, ...currentImages.filter(u => !u.includes(slug))]  // set as primary

      const { error: updateErr } = await supabase
        .from('products')
        .update({ images: newImages })
        .eq('id', product.id)
      if (updateErr) throw updateErr

      console.log(`✅ تم (${(buffer.length / 1024).toFixed(0)} KB)`)
      console.log(`     🔗 ${publicUrl}`)

    } catch (err) {
      console.log(`❌ ${err.message}`)
    }
  }

  // Verify final state
  console.log('\n📊 الحالة النهائية:')
  const { data } = await supabase
    .from('products')
    .select('name_ar, images')
    .eq('is_active', true)
    .order('name_ar')

  for (const p of data) {
    const count = p.images?.length || 0
    const icon  = count > 0 ? '🖼️ ' : '❌'
    console.log(`  ${icon} ${p.name_ar}: ${count} صورة`)
  }
}

main().catch(e => { console.error('❌', e); process.exit(1) })
