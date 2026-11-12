"use client";

import { useConsent } from "./providers/consent-provider";
import { usePathname } from "next/navigation";

export function ConsentBanner() {
  const { consentStatus, setConsent, isMounted } = useConsent();
  const pathname = usePathname();

  // Hide on admin routes
  if (pathname?.startsWith("/admin")) return null;

  // Nothing to consent to until GA4 or AdSense is configured
  if (!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && !process.env.NEXT_PUBLIC_ADSENSE_CLIENT) return null;

  // Only show if mounted and pending
  if (!isMounted || consentStatus !== "pending") return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Trang web sử dụng cookie để theo dõi lượt đọc truyện và hiển thị quảng cáo phù hợp, giúp duy trì server. 
          Việc bạn tiếp tục sử dụng website đồng nghĩa với việc bạn đồng ý với chính sách này.
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            onClick={() => setConsent("denied")}
            className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition"
          >
            Từ chối
          </button>
          <button
            onClick={() => setConsent("granted")}
            className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 transition"
          >
            Đồng ý
          </button>
        </div>
      </div>
    </div>
  );
}
