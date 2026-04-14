// Inline SVG payment method icons

export function KNetIcon({ className = 'h-7' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="50" rx="6" fill="#1B5FA8"/>
      <rect x="2" y="2" width="76" height="46" rx="5" fill="#1B5FA8"/>
      {/* K letter */}
      <text x="10" y="33" fontSize="22" fontWeight="900" fill="#F5C400" fontFamily="Arial">K</text>
      {/* net text */}
      <text x="34" y="33" fontSize="14" fontWeight="700" fill="white" fontFamily="Arial">net</text>
      {/* top arabic */}
      <text x="10" y="16" fontSize="9" fill="white" fontFamily="Arial" opacity="0.9">دي يك نت</text>
    </svg>
  )
}

export function MastercardIcon({ className = 'h-7' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="50" rx="6" fill="white" stroke="#E5E7EB" strokeWidth="1.5"/>
      <circle cx="31" cy="25" r="13" fill="#EB001B"/>
      <circle cx="49" cy="25" r="13" fill="#F79E1B"/>
      <path d="M40 14.5a13 13 0 0 1 0 21 13 13 0 0 1 0-21z" fill="#FF5F00"/>
    </svg>
  )
}

export function VisaIcon({ className = 'h-7' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="50" rx="6" fill="white" stroke="#E5E7EB" strokeWidth="1.5"/>
      <text x="12" y="33" fontSize="22" fontWeight="900" fill="#1A1F71" fontFamily="Arial Narrow, Arial">VISA</text>
    </svg>
  )
}

export function ApplePayIcon({ className = 'h-7' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="50" rx="6" fill="black"/>
      {/* Apple logo */}
      <path d="M28 18c1.1-1.3 1.8-3.1 1.6-4.9-1.6.1-3.5 1.1-4.6 2.4-1 1.1-1.9 2.9-1.6 4.7 1.7.1 3.5-.9 4.6-2.2z" fill="white"/>
      <path d="M29.6 20.2c-2.5-.1-4.7 1.4-5.9 1.4-1.2 0-3.1-1.3-5.1-1.3-2.6.1-5 1.5-6.4 3.8-2.7 4.7-.7 11.7 1.9 15.5 1.3 1.9 2.8 3.9 4.9 3.8 1.9-.1 2.7-1.2 5-1.2 2.3 0 3 1.2 5.1 1.2 2.1 0 3.5-1.9 4.8-3.8.9-1.3 1.5-2.7 1.9-4.2-4.9-1.9-4.2-8.9.8-10.7-.9-2.7-3.3-4.4-7-4.5z" fill="white"/>
      {/* Pay text */}
      <text x="36" y="31" fontSize="15" fontWeight="600" fill="white" fontFamily="Arial">Pay</text>
    </svg>
  )
}

export function GooglePayIcon({ className = 'h-7' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="50" rx="6" fill="white" stroke="#E5E7EB" strokeWidth="1.5"/>
      {/* G */}
      <text x="8" y="33" fontSize="20" fontWeight="700" fill="#4285F4" fontFamily="Arial">G</text>
      {/* Pay */}
      <text x="28" y="33" fontSize="16" fontWeight="600" fill="#3C4043" fontFamily="Arial">Pay</text>
      {/* colored dots under G */}
      <circle cx="11" cy="38" r="2" fill="#EA4335"/>
      <circle cx="16" cy="38" r="2" fill="#FBBC04"/>
      <circle cx="21" cy="38" r="2" fill="#34A853"/>
    </svg>
  )
}

// Row of all payment icons
export function PaymentIconsRow({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      <KNetIcon className="h-6" />
      <MastercardIcon className="h-6" />
      <VisaIcon className="h-6" />
      <ApplePayIcon className="h-6" />
      <GooglePayIcon className="h-6" />
    </div>
  )
}
