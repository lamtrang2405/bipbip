"use client";

import { useEffect, useRef } from "react";
import { useConsent } from "./providers/consent-provider";
import { usePathname } from "next/navigation";

interface AdSenseUnitProps {
  adSlot: string;
  adFormat?: string;
  fullWidthResponsive?: boolean;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle?: any[];
  }
}

export function AdSenseUnit({ 
  adSlot, 
  adFormat = "auto", 
  fullWidthResponsive = true,
  className = "min-h-[90px] w-full"
}: AdSenseUnitProps) {
  const { consentStatus } = useConsent();
  const pathname = usePathname();
  const adClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  if (pathname?.startsWith("/admin") || !adClient || consentStatus !== "granted") {
    return null; // Don't render ad block at all
  }

  return <AdSenseInner 
    adClient={adClient} 
    adSlot={adSlot} 
    adFormat={adFormat} 
    fullWidthResponsive={fullWidthResponsive} 
    className={className} 
  />;
}

function AdSenseInner({ adClient, adSlot, adFormat, fullWidthResponsive, className }: any) {
  const isPushed = useRef(false);

  useEffect(() => {
    if (!isPushed.current && typeof window !== "undefined") {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        isPushed.current = true;
      } catch (err) {
        console.error("AdSense push error:", err);
      }
    }
  }, []);

  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className={`relative overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center rounded-lg border border-dashed border-slate-300 dark:border-slate-600 ${className}`}>
      {/* Fallback text visible only during dev/loading when the Ad is empty */}
      {isDev && (
        <span className="absolute text-xs font-mono text-slate-400">
          AdSense Test Block
        </span>
      )}
      <ins
        className="adsbygoogle block relative z-10 w-full"
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-adtest={isDev ? "on" : undefined}
        data-full-width-responsive={fullWidthResponsive ? "true" : "false"}
      />
    </div>
  );
}
