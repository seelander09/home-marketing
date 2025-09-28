import Script from 'next/script'
import type { ConsentState } from '@/lib/analytics/consent'

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID

export function TagManager({ consent }: { consent: ConsentState }) {
  if (!GTM_ID || (!consent.analytics && !consent.marketing)) {
    return null
  }

  const analyticsConsent = consent.analytics ? 'granted' : 'denied'
  const marketingConsent = consent.marketing ? 'granted' : 'denied'

  return (
    <>
      <Script id="gtm-consent" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({
            event: 'consent_initial_state',
            consent: {
              analytics: '${analyticsConsent}',
              ad_storage: '${marketingConsent}'
            }
          });
        `}
      </Script>
      <Script id="gtm-base" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
        `}
      </Script>
      <Script id="gtm-script" strategy="afterInteractive" src={`https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`} />
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
          height="0"
          width="0"
          style={{ display: 'none', visibility: 'hidden' }}
        />
      </noscript>
    </>
  )
}
