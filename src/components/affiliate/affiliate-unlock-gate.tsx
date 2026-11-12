"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AffiliateCard } from "@/components/affiliate/affiliate-card";
import { useChapterAffiliate } from "@/components/affiliate/affiliate-chapter-provider";
import { useTracking } from "@/hooks/use-tracking";

const MIN_REVEAL_PX = 240;

/**
 * Soft gate: nội dung chương luôn có đầy đủ trong HTML (SSR); khi bật chỉ thu gọn phần hiển thị bằng CSS
 * và hiện khung mời mở Shopee. Không xóa nội dung, không tự mở tab, không đụng lịch sử trình duyệt.
 */
export function AffiliateUnlockGate({ children }: { children: ReactNode }) {
  const ctx = useChapterAffiliate();
  const offer = ctx?.gateOffer ?? null;
  const config = ctx?.data.chapter_unlock?.config;
  const delay = config?.skip_delay_seconds ?? 5;
  const contentRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const { trackAffiliateGateSkip } = useTracking();

  useEffect(() => {
    const el = contentRef.current;
    if (!offer || !el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => setContentHeight(entry.contentRect.height));
    observer.observe(el);
    return () => observer.disconnect();
  }, [offer]);

  const gated = Boolean(offer && ctx && contentHeight > 0);

  useEffect(() => {
    const panel = panelRef.current;
    if (!gated || !panel) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    const startCountdown = () => {
      const startedAt = Date.now();
      timer = setInterval(() => {
        const left = Math.max(0, delay - Math.floor((Date.now() - startedAt) / 1000));
        setSecondsLeft(left);
        if (left === 0) clearInterval(timer);
      }, 250);
    };
    if (typeof IntersectionObserver === "undefined") {
      startCountdown();
      return () => clearInterval(timer);
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      startCountdown();
    });
    observer.observe(panel);
    return () => {
      observer.disconnect();
      clearInterval(timer);
    };
  }, [gated, delay]);

  const revealHeight = Math.max(MIN_REVEAL_PX, Math.round(contentHeight * (config?.reveal_ratio ?? 0.3)));
  const remaining = secondsLeft ?? delay;

  return (
    <div>
      <div className={gated ? "relative overflow-hidden" : undefined} style={gated ? { maxHeight: revealHeight } : undefined}>
        <div ref={contentRef}>{children}</div>
        {gated ? (
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-linear-to-b from-transparent to-slate-50" />
        ) : null}
      </div>

      {gated && offer && ctx ? (
        <section ref={panelRef} aria-label="Mở khóa chương" className="mt-2 rounded-xl border border-orange-200 bg-white p-4 text-center shadow-sm sm:p-5">
          <p className="text-base font-semibold text-slate-900 sm:text-lg">Mở Shopee để đọc tiếp chương này</p>
          <p className="mt-1 text-sm text-slate-600">
            Bấm vào ưu đãi bên dưới (mở ở tab mới), phần còn lại của chương sẽ hiện ngay. Cảm ơn bạn đã ủng hộ web!
          </p>
          <div className="mt-4">
            <AffiliateCard
              offer={offer}
              placement="chapter_unlock"
              storyId={ctx.storyId}
              chapterNumber={ctx.chapterNumber}
              onClick={ctx.unlockGate}
            />
          </div>
          <div className="mt-3 flex min-h-10 items-center justify-center">
            {remaining <= 0 ? (
              <button
                type="button"
                onClick={() => {
                  trackAffiliateGateSkip(offer.id);
                  ctx.unlockGate();
                }}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Đọc tiếp
              </button>
            ) : (
              <p className="text-sm text-slate-500">Hoặc đọc tiếp miễn phí sau {remaining} giây…</p>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
