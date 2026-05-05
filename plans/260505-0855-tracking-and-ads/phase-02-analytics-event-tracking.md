---
phase: 2
title: "Analytics Event Tracking"
status: completed
priority: P1
effort: "3h"
dependencies: ["1"]
---

# Phase 2: Analytics Event Tracking

## Overview
Integrate Google Analytics 4 (GA4) using client-side tracking, respecting the consent state. Create a `useTracking` hook to centralize event dispatch logic safely.

## Requirements
- Functional:
  - Load GA4 script via `next/script` only if `consentStatus === 'granted'`.
  - Implement a `useTracking` hook with functions like `trackPageView`, `trackStoryView`, `trackChapterView`, `trackNextChapterClick`.
  - Hook should check if `window.gtag` exists before calling it to prevent errors if blocked by adblockers.
  - Ensure `/api/analytics` remains intact to satisfy legacy contract requirements (return 200 OK).
- Non-functional:
  - Prevent double-firing of events due to React 19 Strict Mode rendering.

## Architecture
- `src/components/scripts/google-analytics.tsx`: Script injector component.
- `src/hooks/use-tracking.ts`: Centralized custom hook for tracking.

## Related Code Files
- Create: `src/components/scripts/google-analytics.tsx`
- Create: `src/hooks/use-tracking.ts`
- Modify: `src/app/layout.tsx` (to include `<GoogleAnalytics />`)
- Modify: `src/app/page.tsx` (track home page view)
- Modify: `src/app/stories/[slug]/page.tsx` (track story view)
- Modify: `src/app/stories/[slug]/[chapterSlug]/page.tsx` (track chapter view & next button clicks)

## Implementation Steps
1. Create `<GoogleAnalytics />` component. Use `next/script`. Subscribe to `useConsent` context and only load scripts if `'granted'`. Do not load on `/admin`.
2. Create `useTracking` hook with properly memoized event functions.
3. Add `useTracking().trackPageView()` (or Next.js router integration) to track route changes.
4. Add specific tracking calls in `StoryDetail` and `ChapterDetail` components.
5. Use a simple ref-based lock or strict dependency arrays in `useEffect` to prevent duplicate firing in Strict Mode.

## Success Criteria
- [ ] GA4 script is loaded only after clicking "Accept" on the consent banner.
- [ ] Events appear in GA4 Realtime dashboard.
- [ ] No events are fired if consent is denied or not yet given.
- [ ] Adblockers blocking the script do not cause the app to crash.

## Risk Assessment
- Duplicate events in React 19: Handled by `useEffect` cleanup and strict dependencies.
- Adblockers: Silently failing is intended behavior.
