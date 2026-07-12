import { describe, it, expect } from 'vitest'
import { resolveCategoryName } from './categories'

const categories = [
  { slug: 'serums', name_ar: 'سيرومات', name_en: 'Serums' },
  { slug: 'creams', name_ar: 'كريمات', name_en: 'Creams' },
]

describe('resolveCategoryName', () => {
  it('resolves a slug to the stored Arabic name (fixes sitemap links)', () => {
    expect(resolveCategoryName('serums', categories)).toBe('سيرومات')
  })
  it('passes through an Arabic name unchanged', () => {
    expect(resolveCategoryName('سيرومات', categories)).toBe('سيرومات')
  })
  it('resolves an English name to the Arabic name', () => {
    expect(resolveCategoryName('Creams', categories)).toBe('كريمات')
  })
  it('returns unknown values as-is', () => {
    expect(resolveCategoryName('mystery', categories)).toBe('mystery')
  })
  it('returns empty string for missing param', () => {
    expect(resolveCategoryName('', categories)).toBe('')
    expect(resolveCategoryName(null, categories)).toBe('')
  })
})
