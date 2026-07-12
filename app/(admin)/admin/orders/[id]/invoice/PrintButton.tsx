'use client'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="btn-primary px-6 py-2 text-sm print:hidden"
    >
      🖨️ طباعة الفاتورة
    </button>
  )
}
