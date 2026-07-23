export const KUWAIT_TIME_ZONE = 'Asia/Kuwait'

const DAY_MS = 24 * 60 * 60 * 1000

export function kuwaitDateKey(value: string | number | Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: KUWAIT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value))
  const get = (type: string) => parts.find((part) => part.type === type)?.value || ''
  return `${get('year')}-${get('month')}-${get('day')}`
}

/**
 * Returns midnight in Kuwait as an absolute UTC Date.
 * Kuwait is UTC+03:00 year-round and does not observe daylight saving time.
 */
export function startOfKuwaitDayUtc(
  value: string | number | Date = new Date(),
  dayOffset = 0
): Date {
  const [year, month, day] = kuwaitDateKey(value).split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day + dayOffset, -3))
}

export function kuwaitDaysAgo(value: string | number | Date, days: number): Date {
  return new Date(new Date(value).getTime() - days * DAY_MS)
}
