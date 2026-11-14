# PlayTheory — Current Project Status

> Updated after each milestone. Single source of truth for current state and next immediate steps.

**Current Phase:** Phase 4 (Reliability, Gallery and Evaluation)  
**Last Updated:** 2026-11-14  
**Live Production URL:** https://playtheory-gamma.vercel.app  

---

### What Works
- [x] Master Build Brief ingested and parsed
- [x] Version control initialized with `.gitignore` and `.env.example`
- [x] Tracking system active: `PLAN.md`, `DECISIONS.md`, `STATUS.md`
- [x] Project environment credentials configured in `.env.local`
- [x] Next.js App Router with TypeScript strict mode and Tailwind CSS
- [x] Dual-mode Store interface (`MemoryStore` and `UpstashStore`)
- [x] Live public production deployment at `https://playtheory-gamma.vercel.app`
- [x] Live `/api/health` returning 200 OK with Upstash Redis ping verified (27ms)
- [x] Zod validation for `SimSpec` (2-6 params, dynamics, visual plots, presets, misconceptions, quiz)
- [x] Provider-agnostic Gemini LLM adapter with streaming SSE and structured JSON generation
- [x] Three hand-crafted archetype exemplars (`particles`, `ode_phase`, `agents`)
- [x] Sandboxed iframe runtime shell with strict CSP and `SimKit` mathematical helpers
- [x] Interactive Simulation Player (`SimPlayer`), Parameter Sliders (`ParamPanel`), and Canvas Telemetry Plots (`Plots`)
- [x] 12-point automated verifier harness (`lib/verify/`): static parse/banned/size, loop-guard instrumentation, 600-step headless model run, finite check, metrics check, determinism, dead slider sensitivity, canvas draw checks
- [x] Autonomous self-repair loop (`/api/repair`) with signed HMAC job tokens (max 3 attempts)
- [x] Live Pipeline Timeline UI (`components/PipelineTimeline.tsx`) with real-time pass/fail check rows
- [x] Guided Tour with interactive "Predict-Then-Reveal" mechanics (`components/TourPanel.tsx`)
- [x] Conceptual Mastery Quiz with instant score tracking & explanations (`components/QuizPanel.tsx`)
- [x] Common Misconceptions & Realities cards (`components/MisconceptionsPanel.tsx`)
- [x] "Under the Hood" inspection tab (`components/UnderTheHood.tsx`): live SimSpec JSON, verification report, repair history, source code
- [x] Dark mode toggle, keyboard accessibility (Space, R, Arrow keys), throttled `aria-live` screen-reader announcements
- [x] Unit test suite passing 30/30 tests across all 8 test suites

---

### What Is In Progress / Broken
- [ ] Phase 4: Reliability, Gallery and Evaluation (Seed script for 20 simulations, `/api/stats`, `/status` dashboard, automated evaluation harness `scripts/eval.ts` generating `docs/EVAL.md`)

---

### What Is Next
1. Commit Phase 3 changes with a simple natural language message and push to GitHub.
2. Author remaining archetype exemplars to expand library.
3. Build gallery seeding script (`scripts/seed-gallery.ts`) for 20 verified simulations stored in Upstash Redis.
4. Implement `/api/stats` and public `/status` dashboard.
5. Build automated evaluation script `scripts/eval.ts` running headlessly over `eval/concepts.json` (30+ concepts) and publishing real metrics to `docs/EVAL.md`.

---

### Risks & Mitigations
- **Risk:** LLM Rate limits on free tier (5–15 RPM).
  - *Mitigation:* Implement caching via Upstash Redis and automatic backoff/retry with jitter in `lib/llm/`.
- **Risk:** Generated simulation infinite loops or crashes in client.
  - *Mitigation:* AST loop-guard instrumentation with Acorn, 1e6 iteration budget, and isolated Web Worker verification.
