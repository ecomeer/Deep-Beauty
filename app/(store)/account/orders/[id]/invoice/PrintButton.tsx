'use client'

export default function PrintButton() {
  return <button type="button" onClick={() => window.print()} className="btn-primary px-4 py-2">طباعة / حفظ PDF</button>
}
