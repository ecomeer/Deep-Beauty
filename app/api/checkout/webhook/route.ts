import { NextRequest, NextResponse } from 'next/server'

// Minimal webhook endpoint for Tap callbacks.
// Full signature verification and payment reconciliation can be added later.
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => null)
    if (payload) {
      console.log('Tap webhook received')
    }
    return NextResponse.json({ received: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Webhook processing error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
