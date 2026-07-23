// Client-side helper for admin image uploads.
//
// Vercel serverless functions reject request bodies larger than ~4.5MB at the
// platform edge with a plain-text 413 ("Request Entity Too Large") — before our
// handler runs. Calling `res.json()` on that body throws a SyntaxError, and the
// user just sees a broken upload. This helper:
//   1. Downscales/compresses oversized raster images so large photos still
//      upload instead of failing.
//   2. Rejects anything still over the limit with a friendly Arabic message
//      (never a raw 413).
//   3. Parses error responses defensively (handles non-JSON bodies).

export const MAX_UPLOAD_MB = 4
const MAX_BYTES = MAX_UPLOAD_MB * 1024 * 1024
const MAX_DIMENSION = 2000

// Try to shrink an over-limit raster image via canvas. Best-effort: returns the
// original file if it can't help (unsupported type, decode failure, etc.).
async function maybeCompress(file: File): Promise<File> {
  if (file.size <= MAX_BYTES) return file
  if (!/^image\/(jpe?g|png|webp)$/i.test(file.type)) return file // can't re-encode gif/avif/svg
  try {
    const bitmap = await createImageBitmap(file)
    let { width, height } = bitmap
    if (Math.max(width, height) > MAX_DIMENSION) {
      const scale = MAX_DIMENSION / Math.max(width, height)
      width = Math.round(width * scale)
      height = Math.round(height * scale)
    }
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, width, height)

    let quality = 0.85
    let blob: Blob | null = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', quality))
    while (blob && blob.size > MAX_BYTES && quality > 0.4) {
      quality -= 0.15
      blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', quality))
    }
    if (blob && blob.size < file.size) {
      return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
    }
    return file
  } catch {
    return file
  }
}

/**
 * Uploads an image via /api/admin/upload and returns its public URL.
 * Throws an Error with a user-facing Arabic message on any failure.
 */
export async function uploadAdminImage(file: File, folder: string): Promise<string> {
  const prepared = await maybeCompress(file)
  if (prepared.size > MAX_BYTES) {
    throw new Error(`حجم الصورة يتجاوز ${MAX_UPLOAD_MB}MB — يرجى اختيار صورة أصغر`)
  }

  const formData = new FormData()
  formData.append('file', prepared)
  formData.append('folder', folder)

  const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
  if (!res.ok) {
    if (res.status === 413) {
      throw new Error(`حجم الصورة كبير جداً — الحد الأقصى ${MAX_UPLOAD_MB}MB`)
    }
    let message = 'فشل رفع الصورة'
    try {
      const data = await res.json()
      if (data?.error) message = data.error
    } catch {
      // Non-JSON error body (e.g. a platform plain-text response) — keep default.
    }
    throw new Error(message)
  }

  const data = (await res.json().catch(() => ({}))) as { url?: string }
  if (!data.url) throw new Error('فشل رفع الصورة')
  return data.url
}
