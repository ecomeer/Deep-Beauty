// This endpoint has been permanently disabled.
// Database migrations are managed via supabase/migrations/*.sql files.
import { NextResponse } from 'next/server'

const msg = { error: 'This endpoint has been removed. Run migrations via the Supabase CLI.' }

export async function GET() {
  return NextResponse.json(msg, { status: 410 })
}

export async function POST() {
  return NextResponse.json(msg, { status: 410 })
}
