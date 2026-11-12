"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { useConsent } from "@/components/providers/consent-provider";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function useTracking() {
  const { consentStatus } = useConsent();
  
  const fireEvent = useCallback((eventName: string, params: Record<string, unknown> = {}) => {
    if (consentStatus !== "granted") return;
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", eventName, params);
    }
  }, [consentStatus]);

  const trackPageView = useCallback(() => {
    fireEvent("page_view");
  }, [fireEvent]);

  const trackStoryView = useCallback((storySlug: string, title: string) => {
    fireEvent("story_view", { story_slug: storySlug, story_title: title });
  }, [fireEvent]);

  const trackChapterView = useCallback((storySlug: string, chapterSlug: string, chapterNumber: number) => {
    fireEvent("chapter_view", { story_slug: storySlug, chapter_slug: chapterSlug, chapter_number: chapterNumber });
  }, [fireEvent]);

  const trackNextChapterClick = useCallback((storySlug: string, fromChapterSlug: string) => {
    fireEvent("next_chapter_click", { story_slug: storySlug, from_chapter_slug: fromChapterSlug });
  }, [fireEvent]);

  return { trackPageView, trackStoryView, trackChapterView, trackNextChapterClick };
}

// Hook to track page views automatically inside a component (used once per page)
export function useAutoPageView() {
  const { trackPageView } = useTracking();
  const pathname = usePathname();
  const hasFired = useRef(false);

  useEffect(() => {
    // Prevent double-firing in React 18+ Strict Mode
    if (!hasFired.current) {
      trackPageView();
      hasFired.current = true;
    }
  }, [pathname, trackPageView]);
}
