import { describe, it, expect } from 'vitest'
import { extractInvoiceAmount, extractOrderId } from './payment'

describe('extractOrderId', () => {
  it('prefers CustomerReference when present', () => {
    expect(extractOrderId({ CustomerReference: 'order-1' })).toBe('order-1')
  })

  it('falls back through customerReference and CustomerReferenceNo casings', () => {
    expect(extractOrderId({ customerReference: 'order-2' })).toBe('order-2')
    expect(extractOrderId({ CustomerReferenceNo: 'order-3' })).toBe('order-3')
  })

  it('falls back to UserDefinedField, stripping the orderId: prefix', () => {
    expect(extractOrderId({ UserDefinedField: 'orderId:order-4' })).toBe('order-4')
  })

  it('falls back to userDefinedField (lowercase) too', () => {
    expect(extractOrderId({ userDefinedField: 'orderId:order-5' })).toBe('order-5')
  })

  it('returns UserDefinedField as-is when it has no orderId: prefix', () => {
    expect(extractOrderId({ UserDefinedField: 'order-6' })).toBe('order-6')
  })

  it('ignores blank/whitespace-only reference fields and falls through', () => {
    expect(extractOrderId({ CustomerReference: '   ', UserDefinedField: 'orderId:order-7' })).toBe('order-7')
  })

  it('returns undefined when nothing usable is present', () => {
    expect(extractOrderId({})).toBeUndefined()
    expect(extractOrderId({ UserDefinedField: '' })).toBeUndefined()
  })
})

describe('extractInvoiceAmount', () => {
  it('accepts numeric and numeric-string invoice values', () => {
    expect(extractInvoiceAmount({ InvoiceValue: 12.5 })).toBe(12.5)
    expect(extractInvoiceAmount({ InvoiceValue: '12.500' })).toBe(12.5)
  })

  it('rejects blank, negative, and non-numeric values', () => {
    expect(extractInvoiceAmount({ InvoiceValue: '' })).toBeUndefined()
    expect(extractInvoiceAmount({ InvoiceValue: -1 })).toBeUndefined()
    expect(extractInvoiceAmount({ InvoiceValue: 'not-a-number' })).toBeUndefined()
  })
})
