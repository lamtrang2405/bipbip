"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { useTracking } from "@/hooks/use-tracking";
import type { AffiliateClientConfig, AffiliateOffer, AffiliatePlacementData } from "@/lib/affiliate-config";
import {
  bumpChapterCounter,
  canShow,
  getChapterCounter,
  isSearchLanding,
  pickWeighted,
  recordShown,
  resetChapterCounter,
  rolloutBucket,
} from "@/lib/affiliate-caps";

type ChapterAffiliateContextValue = {
  data: AffiliateClientConfig;
  storyId: string;
  chapterNumber: number;
  isClient: boolean;
  /** Link đang hiển thị trong soft gate; `null` khi không chặn hoặc đã mở khóa. */
  gateOffer: AffiliateOffer | null;
  /** Soft gate đã hiện trong lượt xem trang này (kể cả khi đã mở khóa). */
  gateShown: boolean;
  unlockGate: () => void;
  takeNextChapterOffer: () => AffiliateOffer | null;
};

const ChapterAffiliateContext = createContext<ChapterAffiliateContextValue | null>(null);

const noopSubscribe = () => () => {};

export function useIsClient() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

export function useChapterAffiliate() {
  return useContext(ChapterAffiliateContext);
}

function decideGate(
  gate: AffiliatePlacementData<"chapter_unlock"> | undefined,
  chapterNumber: number,
  pathname: string,
): AffiliateOffer | null {
  if (!gate?.offers.length) return null;
  const { config } = gate;
  if (chapterNumber < config.min_chapter) return null;
  if (rolloutBucket() >= config.rollout_percent) return null;
  if (!canShow("chapter_unlock", config.ttl_minutes, config.max_per_day)) return null;
  if (isSearchLanding(pathname)) return null;
  return pickWeighted(gate.offers);
}

export function AffiliateChapterProvider({
  data,
  storyId,
  chapterNumber,
  children,
}: {
  data: AffiliateClientConfig;
  storyId: string;
  chapterNumber: number;
  children: ReactNode;
}) {
  const isClient = useIsClient();
  const pathname = usePathname();
  const [unlocked, setUnlocked] = useState(false);
  const { trackAffiliateGateShown } = useTracking();
  const counted = useRef(false);
  const gateRecorded = useRef(false);

  const gateDecision = useMemo(
    () => (isClient && !pathname.startsWith("/admin") ? decideGate(data.chapter_unlock, chapterNumber, pathname) : null),
    [isClient, data.chapter_unlock, chapterNumber, pathname],
  );

  useEffect(() => {
    if (counted.current) return;
    counted.current = true;
    bumpChapterCounter();
  }, []);

  useEffect(() => {
    if (!gateDecision || gateRecorded.current) return;
    gateRecorded.current = true;
    recordShown("chapter_unlock");
    trackAffiliateGateShown(gateDecision.id);
  }, [gateDecision, trackAffiliateGateShown]);

  const unlockGate = useCallback(() => setUnlocked(true), []);

  const takeNextChapterOffer = useCallback((): AffiliateOffer | null => {
    const modal = data.next_chapter_modal;
    if (!modal?.offers.length || gateDecision || pathname.startsWith("/admin")) return null;
    const { config } = modal;
    if (chapterNumber < config.min_chapter) return null;
    if (getChapterCounter() < config.every_n_chapters) return null;
    if (!canShow("next_chapter_modal", config.cap_minutes, config.max_per_day)) return null;
    const offer = pickWeighted(modal.offers);
    if (!offer) return null;
    recordShown("next_chapter_modal");
    resetChapterCounter();
    return offer;
  }, [data.next_chapter_modal, gateDecision, chapterNumber, pathname]);

  const value = useMemo<ChapterAffiliateContextValue>(
    () => ({
      data,
      storyId,
      chapterNumber,
      isClient,
      gateOffer: unlocked ? null : gateDecision,
      gateShown: Boolean(gateDecision),
      unlockGate,
      takeNextChapterOffer,
    }),
    [data, storyId, chapterNumber, isClient, unlocked, gateDecision, unlockGate, takeNextChapterOffer],
  );

  return <ChapterAffiliateContext.Provider value={value}>{children}</ChapterAffiliateContext.Provider>;
}

/**
 * Bọc quảng cáo AdSense phía trên chương: chỉ hiện khi đã biết chắc trang không có soft gate,
 * để AdSense không bao giờ nằm cạnh/dưới lớp chặn và không bị chèn lên làm xô nội dung sau khi mở khóa.
 */
export function AffiliateAdGuard({ children }: { children: ReactNode }) {
  const ctx = useChapterAffiliate();
  if (!ctx) return <>{children}</>;
  if (!ctx.isClient || ctx.gateShown) return null;
  return <>{children}</>;
}
