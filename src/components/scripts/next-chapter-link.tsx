"use client";

import Link from "next/link";
import { useTracking } from "@/hooks/use-tracking";
import { ReactNode, useCallback, useState } from "react";
import { useChapterAffiliate } from "@/components/affiliate/affiliate-chapter-provider";
import { AffiliateNextChapterModal } from "@/components/affiliate/affiliate-next-chapter-modal";
import type { AffiliateOffer } from "@/lib/affiliate-config";

interface NextChapterLinkProps {
  storySlug: string;
  fromChapterSlug: string;
  href: string;
  children: ReactNode;
  className?: string;
}

export function NextChapterLink({ storySlug, fromChapterSlug, href, children, className }: NextChapterLinkProps) {
  const { trackNextChapterClick, trackAffiliateModalShown } = useTracking();
  const affiliate = useChapterAffiliate();
  const [modalOffer, setModalOffer] = useState<AffiliateOffer | null>(null);
  const closeModal = useCallback(() => setModalOffer(null), []);

  return (
    <>
      <Link
        href={href}
        className={className}
        onClick={(event) => {
          trackNextChapterClick(storySlug, fromChapterSlug);
          if (!affiliate || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          const offer = affiliate.takeNextChapterOffer();
          if (!offer) return;
          event.preventDefault();
          setModalOffer(offer);
          trackAffiliateModalShown(offer.id);
        }}
      >
        {children}
      </Link>
      {modalOffer && affiliate ? (
        <AffiliateNextChapterModal
          offer={modalOffer}
          nextHref={href}
          storyId={affiliate.storyId}
          chapterNumber={affiliate.chapterNumber}
          onClose={closeModal}
        />
      ) : null}
    </>
  );
}
