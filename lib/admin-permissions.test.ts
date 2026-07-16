import { describe, it, expect } from 'vitest'
import { PERMISSIONS, PERMISSION_LABELS, isPermission } from './admin-permissions'

describe('isPermission', () => {
  it('accepts every declared permission', () => {
    for (const p of PERMISSIONS) {
      expect(isPermission(p)).toBe(true)
    }
  })

  it('rejects unknown values, including the reserved staff scope', () => {
    expect(isPermission('staff')).toBe(false)
    expect(isPermission('admin')).toBe(false)
    expect(isPermission('')).toBe(false)
    expect(isPermission('Orders')).toBe(false)
  })
})

describe('PERMISSION_LABELS', () => {
  it('has an Arabic label for every permission', () => {
    for (const p of PERMISSIONS) {
      expect(PERMISSION_LABELS[p]).toBeTruthy()
    }
    expect(Object.keys(PERMISSION_LABELS).sort()).toEqual([...PERMISSIONS].sort())
  })
})
