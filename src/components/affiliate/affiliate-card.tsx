"use client";

import { useEffect, useRef } from "react";
import { useTracking } from "@/hooks/use-tracking";
import { affiliateHref, type AffiliateOffer, type PlacementKey } from "@/lib/affiliate-config";

const IMPRESSION_DELAY_MS = 1000;

type AffiliateCardProps = {
  offer: AffiliateOffer;
  placement: PlacementKey;
  storyId?: string;
  chapterNumber?: number;
  onClick?: () => void;
  /** Bản xem trước trong admin: không là link, không ghi nhận hiển thị/click. */
  preview?: boolean;
};

function useImpression(placement: PlacementKey, linkId: string, enabled: boolean) {
  const ref = useRef<HTMLElement | null>(null);
  const fired = useRef(false);
  const { trackAffiliateImpression } = useTracking();

  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el || fired.current || typeof IntersectionObserver === "undefined") return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.5) {
          timer ??= setTimeout(() => {
            fired.current = true;
            trackAffiliateImpression(placement, linkId);
            observer.disconnect();
          }, IMPRESSION_DELAY_MS);
        } else if (timer) {
          clearTimeout(timer);
          timer = undefined;
        }
      },
      { threshold: [0, 0.5, 1] },
    );
    observer.observe(el);
    return () => {
      if (timer) clearTimeout(timer);
      observer.disconnect();
    };
  }, [enabled, placement, linkId, trackAffiliateImpression]);

  return ref;
}

export function AffiliateCard({ offer, placement, storyId, chapterNumber, onClick, preview = false }: AffiliateCardProps) {
  const { trackAffiliateClick } = useTracking();
  const ref = useImpression(placement, offer.id, !preview);
  const className =
    "flex w-full gap-3 rounded-xl border border-orange-200 bg-orange-50 p-3 text-left shadow-sm transition hover:border-orange-300 hover:bg-orange-100/70";

  const body = (
    <>
      <span className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-orange-100 bg-white sm:h-28 sm:w-28">
        {offer.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={offer.image_url}
            alt={offer.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-sm font-bold text-orange-500">Shopee</span>
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[11px] font-medium uppercase tracking-wide text-orange-700/80">Liên kết tiếp thị · Shopee</span>
        <span className="mt-1 line-clamp-2 font-semibold leading-snug text-slate-900">{offer.title}</span>
        {offer.description ? (
          <span className="mt-0.5 line-clamp-1 text-sm text-slate-600">{offer.description}</span>
        ) : null}
        <span className="mt-auto inline-flex w-fit items-center rounded-lg bg-orange-500 px-3 py-1.5 text-sm font-semibold text-white">
          {offer.cta_label} ↗
        </span>
      </span>
    </>
  );

  if (preview) {
    return (
      <div ref={(el) => { ref.current = el; }} className={className}>
        {body}
      </div>
    );
  }

  return (
    <a
      ref={(el) => { ref.current = el; }}
      href={affiliateHref(offer.id, placement, storyId, chapterNumber)}
      target="_blank"
      rel="sponsored nofollow noopener"
      className={className}
      onClick={() => {
        trackAffiliateClick(placement, offer.id);
        onClick?.();
      }}
    >
      {body}
    </a>
  );
}
