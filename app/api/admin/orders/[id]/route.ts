import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()

  const updateFields: Record<string, string> = {}
  if (body.status !== undefined) updateFields.status = body.status
  if (body.payment_status !== undefined) updateFields.payment_status = body.payment_status

  const { data, error } = await supabaseAdmin
    .from('orders')
    .update(updateFields)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}
