import { NextResponse } from 'next/server'

// Deprecated: role sync is now handled by the login API directly.
export async function POST() {
  return NextResponse.json({ ok: true })
}

export async function GET() {
  return NextResponse.json({ ok: true })
}
