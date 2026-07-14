import { describe, it, expect } from 'vitest'
import { toCsv } from './csv'

describe('toCsv', () => {
  it('builds a header row and data rows in column order', () => {
    const csv = toCsv(
      [{ name: 'Ali', age: 30 }, { name: 'Sara', age: 25 }],
      [{ key: 'name', label: 'Name' }, { key: 'age', label: 'Age' }]
    )
    expect(csv).toBe('Name,Age\r\nAli,30\r\nSara,25')
  })

  it('quotes and escapes values containing commas, quotes, or newlines', () => {
    const csv = toCsv(
      [{ note: 'hello, "world"\nline2' }],
      [{ key: 'note', label: 'Note' }]
    )
    expect(csv).toBe('Note\r\n"hello, ""world""\nline2"')
  })

  it('renders null/undefined values as empty strings', () => {
    const csv = toCsv([{ v: null }, { v: undefined }], [{ key: 'v', label: 'V' }])
    expect(csv).toBe('V\r\n\r\n')
  })
})
