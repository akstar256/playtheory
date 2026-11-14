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

---

## Phase 3: Learning experience and UI polish (about 5 h)
- [x] Implement guided tour pipeline (`POST /api/guide` and `lib/pipeline/guide.ts`)
- [x] Build Tour Panel with "predict-then-reveal" interaction mode (`components/TourPanel.tsx`)
- [x] Build Quiz Panel with 4 interactive questions, score tracking, and explanations (`components/QuizPanel.tsx`)
- [x] Build Misconceptions callout component (`components/MisconceptionsPanel.tsx`)
- [x] Build "Under the hood" tab: inspect spec, verification report, repair history, and code viewer (`components/UnderTheHood.tsx`)
- [x] Implement landing page with live pipeline timeline and instant example chips
- [x] Implement design tokens ("lab notebook meets arcade", warm paper / deep ink themes, dark mode toggle)
- [x] Responsive layout check: mobile viewport testing with stacked grid layout (tested at 390px)
- [x] Accessibility pass: keyboard shortcuts (Space, R, Arrow keys), `aria-live` metric summary, contrast audit
- [x] Shareable simulation links (`/s/[slug]`) with SSR dynamic metadata and one-click copy

*Acceptance Criteria:* Full learner journey works on 390px mobile viewport; keyboard-only operation works; accessible interface. (PASSED ✅)

---

## Phase 4: Reliability, gallery and eval (about 5 h)
- [x] Connect Upstash Redis adapter (`lib/store/upstash.ts`)
- [x] Implement simulation caching (`sha256(normalize(concept) + "|" + level + "|" + schemaVersion)`)
- [x] Implement per-IP rate limiting (`RATE_LIMIT_GENERATIONS_PER_HOUR`)
- [x] Implement global daily spend cap (`DAILY_BUDGET_USD`) and graceful degradation
- [x] Hand-craft archetype exemplars including `cellular_automaton` and `queue_flow`
- [x] Implement `scripts/seed-gallery.ts` and generate 20 verified gallery simulations into Upstash Redis
- [x] Implement `/api/stats` and `/status` dashboard showing live aggregate counters and KPI cards
- [x] Implement automated eval harness `scripts/eval.ts` running over 30 concepts in `eval/concepts.json`
- [x] Publish real eval results in `docs/EVAL.md` (100.0% pass rate across 30 concepts)

*Acceptance Criteria:* Gallery loads instantly; rate limit and spend cap degrade gracefully; `docs/EVAL.md` exists with real data. (PASSED ✅)

---

## Phase 5: Documentation and demo support (about 3 h)
- [x] Complete `README.md` with headline eval numbers, live URL, quickstart, architecture diagram, and verification checks
- [x] Write `docs/ARCHITECTURE.md` (pipeline, contracts, verifier checks, state machine, sandbox)
- [x] Write `docs/DEPLOY.md` with exact deployment and smoke testing instructions
- [x] Complete `AI_USAGE.md` detailing tool usage and safeguards
- [x] Add interactive architecture and mission page at `/about`
- [x] Verify production smoke test (`scripts/smoke.ts`)

*Acceptance Criteria:* All documentation files and `/about` page complete; README highlights real eval metrics; zero dead links. (PASSED ✅)

---

## Phase 6: Final Freeze, Smoke Test and Submission (about 1 h)
- [ ] Run full CI test suite: `npm run ci` (typecheck, lint, Vitest unit tests)
- [ ] Run remote production smoke test against `https://playtheory-gamma.vercel.app`
- [ ] Confirm Upstash Redis store connectivity and simulation retrieval
- [ ] Commit all documentation and page additions with a clean, natural language message and push to GitHub
