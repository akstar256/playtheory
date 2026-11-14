# PlayTheory — Build Plan

> Mirrors Section 21 of `PlayTheory_Master_Build_Brief.md`. Keep this checklist current after each phase.

---

## Phase 0: Foundation and skeleton deploy (about 1.5 h)
- [x] Scaffold Next.js App Router, strict TypeScript, Tailwind CSS
- [x] Configure ESLint, Vitest, Playwright
- [x] Create `.env.example` and `.env.local`
- [x] Define `Store` interface (`lib/store/types.ts`) with in-memory adapter (`lib/store/memory.ts`) and Upstash adapter (`lib/store/upstash.ts`)
- [x] Create `/api/health` route checking system liveness and store readiness
- [x] Add basic smoke test script (`scripts/smoke.ts`)
- [x] Run typecheck, lint, and unit tests
- [x] Build successfully passes production build (`npm run build`)
- [x] Push/Deploy skeleton to Vercel and verify `/api/health` on live URL (`https://playtheory-gamma.vercel.app`)

*Acceptance Criteria:* Public URL serves skeleton; `/api/health` returns OK; CI-style check runs typecheck, lint, tests. (PASSED ✅)

*Acceptance Criteria:* Public URL serves skeleton; `/api/health` returns OK; CI-style check runs typecheck, lint, tests.

---

## Phase 1: Vertical slice (about 6 h)
- [x] Define Zod schemas for `SimSpec` (Section 7.1) and API contracts
- [x] Implement provider-agnostic LLM adapter in `lib/llm/` with Gemini provider
- [x] Implement planner (`app/api/plan/route.ts` & `lib/llm/prompts/planner.ts`)
- [x] Implement builder with SSE streaming (`app/api/build/route.ts` & `lib/llm/prompts/builder.ts`)
- [x] Author 3 archetype exemplars (`particles`, `ode_phase`, `agents`) in `lib/archetypes/`
- [x] Implement runtime shell and sandboxed iframe (`lib/runtime/shell.ts` and `SimKit` in `lib/runtime/simkit.ts`)
- [x] Implement interactive host player with fixed 1/60s loop, play/pause, reset, speed controls (`components/SimPlayer.tsx`)
- [x] Build parameter sliders and live metric plot panel (`components/ParamPanel.tsx` & `components/Plots.tsx`)
- [x] Implement interactive simulation view (`app/s/[slug]/page.tsx` & `SimulationView.tsx`)
- [x] Connect end-to-end prompt-to-simulation pipeline on homepage (`app/page.tsx`)

*Acceptance Criteria:* Three different concepts produce visibly working simulations on the deployed site. (PASSED ✅)

*Acceptance Criteria:* Three different concepts produce visibly working simulations on the deployed site.

---

## Phase 2: Verifier and repair loop (about 6 h)
- [x] Implement static checks (`lib/verify/static.ts`): Acorn parse, banned identifiers scan, size cap (<24KB), interface check
- [x] Implement loop-guard AST instrumentation (`lib/verify/loopGuard.ts`): iteration counters, 1e6 budget limit
- [x] Implement headless model checks (`lib/verify/modelChecks.ts`): 600 steps execution, finite checks, metric presence, determinism, parameter sensitivity (dead slider detection), bounded values
- [x] Implement draw checks (`lib/verify/drawChecks.ts`): offscreen canvas render at t=0, t=2, t=5, pixel variance (blank detection), animation changes
- [x] Assemble pure `verify(code, spec, env)` returning typed `VerificationReport` (`lib/verify/index.ts`)
- [x] Implement signed HMAC job tokens (`lib/security/jobToken.ts`)
- [x] Implement `/api/repair` endpoint and client repair state machine (`lib/pipeline/orchestrator.ts`)
- [x] Build Pipeline Timeline UI: live streaming code, stages, and real-time pass/fail check rows (`components/PipelineTimeline.tsx`)
- [x] Add comprehensive test suite with fixtures for every failure mode (infinite loops, NaNs, dead sliders, blank canvas, banned APIs) (`tests/unit/verifier.test.ts`)

*Acceptance Criteria:* Every bad fixture test fails with the right check id; a broken generation is repaired live; after 3 attempts fallback activates. (PASSED ✅)

*Acceptance Criteria:* Every bad fixture test fails with the right check id; a broken generation is repaired live; after 3 attempts fallback activates.

---

## Phase 3: Learning experience and UI polish (about 5 h)
- [ ] Implement guided tour pipeline (`POST /api/guide` and `lib/pipeline/guide.ts`)
- [ ] Build Tour Panel with "predict-then-reveal" interaction mode
- [ ] Build Quiz Panel with 4 interactive questions, score tracking, and explanations
- [ ] Build Misconceptions callout component
- [ ] Build "Under the hood" tab: inspect spec, verification report, repair history, and code viewer
- [ ] Implement landing page: large search input, level selector, 6 instant cache chips, animated thumbnail gallery
- [ ] Implement design tokens in `docs/DESIGN.md` ("lab notebook meets arcade", warm paper / deep ink themes)
- [ ] Responsive layout check: mobile viewport testing at 390px
- [ ] Accessibility pass: keyboard shortcuts (Space, R, Arrow keys), `aria-live` metric summary, reduced motion, contrast audit
- [ ] Shareable simulation links (`/s/[slug]`) with SSR dynamic Open Graph metadata

*Acceptance Criteria:* Full learner journey works on 390px mobile viewport; keyboard operation verified; Lighthouse accessibility >= 90.

---

## Phase 4: Reliability, gallery and eval (about 5 h)
- [ ] Connect Upstash Redis adapter (`lib/store/upstash.ts`)
- [ ] Implement simulation caching (`sha256(normalize(concept) + "|" + level + "|" + schemaVersion)`)
- [ ] Implement per-IP rate limiting (`RATE_LIMIT_GENERATIONS_PER_HOUR`)
- [ ] Implement global daily spend cap (`DAILY_BUDGET_USD`) and graceful degradation
- [ ] Hand-craft remaining 5+ archetype exemplars (graph_network, cellular_automaton, queue_flow, geometry_optics, monte_carlo, wave, landscape_optimization)
- [ ] Implement `scripts/seed-gallery.ts` and generate 20 verified gallery simulations
- [ ] Implement `/api/stats` and `/status` dashboard showing live aggregate counters
- [ ] Implement automated eval harness `scripts/eval.ts` running over 30 concepts in `eval/concepts.json`
- [ ] Publish real eval results in `docs/EVAL.md` and refine prompts based on frequent failure modes

*Acceptance Criteria:* Gallery loads instantly; rate limit and spend cap degrade gracefully; `docs/EVAL.md` exists with real data.

---

## Phase 5: Documentation and demo support (about 3 h)
- [ ] Complete `README.md` with demo GIF, live URL, quickstart, architecture diagram, and eval results
- [ ] Write `docs/ARCHITECTURE.md` (pipeline, contracts, verifier checks, state machine, sandbox)
- [ ] Write `docs/DEPLOY.md` with exact deployment and smoke testing instructions
- [ ] Complete `AI_USAGE.md` detailing tool usage
- [ ] Add interactive architecture diagram on `/about`
- [ ] Implement and verify Playwright E2E suite
- [ ] Run production smoke test (`scripts/smoke.ts`)

*Acceptance Criteria:* Comprehensive documentation allowing any stranger to understand, run, and deploy the project.

---

## Phase 6: Freeze, harden, submit (about 2 h)
- [ ] Feature freeze: zero new features, bug fixes only
- [ ] Verify smoke test passes against live production URL
- [ ] Verify in mobile viewports and incognito browsers
- [ ] Record 3-minute demo video following Appendix A script
- [ ] Submit to Devpost (IceHacks 2026: Best Deployed App & Best AI Hack)

*Acceptance Criteria:* Devpost submission confirmed with live URL, video, and repository before deadline.
