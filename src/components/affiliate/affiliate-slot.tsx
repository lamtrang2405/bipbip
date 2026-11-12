"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { AffiliateCard } from "@/components/affiliate/affiliate-card";
import { useChapterAffiliate, useIsClient } from "@/components/affiliate/affiliate-chapter-provider";
import type { AffiliateOffer, PlacementKey } from "@/lib/affiliate-config";
import { pickWeighted } from "@/lib/affiliate-caps";

type AffiliateSlotProps = {
  placement: PlacementKey;
  offers: AffiliateOffer[];
  storyId?: string;
  chapterNumber?: number;
  className?: string;
};

/** Server/first paint chỉ giữ chỗ (tránh CLS); chọn link theo trọng số sau khi mount. */
export function AffiliateSlot({ placement, offers, storyId, chapterNumber, className }: AffiliateSlotProps) {
  const isClient = useIsClient();
  const pathname = usePathname();
  const chapter = useChapterAffiliate();
  const offer = useMemo(() => (isClient ? pickWeighted(offers) : null), [isClient, offers]);

  if (!offers.length || pathname.startsWith("/admin")) return null;
  if (placement === "chapter_end" && chapter?.gateOffer) return null;
  if (isClient && !offer) return null;

  return (
    <div className={className}>
      <div className="min-h-[122px] sm:min-h-[138px]">
        {offer ? (
          <AffiliateCard offer={offer} placement={placement} storyId={storyId} chapterNumber={chapterNumber} />
        ) : null}
      </div>
    </div>
  );
}
