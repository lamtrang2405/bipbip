---
phase: 4
title: "Testing and Validation"
status: completed
priority: P1
effort: "1h"
dependencies: ["2", "3"]
---

# Phase 4: Testing and Validation

## Overview
Perform comprehensive testing to ensure tracking and ads implementation does not break the core application, respects consent, and gracefully handles adblockers.

## Requirements
- Functional:
  - Verify consent banner interaction and persistence.
  - Verify script loading under different consent states.
  - Verify fallback behavior when Adblockers are active.
  - Ensure `/api/analytics` legacy endpoint is undisturbed.

## Architecture
- Manual testing flows and basic smoke testing.

## Related Code Files
- No specific file modifications. Focus on testing the entire flow.

## Implementation Steps
1. **Scenario 1 (No Consent):** Load app, ignore banner. Check network tab: NO `gtag` or `adsbygoogle` requests.
2. **Scenario 2 (Consent Denied):** Click Decline. Check network tab: NO scripts loaded. Refresh page: Banner does not appear.
3. **Scenario 3 (Consent Granted):** Click Accept. Scripts load immediately. Ads initialize. GA4 events fire. Refresh page: scripts load automatically.
4. **Scenario 4 (Adblocker Active):** With uBlock Origin enabled, click Accept. Verify the app does not crash when `window.gtag` or `window.adsbygoogle` fails to resolve or push.
5. **Scenario 5 (Admin Area):** Navigate to `/admin`. Verify no banner, no tracking scripts, no ads loaded.

## Success Criteria
- [ ] All 5 scenarios pass.
- [ ] No regression in the reading experience (page transitions work smoothly).
- [ ] Application health check `/api/health` still responds correctly.

## Risk Assessment
- Testing relies on manual validation.
- Mitigation: Clear documentation of the testing scenarios to execute before production release.
