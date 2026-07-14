import Script from 'next/script'

interface PixelsProps {
  metaPixelId: string | null
  snapPixelId: string | null
  gtmId: string | null
}

// Base tracking scripts for Meta/Snapchat/GTM, injected only when an admin
// has configured the corresponding ID in /admin/settings. lib/analytics.ts
// fires events (ViewContent, AddToCart, Purchase, ...) against window.fbq /
// window.snaptr / window.dataLayer once these are loaded.
export default function Pixels({ metaPixelId, snapPixelId, gtmId }: PixelsProps) {
  return (
    <>
      {gtmId && (
        <>
          <Script id="gtm-base" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`}
          </Script>
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
              title="gtm"
            />
          </noscript>
        </>
      )}

      {metaPixelId && (
        <Script id="meta-pixel-base" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixelId}');fbq('track','PageView');`}
        </Script>
      )}

      {snapPixelId && (
        <Script id="snap-pixel-base" strategy="afterInteractive">
          {`(function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};a.queue=[];var s='script';var r=t.createElement(s);r.async=!0;r.src=n;var u=t.getElementsByTagName(s)[0];u.parentNode.insertBefore(r,u)})(window,document,'https://sc-static.net/scevent.min.js');snaptr('init','${snapPixelId}');snaptr('track','PAGE_VIEW');`}
        </Script>
      )}
    </>
  )
}
