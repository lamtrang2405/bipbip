---
phase: 3
title: "Google AdSense Integration"
status: completed
priority: P2
effort: "2h"
dependencies: ["1"]
---

# Phase 3: Google AdSense Integration

## Overview
Implement Google AdSense for monetization. This includes loading the core AdSense script conditionally based on consent and creating reusable ad slot components for display across the app.

## Requirements
- Functional:
  - Load the `adsbygoogle.js` script globally if `consentStatus === 'granted'`.
  - Create an `<AdSenseUnit adSlot="..." />` component to render individual ad placements.
  - Insert ad units strategically: between chapters, at the end of content, and on the homepage.
  - Never load ads on `/admin` routes.
- Non-functional:
  - Ad containers should have a `min-height` to prevent Cumulative Layout Shift (CLS).
  - Handle cases where AdSense fails to initialize gracefully.

## Architecture
- `src/components/scripts/google-adsense.tsx`: Global script loader.
- `src/components/adsense-unit.tsx`: Reusable ad placement component.

## Related Code Files
- Create: `src/components/scripts/google-adsense.tsx`
- Create: `src/components/adsense-unit.tsx`
- Modify: `src/app/layout.tsx` (inject `GoogleAdsense` script component)
- Modify: `src/app/stories/[slug]/[chapterSlug]/page.tsx` (add ad unit)

## Implementation Steps
1. Create `<GoogleAdsense />` script loader component (similar to GA4, checking consent and admin path).
2. Create `<AdSenseUnit />` component. It renders an `<ins>` tag and calls `(window.adsbygoogle = window.adsbygoogle || []).push({})` inside a `useEffect`.
3. Add `min-h-[90px]` (or appropriate size) to the wrapper to prevent CLS.
4. Place `<AdSenseUnit />` components in desired locations (e.g., above and below chapter content).

## Success Criteria
- [ ] AdSense script loads only when consent is granted.
- [ ] AdSense `push` executes without errors.
- [ ] Layout shift is minimized when ads load.
- [ ] No ad errors on `/admin` pages.

## Risk Assessment
- Ad loading errors on unapproved domains: Expected on localhost. We must ensure error handling doesn't crash the React tree.
- CLS impact: Mitigated by styling ad containers.
