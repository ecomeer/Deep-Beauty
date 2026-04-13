/**
 * Apply Supabase Migration - Simple Version
 * Run: node scripts/apply-migration-simple.mjs
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local')
  const content = fs.readFileSync(envPath, 'utf8')
  const env = {}
  content.split('\n').forEach(line => {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) env[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, '')
  })
  return env
}

async function main() {
  const env = loadEnv()
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const key = env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !key) {
    console.error('❌ Missing credentials in .env.local')
    process.exit(1)
  }

  const supabase = createClient(url, key)

  // Check if table exists
  const { error: checkError } = await supabase
    .from('marketing_campaigns')
    .select('count', { count: 'exact', head: true })

  if (!checkError || checkError.code !== '42P01') {
    console.log('✅ Table "marketing_campaigns" already exists!')
    return
  }

  console.log('📦 Creating marketing_campaigns table...')

  // Try to execute SQL via REST API
  const sql = `
    CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      title text NOT NULL,
      description text,
      type text NOT NULL CHECK (type IN ('email', 'sms', 'push', 'social')),
      target_audience text DEFAULT 'all' CHECK (target_audience IN ('all', 'customers', 'vip', 'new')),
      content jsonb NOT NULL,
      scheduled_at timestamptz,
      sent_at timestamptz,
      is_active boolean DEFAULT true,
      sent_count integer DEFAULT 0,
      created_at timestamptz DEFAULT now()
    );
    ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
  `

  // Use raw SQL via the query endpoint
  const queryUrl = `${url}/rest/v1/`
  
  try {
    const response = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'apikey': key
      },
      body: JSON.stringify({ sql })
    })

    if (!response.ok) {
      // Fallback: show SQL for manual execution
      console.log('\n⚠️  Auto-apply requires exec_sql RPC function.')
      console.log('📋 Please execute this SQL in Supabase Studio:')
      console.log('=' .repeat(60))
      console.log(sql.trim())
      console.log('=' .repeat(60))
      console.log('\n🌐 Or visit: https://supabase.com/dashboard/project/_/sql/new')
      
      // Also create a SQL file for easy copy
      const easyPath = path.join(__dirname, '..', 'supabase', 'apply-now.sql')
      fs.writeFileSync(easyPath, sql.trim())
      console.log(`\n💾 SQL saved to: ${easyPath}`)
    } else {
      console.log('✅ Migration applied successfully!')
    }
  } catch (e) {
    console.error('❌ Error:', e.message)
  }
}

main()
