// Payment method icons — real brand logos from /public/payment/

type LogoProps = { src: string; alt: string; className?: string }

function PaymentLogo({ src, alt, className = 'h-8' }: LogoProps) {
  return (
    <img
      src={src}
      alt={alt}
      className={`${className} w-auto object-contain rounded`}
      loading="lazy"
      decoding="async"
    />
  )
}

export function MastercardIcon({ className }: { className?: string }) {
  return <PaymentLogo src="/payment/mastercard.svg" alt="Mastercard" className={className ?? 'h-8'} />
}

export function VisaIcon({ className }: { className?: string }) {
  return <PaymentLogo src="/payment/visa.svg" alt="Visa" className={className ?? 'h-8'} />
}

export function AmexIcon({ className }: { className?: string }) {
  return <PaymentLogo src="/payment/amex.svg" alt="American Express" className={className ?? 'h-8'} />
}

export function KNetIcon({ className }: { className?: string }) {
  return <PaymentLogo src="/payment/knet.svg" alt="K-Net" className={className ?? 'h-8'} />
}

// kept for any import that references these
export function ApplePayIcon({ className }: { className?: string }) {
  return <PaymentLogo src="/payments/apple-pay.svg" alt="Apple Pay" className={className ?? 'h-8'} />
}

// ─── Row used in Footer, Checkout, etc. ───────────────────────────────────
export function PaymentIconsRow({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex items-center gap-3 flex-wrap ${className}`}
      aria-label="طرق الدفع المقبولة"
    >
      <MastercardIcon />
      <VisaIcon />
      <AmexIcon />
      <KNetIcon />
    </div>
  )
}
