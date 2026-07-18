import * as Sentry from '@sentry/nextjs'

// Server-side error monitoring — active only when SENTRY_DSN is configured,
// so local development and forks without a Sentry account are unaffected.
export async function register() {
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
  if (!dsn) return
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    enableLogs: false,
  })
}

export const onRequestError = Sentry.captureRequestError
