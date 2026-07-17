'use client'

export default function PrintButton({ orderId }: { orderId: string }) {
  return (
    <div className="flex gap-2 print:hidden">
      <a
        href={`/api/admin/orders/${orderId}/invoice`}
        className="btn-primary px-6 py-2 text-sm"
      >
        ⬇️ تحميل PDF
      </a>
      <button
        type="button"
        onClick={() => window.print()}
        className="px-6 py-2 text-sm rounded-xl border border-[var(--beige)] hover:bg-[var(--off-white)]"
      >
        🖨️ طباعة
      </button>
    </div>
  )
}
