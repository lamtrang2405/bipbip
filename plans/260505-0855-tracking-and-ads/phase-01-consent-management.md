---
phase: 1
title: "Consent Management"
status: completed
priority: P1
effort: "2h"
dependencies: []
---

# Phase 1: Consent Management

## Overview
Implement a robust consent management system to ask users for tracking/ads permission before injecting any third-party scripts. The system should persist the consent state in `localStorage` and provide a React Context to access this state across the app.

## Requirements
- Functional:
  - Display a sticky banner at the bottom of the screen if consent is not yet decided.
  - Options to Accept or Decline.
  - Provide a React Context (`ConsentProvider`) exporting `consentStatus` (`'pending' | 'granted' | 'denied'`).
  - Do not show banner or load scripts on `/admin/*` routes.
- Non-functional:
  - Hydration-safe (avoid SSR mismatch by defaulting to `pending` and reading from `localStorage` on mount).
  - UI should match the site's aesthetics using Tailwind.

## Architecture
- `src/components/providers/consent-provider.tsx`: Context provider.
- `src/components/consent-banner.tsx`: UI component for the banner.

## Related Code Files
- Create: `src/components/providers/consent-provider.tsx`
- Create: `src/components/consent-banner.tsx`
- Modify: `src/app/layout.tsx` (wrap with `ConsentProvider`)

## Implementation Steps
1. Create `ConsentProvider` with `useEffect` to read `bipbip_consent_status` from `localStorage`.
2. Create `ConsentBanner` UI component that reads from the context and renders conditionally.
3. Import and wrap `children` in `src/app/layout.tsx` with `ConsentProvider`.
4. Include `ConsentBanner` in `src/app/layout.tsx` (or `page.tsx` and other public layouts) to ensure it shows globally but not in admin.

## Success Criteria
- [ ] Banner appears when user visits for the first time.
- [ ] Clicking Accept/Decline saves the correct value to `localStorage` and hides the banner.
- [ ] Refreshing the page does not show the banner again.
- [ ] Banner does not appear on `/admin` routes.

## Risk Assessment
- Hydration mismatch: Solved by keeping the initial state as `pending` and updating in `useEffect`.
- Flicker: Banner might flash on load. Solved by rendering the banner only if `isMounted` and `status === 'pending'`.
