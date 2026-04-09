import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const message = searchParams.get('message') || 'unknown_error'

  return NextResponse.redirect(
    new URL(`/payment-failed?reason=${encodeURIComponent(message)}`, request.url)
  )
}
