// Minimal CSV export for admin list pages — no dependency needed for a
// handful of flat rows. Escapes per RFC 4180: wrap in quotes if the value
// contains a comma, quote, or newline; double up any internal quotes.

export function toCsv<T extends object>(
  rows: T[],
  columns: { key: keyof T; label: string }[]
): string {
  const escape = (value: unknown): string => {
    const str = value == null ? '' : String(value)
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
  }

  const header = columns.map((c) => escape(c.label)).join(',')
  const lines = rows.map((row) => columns.map((c) => escape(row[c.key])).join(','))
  return [header, ...lines].join('\r\n')
}

export function downloadCsv(filename: string, csv: string): void {
  // ﻿: UTF-8 BOM so Excel opens Arabic text correctly instead of mojibake.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
