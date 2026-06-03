/**
 * Generates og-image.jpg for Deep Beauty
 * Uses pure SVG → PNG via the built-in Resvg if available, or creates
 * a simple gradient SVG that can be converted manually.
 *
 * Run: node scripts/generate-og-image.mjs
 */

import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dir, '../public/og-image.jpg')

// ── SVG template (1200×630 — standard OG size) ─────────────────────
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#faf7f4;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#eee0d5;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#8B5E3C;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#b8845f;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Decorative circles -->
  <circle cx="1050" cy="80"  r="200" fill="#8B5E3C" opacity="0.06"/>
  <circle cx="1100" cy="550" r="150" fill="#8B5E3C" opacity="0.05"/>
  <circle cx="100"  cy="550" r="120" fill="#8B5E3C" opacity="0.04"/>

  <!-- Left accent bar -->
  <rect x="80" y="200" width="6" height="230" rx="3" fill="url(#accent)"/>

  <!-- Brand name -->
  <text
    x="120" y="300"
    font-family="Georgia, serif"
    font-size="72"
    font-weight="600"
    fill="#3a2a1e"
    letter-spacing="2"
  >Deep Beauty</text>

  <!-- Arabic tagline -->
  <text
    x="120" y="365"
    font-family="Arial, sans-serif"
    font-size="32"
    fill="#8B5E3C"
    letter-spacing="1"
  >ديب بيوتي | جمالك يبدأ من الأعماق</text>

  <!-- Description -->
  <text
    x="120" y="420"
    font-family="Arial, sans-serif"
    font-size="22"
    fill="#7a6055"
  >عناية فاخرة بالبشرة — منتجات طبيعية ١٠٠٪ من الكويت</text>

  <!-- Bottom accent line -->
  <rect x="80" y="480" width="400" height="3" rx="1.5" fill="url(#accent)" opacity="0.6"/>

  <!-- Domain -->
  <text
    x="120" y="540"
    font-family="Georgia, serif"
    font-size="22"
    fill="#8B5E3C"
    opacity="0.7"
  >www.deepbeautykw.com</text>

  <!-- Right decorative element -->
  <g transform="translate(850, 200)">
    <circle cx="150" cy="150" r="130" fill="none" stroke="#8B5E3C" stroke-width="1.5" opacity="0.2"/>
    <circle cx="150" cy="150" r="90"  fill="none" stroke="#8B5E3C" stroke-width="1"   opacity="0.15"/>
    <circle cx="150" cy="150" r="50"  fill="#8B5E3C" opacity="0.08"/>
    <!-- BD logo placeholder -->
    <text x="150" y="165" text-anchor="middle" font-family="Georgia,serif" font-size="48" font-weight="700" fill="#8B5E3C" opacity="0.4">BD</text>
  </g>
</svg>
`.trim()

// Write SVG version (can be opened in browser and saved as JPG/PNG)
const svgPath = join(__dir, '../public/og-image.svg')
writeFileSync(svgPath, svg, 'utf-8')
console.log('✅ SVG written to public/og-image.svg')
console.log('')
console.log('📋 Next steps:')
console.log('   1. Open public/og-image.svg in Chrome')
console.log('   2. Right-click → Save as image (PNG), rename to og-image.jpg')
console.log('   OR use an online converter: https://svgtopng.com/')
console.log('')
console.log('   Alternatively, install sharp and rerun:')
console.log('   npm install sharp && node scripts/generate-og-image.mjs --sharp')

// If --sharp flag passed and sharp is available, convert automatically
if (process.argv.includes('--sharp')) {
  try {
    const sharp = (await import('sharp')).default
    await sharp(Buffer.from(svg))
      .jpeg({ quality: 92 })
      .toFile(OUT)
    console.log('✅ og-image.jpg generated at public/og-image.jpg')
  } catch {
    console.log('❌ sharp not installed. Run: npm install --save-dev sharp')
  }
}
