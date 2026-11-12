# Execution Plan — Go-live Foundation then Analytics/Ads

## Scope and invariants
- Goal A must complete first: deploy foundation, persistence migration, hardening, healthcheck, and local production-like validation.
- Goal B starts only after Goal A acceptance is met: analytics, consent, and ads.
- Route/API behavior contract remains stable during both goals:
  - Keep current public routes and admin routes unchanged.
  - Keep request/response shape for existing APIs stable (especially `/api/analytics`; only implementation behind it changes).
- Deployment target assumptions: Railway + Cloudflare + Docker. No Vercel-specific features, configs, or runtime assumptions.

---

## Milestones

### Milestone A1 — Deploy foundation baseline
**Objective**
Create a reproducible deployment baseline for Railway/Cloudflare with production-like local run.

**Work items**
- Standardize environment contract in `.env.example` (app, auth, Supabase, site URL, reserved analytics/ads vars).
- Ensure Docker build/runtime path is canonical (`next build` then `next start`) and documented.
- Align runbook/checklists to Railway + Cloudflare flow only.

**Acceptance criteria**
- App builds and starts from Docker image locally.
- Required env vars are documented and sufficient to boot app.
- No deployment instruction depends on Vercel.

---

### Milestone A2 — Persistence migration (blocking)
**Objective**
Eliminate local-file persistence and local upload dependency for stateless production runtime.

**Work items**
- Move story/content persistence from local JSON/files to Supabase-backed repository.
- Move uploaded assets to persistent object storage (Supabase Storage or equivalent durable store used by project).
- Keep existing route behavior and admin UX contract stable while switching storage backend.

**Acceptance criteria**
- No production data path depends on local disk persistence.
- Read/write admin flows work with Supabase-backed persistence.
- Existing user-facing pages render identical content semantics before/after migration.

---

### Milestone A3 — Security hardening + healthcheck
**Objective**
Enforce minimum production security posture and add readiness/liveness signal.

**Work items**
- Remove insecure production fallback patterns (e.g., default admin secret behavior).
- Add explicit health endpoint for container/platform checks.
- Validate sensitive config handling (missing secret => fail fast in production mode).

**Acceptance criteria**
- Production boot fails safely if required secrets are missing/weak.
- Health endpoint returns deterministic success/failure for orchestrator checks.
- No sensitive secret value is logged in app/server output.

---

### Milestone A4 — Local production-like validation
**Objective**
Prove Goal A readiness before touching analytics/ads.

**Work items**
- Run full local validation using production build path and Docker runtime.
- Execute smoke tests for core routes and admin flows.

**Acceptance criteria**
- Lint/build/start pass in production mode.
- Dockerized smoke test passes for key routes and admin operations.
- Goal A checklist is fully checked with evidence (command outputs + smoke results).

---

### Milestone B1 — Analytics backend implementation
**Objective**
Replace placeholder analytics endpoint with real persistence while preserving API contract.

**Work items**
- Keep `POST /api/analytics` request/response contract stable.
- Persist events to chosen sink (default: Supabase events table; optional adapter to GA4 MP if required later).
- Add basic validation, throttling protections, and error handling without breaking caller contract.

**Acceptance criteria**
- Incoming analytics events are stored reliably in configured sink.
- Existing callers do not require payload or parsing changes.
- Failure path returns stable, non-sensitive errors.

---

### Milestone B2 — Event instrumentation on core journeys
**Objective**
Track key user events with de-duplication-safe behavior.

**Work items**
- Instrument home, listing, story detail, chapter view, search, next-chapter click.
- Prevent duplicate event emission on client navigation/re-render edge cases.

**Acceptance criteria**
- Each target event fires exactly once per intended interaction.
- Event payload fields match analytics contract.
- No measurable UX regression on target pages.

---

### Milestone B3 — Consent gating + web ads rollout
**Objective**
Enable compliant script loading and ad placement for web pages.

**Work items**
- Add consent gate before loading analytics/ads scripts.
- Enable AdSense placements for approved non-admin surfaces only.
- Keep AdMob out of scope unless a native/mobile wrapper phase is approved.

**Acceptance criteria**
- Without consent: tracking/ads scripts are not loaded.
- With consent: scripts load and ad slots render on defined pages.
- Admin pages stay ad-free.

---

## Verification checklist (must pass before marking done)

### Goal A verification (required before Goal B starts)
- [ ] Dependency install clean.
- [ ] Lint passes.
- [ ] Production build passes.
- [ ] Production start passes.
- [ ] Docker build succeeds.
- [ ] Docker run smoke test passes (public routes + admin flow).
- [ ] Health endpoint returns expected status.
- [ ] Persistence test confirms no local-disk dependency in runtime data path.

### Goal B verification
- [ ] `/api/analytics` receives and persists valid events.
- [ ] Invalid analytics payload path is handled safely.
- [ ] Core journey events are emitted with no duplicate-fire regressions.
- [ ] Consent-off: no analytics/ads script load.
- [ ] Consent-on: analytics active and AdSense renders on approved pages.

---

## Security constraints (explicit)
- Never use default or weak fallback secrets in production.
- Secrets must come from runtime env; do not hardcode or commit secrets.
- Fail fast on missing required production secrets.
- Validate and sanitize analytics payload inputs.
- Restrict ad/tracking scripts to consented sessions only.
- Keep admin surface isolated from ad code and unnecessary third-party scripts.
- Do not expose internal error details or credentials in API responses/logs.

---

## Risks and blockers
- **Data migration risk:** legacy local content/upload data may need one-off import strategy to Supabase.
- **Contract drift risk:** analytics changes may accidentally alter endpoint response shape.
- **Consent compliance risk:** incorrect script gating can violate policy requirements.
- **Infra config risk:** Railway/Cloudflare env mismatches (URLs, headers, cache behavior) can break runtime assumptions.
- **Ad approval dependency:** AdSense account/site approval and policy checks may delay rollout.

---

## Next actions (execution order)
1. Freeze and document route/API behavior contract baseline.
2. Complete Milestones A1 → A4 in order, collect verification evidence.
3. Gate decision: only proceed when all Goal A acceptance criteria pass.
4. Execute Milestones B1 → B3 with contract-preserving implementation.
5. Run full verification checklist and record any residual risks for release sign-off.

---

## Open decisions
1. Analytics primary sink now: Supabase-only or dual-write with GA4 Measurement Protocol.
2. Consent model: simple binary consent vs category-based consent (analytics/ads split).
3. Ad rollout scope: exact initial placements and density limits per page type.
4. Data migration strategy for legacy local files: one-time import script vs manual admin re-entry.
5. Cloudflare involvement mode: proxy/CDN only vs additional edge logic in this phase.

---

## Strict TDD Strategy (Goal A First)

### RED-GREEN-REFACTOR Execution Order per Scope

Each scope below must run RED → GREEN → REFACTOR in sequence. No implementation code may be committed unless a failing test exists for it first.

| Scope | File | RED | GREEN | REFACTOR |
|---|---|---|---|---|
| A1 | `src/lib/auth.ts` | Write failing auth unit tests | Implement minimum to pass | Clean error messages, constants |
| A2 | `src/lib/repository.ts` | Write failing repo unit tests | Implement minimum DB calls/mappers | Extract adapters, reduce coupling |
| A3 | `src/lib/admin-actions.ts` | Write failing admin action unit tests | Implement minimum action logic | Consolidate validation/error paths |
| A4 | `src/app/api/health/route.ts` | Write failing health route unit tests | Implement minimal route | Normalize response schema |
| I1 | Supabase DB integration | Write failing integration tests | Implement DB roundtrip | Optimize queries/retry |
| I2 | Supabase Storage integration | Write failing storage tests | Implement upload/read paths | Error handling, rollback |
| E1 | Public routes E2E | Write failing smoke scenarios | Seed data + start app | Route stability polish |
| E2 | Admin flow E2E | Write failing admin scenarios | Implement flow verification | Cleanup, session helpers |

---

### Unit Test Suites (Goal A)

#### Suite 1 — `src/lib/auth.ts`

**TC-AUTH-01 — Reject missing ADMIN_PASSWORD in production**
- Preconditions: `NODE_ENV=production`, `ADMIN_PASSWORD` unset or empty
- Expected result: auth check throws config error; no implicit fallback accepted

**TC-AUTH-02 — Reject weak default password (`changeme`) in production**
- Preconditions: `NODE_ENV=production`, `ADMIN_PASSWORD=changeme`
- Expected result: explicit configuration error returned; request cannot succeed

**TC-AUTH-03 — Accept correct credential in development**
- Preconditions: `NODE_ENV=development`, `ADMIN_PASSWORD=valid-dev-secret`
- Expected result: matching credential returns `true`; non-matching returns `false`

**TC-AUTH-04 — Constant-time comparison on credential check**
- Preconditions: valid `ADMIN_PASSWORD` set; invoke with matching and non-matching
- Expected result: Boolean result correct; comparison uses secure helper (timingSafeEqual or equivalent)

---

#### Suite 2 — `src/lib/repository.ts`

**TC-REPO-01 — Fetch story list from Supabase source**
- Preconditions: Supabase query mock returns stories dataset
- Expected result: mapped domain list shape returned with default sort/filter applied

**TC-REPO-02 — Fetch story detail by slug (found)**
- Preconditions: Supabase returns one story + chapters for given slug
- Expected result: full detail object with correct field mapping

**TC-REPO-03 — Fetch story detail by slug (not found)**
- Preconditions: Supabase returns empty/null for unknown slug
- Expected result: `null` or defined not-found result; no throw

**TC-REPO-04 — Persist story create**
- Preconditions: valid story payload; Supabase insert mock returns created row
- Expected result: correct columns sent to Supabase; returned object reflects persisted values

**TC-REPO-05 — Translate Supabase error to domain error**
- Preconditions: Supabase call returns error code/message
- Expected result: normalized domain error with deterministic shape; no raw Supabase internals leaked

---

#### Suite 3 — `src/lib/admin-actions.ts`

**TC-ADMIN-01 — Block unauthenticated mutation**
- Preconditions: no valid admin session/password context
- Expected result: action aborts with unauthorized; no repository/storage method called

**TC-ADMIN-02 — Validate required payload fields**
- Preconditions: missing or invalid required fields in payload
- Expected result: validation errors returned; no downstream write

**TC-ADMIN-03 — Persist content on valid authenticated request**
- Preconditions: authenticated context; valid payload; repository mock succeeds
- Expected result: correct repository method called with mapped payload; success result with id/status

**TC-ADMIN-04 — Handle storage upload failure gracefully**
- Preconditions: authenticated context; storage upload mock fails
- Expected result: handled error returned; no partial write left in DB

---

#### Suite 4 — `src/app/api/health/route.ts`

**TC-HEALTH-01 — Healthy response contract**
- Preconditions: all probes/dependencies available
- Expected result: HTTP 200; JSON includes `{ status: "ok", timestamp: <ISO> }`

**TC-HEALTH-02 — Degraded dependency response**
- Preconditions: DB probe mock fails
- Expected result: non-200 status (503 or 200 with degraded flag per contract); JSON identifies failing check

**TC-HEALTH-03 — Method restriction**
- Preconditions: non-GET request sent to endpoint
- Expected result: appropriate rejection status; error payload follows API contract

---

### Integration Test Scopes (Supabase DB + Storage)

**IT-01 — Story CRUD roundtrip with DB**
- Preconditions: test Supabase project with schema migrated; seed admin context
- Expected result: create → read by slug → update → delete flow all succeed; DB rows reflect lifecycle

**IT-02 — Chapter write/read consistency**
- Preconditions: existing story in DB
- Expected result: chapter ordering and slug uniqueness enforced; reads return latest persisted content

**IT-03 — Cover upload + metadata persistence**
- Preconditions: Supabase Storage bucket configured; valid image fixture
- Expected result: file in bucket at expected path; public URL stored in DB and readable via repository

**IT-04 — Storage failure rollback behavior**
- Preconditions: admin flow with forced Storage error
- Expected result: DB row not in broken half-written state; actionable error returned

**IT-05 — Health endpoint with real DB probe**
- Preconditions: app running against test Supabase
- Expected result: health status reflects DB availability transitions accurately

---

### E2E Smoke Scenarios (main routes + admin flow)

**E2E-01 — Public route smoke**
- Preconditions: production build started; seed data present
- Expected result: `/`, `/stories`, `/stories/[slug]`, `/stories/[slug]/[chapterSlug]`, `/search` all render successfully with content; no 500 or blank page

**E2E-02 — Admin login**
- Preconditions: valid `ADMIN_PASSWORD` configured
- Expected result: valid credentials → authenticated; invalid credentials → rejected; protected routes inaccessible without auth

**E2E-03 — Admin create/update publishing flow**
- Preconditions: authenticated admin session
- Expected result: create story + chapter succeeds; update title/content succeeds; public pages reflect updated content

**E2E-04 — Admin media upload flow**
- Preconditions: authenticated admin session; image fixture
- Expected result: upload succeeds; preview/reference updates; asset accessible after reload

---

### Practical Command Sequence (gate progression)

Execute in strict order; block advancement if current step fails.

```bash
# Step 1 — Clean install
npm ci

# Step 2 — Unit tests (Goal A scopes only)
npm test -- --testPathPattern="src/lib/auth"
npm test -- --testPathPattern="src/lib/repository"
npm test -- --testPathPattern="src/lib/admin-actions"
npm test -- --testPathPattern="src/app/api/health/route"

# Step 3 — Integration tests (requires TEST Supabase env)
npm run test:integration

# Step 4 — Lint + build gate
npm run lint
npm run build

# Step 5 — Start + E2E smoke
npm run start &
npm run test:e2e -- --grep "smoke|admin"

# Step 6 — Docker gate
docker build -t bipbip-prod .
docker run --env-file .env.local bipbip-prod
# manually smoke routes from container
```

Progression rule: **all Goal A gates must be green before any Goal B (analytics/ads) code is written**.

---

### Blockers Requiring User Input / Env Setup

1. **Supabase project credentials** — needed before any integration/E2E test runs:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Service role key (if admin actions require elevated permissions)

2. **Dedicated test Supabase project** — integration tests need isolation from production DB; confirm whether a separate test project or isolated schema will be used.

3. **Supabase Storage bucket details** — bucket name, public/private policy, and expected public URL pattern must be known before IT-03 is written.

4. **Admin credential provisioning method** — confirm how `ADMIN_PASSWORD` will be injected in Railway/Cloudflare (platform secrets vs secret manager) to finalize TC-AUTH-01/02 production behavior expectations.

5. **Test runner / script mapping** — confirm exact npm scripts: `test`, `test:integration`, `test:e2e` and whether Jest or Vitest is used.

6. **Health check degraded contract** — agree on: HTTP 503 vs 200+body-flag for degraded state; which probes are required (DB only vs DB+Storage).

7. **Legacy data migration strategy** — one-off import script or manual admin re-entry; needed before IT-01 seed data is designed.