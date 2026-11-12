"use client";

import Script from "next/script";
import { useConsent } from "../providers/consent-provider";
import { usePathname } from "next/navigation";

export function GoogleAnalytics() {
  const { consentStatus } = useConsent();
  const pathname = usePathname();
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  if (pathname?.startsWith("/admin")) return null;
  if (consentStatus !== "granted" || !gaId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  );
}
