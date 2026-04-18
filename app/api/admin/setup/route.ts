// This endpoint has been permanently disabled.
// Database migrations are managed via supabase/migrations/*.sql files.
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-admin'

const msg = { error: 'This endpoint has been removed. Run migrations via the Supabase CLI.' }

export async function GET(req: NextRequest) {
  const _authErr = await requireAdmin(req)
  if (_authErr) return _authErr
  return NextResponse.json(msg, { status: 410 })
}

export async function POST(req: NextRequest) {
  const _authErr = await requireAdmin(req)
  if (_authErr) return _authErr
  return NextResponse.json(msg, { status: 410 })
}
