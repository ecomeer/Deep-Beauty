// Payment method icons — real brand logos from /public/payment/
import Image from 'next/image'

type LogoProps = { src: string; alt: string; width?: number; height?: number; className?: string }

function PaymentLogo({ src, alt, width = 60, height = 32, className = '' }: LogoProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      unoptimized
      className={`object-contain rounded ${className}`}
      style={{ height: '2rem', width: 'auto' }}
    />
  )
}

export function MastercardIcon({ className }: { className?: string }) {
  return <PaymentLogo src="/payments/mastercard.svg" alt="Mastercard" width={50} height={32} className={className ?? ''} />
}

export function VisaIcon({ className }: { className?: string }) {
  return <PaymentLogo src="/payments/visa.svg" alt="Visa" width={60} height={32} className={className ?? ''} />
}

export function KNetIcon({ className }: { className?: string }) {
  return <PaymentLogo src="/payments/knet.svg" alt="K-Net" width={60} height={32} className={className ?? ''} />
}

export function ApplePayIcon({ className }: { className?: string }) {
  return <PaymentLogo src="/payments/apple-pay.svg" alt="Apple Pay" width={60} height={32} className={className ?? ''} />
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
      <ApplePayIcon />
      <KNetIcon />
    </div>
  )
}
