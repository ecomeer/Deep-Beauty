export const KUWAIT_TIME_ZONE = 'Asia/Kuwait'

function getKuwaitDateParts(date: Date = new Date()): Record<string, string> {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: KUWAIT_TIME_ZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date)

  return Object.fromEntries(parts.map((part) => [part.type, part.value]))
}

export function getKuwaitDateKey(date: Date = new Date()): string {
  const values = getKuwaitDateParts(date)
  return `${values.year}${values.month}${values.day}`
}

export function getKuwaitIsoDateKey(date: Date = new Date()): string {
  const values = getKuwaitDateParts(date)
  return `${values.year}-${values.month}-${values.day}`
}

export function formatKuwaitDate(date: string | Date): string {
  return new Intl.DateTimeFormat('ar-KW', {
    timeZone: KUWAIT_TIME_ZONE,
    year: 'numeric', month: 'long', day: 'numeric',
  }).format(typeof date === 'string' ? new Date(date) : date)
}

export function formatKuwaitDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('ar-KW', {
    timeZone: KUWAIT_TIME_ZONE,
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(typeof date === 'string' ? new Date(date) : date)
}

/** Convert a Kuwait-local YYYY-MM-DD date to the UTC range used by Postgres. */
export function getKuwaitDayBounds(dateKey: string): { start: string; end: string } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) throw new Error('Invalid Kuwait date')
  const [year, month, day] = dateKey.split('-').map(Number)
  const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - 3 * 60 * 60 * 1000)
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1)
  return { start: start.toISOString(), end: end.toISOString() }
}

export function getKuwaitDateRange(dateFrom?: string | null, dateTo?: string | null): { from?: string; to?: string } {
  const range: { from?: string; to?: string } = {}
  if (dateFrom) range.from = getKuwaitDayBounds(dateFrom).start
  if (dateTo) range.to = getKuwaitDayBounds(dateTo).end
  return range
}
