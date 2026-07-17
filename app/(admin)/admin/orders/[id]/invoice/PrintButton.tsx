'use client'

import {
  ArrowDownTrayIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline'
import { toWhatsAppPhone } from '@/lib/utils'

interface InvoiceActionsProps {
  orderId: string
  orderNumber: string
  customerName: string
  customerPhone: string
  total: string
}

export default function PrintButton({
  orderId,
  orderNumber,
  customerName,
  customerPhone,
  total,
}: InvoiceActionsProps) {
  const message = encodeURIComponent(
    `أهلاً ${customerName}، هذه فاتورة طلبك من Deep Beauty رقم ${orderNumber} بقيمة ${total}. شكراً لتسوقك معنا 🤎`
  )
  const whatsappUrl = `https://wa.me/${toWhatsAppPhone(customerPhone)}?text=${message}`

  return (
    <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto print:hidden">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#d8c1af] bg-white px-5 py-2.5 text-sm font-bold text-[#6e4a2d] transition hover:bg-[#f7efe9]"
      >
        <ChatBubbleOvalLeftEllipsisIcon className="h-5 w-5" />
        إرسال واتساب
      </a>
      <a
        href={`/api/admin/orders/${orderId}/invoice`}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#d8c1af] bg-white px-5 py-2.5 text-sm font-bold text-[#6e4a2d] transition hover:bg-[#f7efe9]"
      >
        <ArrowDownTrayIcon className="h-5 w-5" />
        تحميل PDF
      </a>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#8b5e3c] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#6e4a2d]"
      >
        <PrinterIcon className="h-5 w-5" />
        طباعة
      </button>
    </div>
  )
}
