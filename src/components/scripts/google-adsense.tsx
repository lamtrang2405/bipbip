"use client";

import Script from "next/script";
import { useConsent } from "../providers/consent-provider";
import { usePathname } from "next/navigation";

export function GoogleAdSense() {
  const { consentStatus } = useConsent();
  const pathname = usePathname();
  const adClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  if (pathname?.startsWith("/admin")) return null;
  if (consentStatus !== "granted" || !adClient) return null;

  return (
    <Script
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
