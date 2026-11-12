"use client";

import { useEffect, useRef } from "react";
import { useTracking, useAutoPageView } from "@/hooks/use-tracking";

export function AutoPageTracker() {
  useAutoPageView();
  return null;
}

export function StoryTracker({ storySlug, title }: { storySlug: string; title: string }) {
  const { trackStoryView } = useTracking();
  const hasFired = useRef(false);

  useEffect(() => {
    if (!hasFired.current) {
      trackStoryView(storySlug, title);
      hasFired.current = true;
    }
  }, [storySlug, title, trackStoryView]);

  return null;
}

export function ChapterTracker({ 
  storySlug, 
  chapterSlug, 
  chapterNumber 
}: { 
  storySlug: string; 
  chapterSlug: string; 
  chapterNumber: number; 
}) {
  const { trackChapterView } = useTracking();
  const hasFired = useRef(false);

  useEffect(() => {
    if (!hasFired.current) {
      trackChapterView(storySlug, chapterSlug, chapterNumber);
      hasFired.current = true;
    }
  }, [storySlug, chapterSlug, chapterNumber, trackChapterView]);

  return null;
}
