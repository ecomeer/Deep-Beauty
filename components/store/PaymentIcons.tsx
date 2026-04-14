// Payment method icons — real brand logos from /public/payment/

type IconProps = { className?: string; alt: string; src: string }

function PaymentLogo({ src, alt, className = 'h-8' }: IconProps) {
  return (
    <img
      src={src}
      alt={alt}
      className={`${className} w-auto object-contain rounded`}
      loading="lazy"
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

// Keep these for any existing imports that reference them
export function ApplePayIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-8'} viewBox="0 0 80 50" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Apple Pay">
      <title>Apple Pay</title>
      <rect width="80" height="50" rx="6" fill="black"/>
      <path d="M28 18c1.1-1.3 1.8-3.1 1.6-4.9-1.6.1-3.5 1.1-4.6 2.4-1 1.1-1.9 2.9-1.6 4.7 1.7.1 3.5-.9 4.6-2.2z" fill="white"/>
      <path d="M29.6 20.2c-2.5-.1-4.7 1.4-5.9 1.4-1.2 0-3.1-1.3-5.1-1.3-2.6.1-5 1.5-6.4 3.8-2.7 4.7-.7 11.7 1.9 15.5 1.3 1.9 2.8 3.9 4.9 3.8 1.9-.1 2.7-1.2 5-1.2 2.3 0 3 1.2 5.1 1.2 2.1 0 3.5-1.9 4.8-3.8.9-1.3 1.5-2.7 1.9-4.2-4.9-1.9-4.2-8.9.8-10.7-.9-2.7-3.3-4.4-7-4.5z" fill="white"/>
      <text x="36" y="31" fontSize="15" fontWeight="600" fill="white" fontFamily="Arial">Pay</text>
    </svg>
  )
}

export function GooglePayIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-8'} viewBox="0 0 80 50" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Google Pay">
      <title>Google Pay</title>
      <rect width="80" height="50" rx="6" fill="white" stroke="#E5E7EB" strokeWidth="1.5"/>
      <text x="8" y="33" fontSize="20" fontWeight="700" fill="#4285F4" fontFamily="Arial">G</text>
      <text x="28" y="33" fontSize="16" fontWeight="600" fill="#3C4043" fontFamily="Arial">Pay</text>
      <circle cx="11" cy="38" r="2" fill="#EA4335"/>
      <circle cx="16" cy="38" r="2" fill="#FBBC04"/>
      <circle cx="21" cy="38" r="2" fill="#34A853"/>
    </svg>
  )
}

// Row of all payment icons
export function PaymentIconsRow({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 flex-wrap ${className}`}>
      <MastercardIcon className="h-8" />
      <VisaIcon className="h-8" />
      <AmexIcon className="h-8" />
      <KNetIcon className="h-8" />
    </div>
  )
}
