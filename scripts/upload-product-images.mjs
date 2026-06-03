/**
 * upload-product-images.mjs
 * Uploads product images from a local folder to Supabase Storage,
 * then updates the products table with the new image URLs.
 *
 * Usage:
 *   node scripts/upload-product-images.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join, extname, basename } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

// Load env vars manually from .env.local (no dotenv dependency)
const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '../.env.local')
const envContent = readFileSync(envPath, 'utf-8')
for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eqIdx = trimmed.indexOf('=')
  if (eqIdx < 0) continue
  const key = trimmed.slice(0, eqIdx).trim()
  const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
  if (key && !process.env[key]) process.env[key] = val
}

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY
const BUCKET        = 'product-images'
const STORAGE_PATH  = 'products'
const IMAGES_DIR    = 'C:/Users/SURFACE/Downloads/drive-download-20260602T220606Z-3-001'

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ تأكد من وجود NEXT_PUBLIC_SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY في .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

// ─── Normalize Arabic text for matching ───────────────────────────────────
function normalize(str) {
  return str
    .toLowerCase()
    .replace(/[أإآا]/g, 'ا')   // normalize alef variants
    .replace(/[ىي]/g, 'ي')     // normalize yaa
    .replace(/ة/g, 'ه')         // normalize taa marbuta
    .replace(/\s+/g, ' ')
    .trim()
}

// ─── Build filename → clean name mapping ─────────────────────────────────
function cleanFilename(filename) {
  return basename(filename, extname(filename))
    .replace(/_\d{8}_\d{6}_\d{4}$/, '')  // remove date suffix like _20260602_221311_0000
    .replace(/\s+b5/gi, ' B5')            // normalize B5
    .trim()
}

// ─── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 بدء رفع صور المنتجات...\n')

  // 1. Fetch all products from DB
  const { data: products, error: dbErr } = await supabase
    .from('products')
    .select('id, name_ar, slug, images')
    .eq('is_active', true)

  if (dbErr) { console.error('❌ خطأ في جلب المنتجات:', dbErr.message); process.exit(1) }
  console.log(`✅ تم جلب ${products.length} منتج من قاعدة البيانات\n`)

  // 2. Read image files
  const files = readdirSync(IMAGES_DIR).filter(f => {
    const ext = extname(f).toLowerCase()
    const fullPath = join(IMAGES_DIR, f)
    return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) && statSync(fullPath).isFile()
  })
  console.log(`📁 وجدت ${files.length} صورة للرفع\n`)

  // 3. Match each file to a product
  const matched   = []
  const unmatched = []

  for (const file of files) {
    const cleanName = cleanFilename(file)
    const normalizedFile = normalize(cleanName)

    // Find best matching product
    const product = products.find(p => {
      const normalizedProduct = normalize(p.name_ar)
      return (
        normalizedProduct === normalizedFile ||
        normalizedProduct.includes(normalizedFile) ||
        normalizedFile.includes(normalizedProduct)
      )
    })

    if (product) {
      matched.push({ file, product, cleanName })
    } else {
      unmatched.push({ file, cleanName })
    }
  }

  // Remove duplicates (same product matched multiple times — keep _0000 version last)
  const deduplicated = []
  const seenProducts = new Set()
  for (const m of matched) {
    if (!seenProducts.has(m.product.id)) {
      seenProducts.add(m.product.id)
      deduplicated.push(m)
    } else {
      // If we see a newer version (with _0000 suffix), replace
      const idx = deduplicated.findIndex(d => d.product.id === m.product.id)
      if (m.file.includes('_0000')) deduplicated[idx] = m
    }
  }

  console.log('📋 المطابقة:')
  console.log('─'.repeat(60))
  for (const { file, product } of deduplicated) {
    console.log(`  ✅ ${file}`)
    console.log(`     → ${product.name_ar} (${product.slug})`)
  }
  if (unmatched.length > 0) {
    console.log('\n⚠️  لم تُطابَق:')
    for (const { file } of unmatched) console.log(`  ⚠️  ${file}`)
  }
  console.log()

  // 4. Upload each matched image
  let uploaded = 0
  let failed   = 0

  for (const { file, product } of deduplicated) {
    const filePath  = join(IMAGES_DIR, file)
    const ext       = extname(file).toLowerCase()
    const mimeMap   = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }
    const mime      = mimeMap[ext] || 'image/jpeg'
    const storagePath = `${STORAGE_PATH}/${product.slug}${ext}`

    process.stdout.write(`  ⬆️  رفع ${file} ... `)

    try {
      const fileBuffer = readFileSync(filePath)

      // Upload (upsert)
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, fileBuffer, { contentType: mime, upsert: true })

      if (upErr) throw upErr

      // Get public URL
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
      const publicUrl = urlData.publicUrl

      // Update product in DB
      const { error: updateErr } = await supabase
        .from('products')
        .update({ images: [publicUrl] })
        .eq('id', product.id)

      if (updateErr) throw updateErr

      console.log(`✅ تم (${(fileBuffer.length / 1024).toFixed(0)} KB)`)
      console.log(`     🔗 ${publicUrl}`)
      uploaded++

    } catch (err) {
      console.log(`❌ فشل: ${err.message}`)
      failed++
    }
  }

  // 5. Summary
  console.log('\n' + '═'.repeat(60))
  console.log(`✅ نجح الرفع: ${uploaded} صورة`)
  if (failed > 0)   console.log(`❌ فشل:       ${failed} صورة`)
  if (unmatched.length > 0) {
    console.log(`\n⚠️  الصور التالية لم تُطابَق بأي منتج (ارفعها يدوياً):`)
    unmatched.forEach(u => console.log(`   - ${u.file}`))
  }
  console.log('═'.repeat(60))
}

main().catch(err => {
  console.error('❌ خطأ غير متوقع:', err)
  process.exit(1)
})
