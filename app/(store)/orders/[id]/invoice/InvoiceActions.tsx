'use client'

import { ArrowDownTrayIcon, PrinterIcon } from '@heroicons/react/24/outline'

export default function InvoiceActions({ downloadHref }: { downloadHref: string }) {
  return (
    <div className="grid grid-cols-2 gap-2 print:hidden">
      <button
        type="button"
        onClick={() => window.print()}
        className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-3 text-sm font-bold text-white"
      >
        <PrinterIcon className="h-5 w-5" />
        طباعة
      </button>
      <a
        href={downloadHref}
        className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-outline-variant/70 bg-white px-3 text-sm font-bold"
      >
        <ArrowDownTrayIcon className="h-5 w-5 text-primary" />
        PDF
      </a>
    </div>
  )
}
