import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-admin'

export async function POST(req: NextRequest) {
  const authErr = await requireAdmin(req)
  if (authErr) return authErr
  return NextResponse.json({ ok: true })
}

export async function GET(req: NextRequest) {
  const authErr = await requireAdmin(req)
  if (authErr) return authErr
  return NextResponse.json({ ok: true })
}
