/**
 * setup-vercel-env.mjs
 * Adds all required production env vars to Vercel via REST API.
 *
 * Usage:
 *   VERCEL_TOKEN=xxxxx node scripts/setup-vercel-env.mjs
 *
 * Get a token from: https://vercel.com/account/tokens
 */

const TOKEN      = process.env.VERCEL_TOKEN
const PROJECT_ID = 'prj_Xtr93VzVVWkhsXZKBuNpt6cBOLCD'
const TEAM_ID    = 'team_lw7p4mg5QPhqNAe6gufuGO2X'

if (!TOKEN) {
  console.error('❌ Set VERCEL_TOKEN first:')
  console.error('   VERCEL_TOKEN=xxx node scripts/setup-vercel-env.mjs')
  console.error('')
  console.error('   Get a token from: https://vercel.com/account/tokens')
  process.exit(1)
}

// ─── Variables to add ─────────────────────────────────────────────────────
// Format: { key, value, environments, sensitive }
// environments: ['production'] | ['preview'] | ['development'] | ['production','preview','development']
const ENV_VARS = [
  {
    key: 'NEXT_PUBLIC_SITE_URL',
    value: 'https://www.deepbeautykw.com',
    environments: ['production', 'preview'],
    sensitive: false,
  },
  {
    key: 'ADMIN_EMAILS',
    value: 'mediatrendkw@gmail.com',
    environments: ['production', 'preview', 'development'],
    sensitive: true,
  },
  {
    key: 'ADMIN_EMAIL',
    value: 'mediatrendkw@gmail.com',
    environments: ['production', 'preview', 'development'],
    sensitive: true,
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────
async function listExisting() {
  const res = await fetch(
    `https://api.vercel.com/v9/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}`,
    { headers: { Authorization: `Bearer ${TOKEN}` } }
  )
  if (!res.ok) {
    const err = await res.json()
    throw new Error(`Failed to list env vars: ${JSON.stringify(err)}`)
  }
  const { envs } = await res.json()
  return envs ?? []
}

async function addOrUpdate(envVar, existing) {
  const existingVar = existing.find(e => e.key === envVar.key)

  if (existingVar) {
    // Update existing
    const res = await fetch(
      `https://api.vercel.com/v9/projects/${PROJECT_ID}/env/${existingVar.id}?teamId=${TEAM_ID}`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          value: envVar.value,
          target: envVar.environments,
          type: envVar.sensitive ? 'sensitive' : 'plain',
        }),
      }
    )
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error?.message || JSON.stringify(err))
    }
    return 'updated'
  }

  // Create new
  const res = await fetch(
    `https://api.vercel.com/v10/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: envVar.key,
        value: envVar.value,
        target: envVar.environments,
        type: envVar.sensitive ? 'sensitive' : 'plain',
      }),
    }
  )
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || JSON.stringify(err))
  }
  return 'created'
}

async function verifyNoBadVars(existing) {
  const dangerous = ['NEXT_PUBLIC_DEV_BYPASS']
  const found = existing.filter(e => dangerous.includes(e.key))
  if (found.length > 0) {
    console.warn('\n⚠️  خطر! المتغيرات التالية يجب حذفها من Vercel:')
    for (const v of found) {
      console.warn(`   - ${v.key} (موجود في: ${v.target?.join(', ')})`)
    }
  } else {
    console.log('✅ NEXT_PUBLIC_DEV_BYPASS غائب من Vercel — آمن')
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 إضافة متغيرات البيئة إلى Vercel...\n')

  let existing
  try {
    existing = await listExisting()
    console.log(`📋 متغيرات موجودة: ${existing.length}`)
    existing.forEach(e => console.log(`   - ${e.key} (${e.target?.join(', ')})`))
    console.log()
  } catch (e) {
    console.error('❌ فشل في جلب المتغيرات:', e.message)
    process.exit(1)
  }

  // Verify no dangerous vars
  await verifyNoBadVars(existing)
  console.log()

  // Add/update each var
  for (const envVar of ENV_VARS) {
    process.stdout.write(`  ➕ ${envVar.key} ... `)
    try {
      const action = await addOrUpdate(envVar, existing)
      console.log(`✅ ${action}`)
    } catch (e) {
      console.log(`❌ ${e.message}`)
    }
  }

  console.log('\n══════════════════════════════════')
  console.log('✅ اكتمل! أعد النشر على Vercel:')
  console.log('   git push origin main')
  console.log('══════════════════════════════════')
}

main().catch(e => { console.error('❌', e); process.exit(1) })
