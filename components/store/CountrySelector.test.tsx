// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CountryProvider } from '@/context/CountryContext'
import { GULF_COUNTRIES } from '@/lib/currency'
import CountrySelector from './CountrySelector'

function renderSelector() {
  return render(
    <CountryProvider>
      <CountrySelector />
    </CountryProvider>
  )
}

beforeEach(() => {
  localStorage.clear()
})

describe('CountrySelector', () => {
  it('defaults to Kuwait with the dropdown closed', () => {
    renderSelector()
    expect(screen.getByText('الكويت')).toBeTruthy()
    expect(screen.queryByText('اختر بلدك / العملة')).toBeNull()
  })

  it('opens the dropdown listing all Gulf countries', () => {
    renderSelector()
    fireEvent.click(screen.getByLabelText('اختيار الدولة'))
    expect(screen.getByText('اختر بلدك / العملة')).toBeTruthy()
    for (const country of Object.values(GULF_COUNTRIES)) {
      expect(screen.getAllByText(country.name_ar).length).toBeGreaterThan(0)
    }
  })

  it('selects a country, persists it, and closes the dropdown', () => {
    renderSelector()
    fireEvent.click(screen.getByLabelText('اختيار الدولة'))
    fireEvent.click(screen.getByText(GULF_COUNTRIES.SA.name_ar))

    expect(localStorage.getItem('selected_country')).toBe('SA')
    expect(screen.queryByText('اختر بلدك / العملة')).toBeNull()
    expect(screen.getByText(GULF_COUNTRIES.SA.name_ar)).toBeTruthy() // now shown on the trigger
  })

  it('closes when clicking outside', () => {
    renderSelector()
    fireEvent.click(screen.getByLabelText('اختيار الدولة'))
    expect(screen.getByText('اختر بلدك / العملة')).toBeTruthy()

    fireEvent.mouseDown(document.body)
    expect(screen.queryByText('اختر بلدك / العملة')).toBeNull()
  })

  it('restores a previously saved country on mount', () => {
    localStorage.setItem('selected_country', 'QA')
    renderSelector()
    expect(screen.getByText(GULF_COUNTRIES.QA.name_ar)).toBeTruthy()
  })
})
