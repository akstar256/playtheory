# PlayTheory — Current Project Status

> Updated after each milestone. Single source of truth for current state and next immediate steps.

**Current Phase:** Phase 3 (Learning Experience and UI Polish)  
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
- [x] Unit test suite passing 29/29 tests across all 7 test suites

---

### What Is In Progress / Broken
- [ ] Phase 3: Learning experience & UI polish (Guided tour with predict-then-reveal, quiz panel, misconceptions, under-the-hood inspector, responsive 390px mobile layout)

---

### What Is Next
1. Commit Phase 2 changes with a natural language message and push to GitHub.
2. Implement Guided Tour pipeline (`/api/guide` and `lib/pipeline/guide.ts`).
3. Build Tour Panel with "predict-then-reveal" interactive steps.
4. Build Interactive Quiz Panel with score tracking, explanations, and misconceptions tab.
5. Build "Under the hood" tab: live spec JSON viewer, verification report, and repair history.
6. Mobile layout and accessibility pass (WCAG 2.1 AA).

---

### Risks & Mitigations
- **Risk:** LLM Rate limits on free tier (5–15 RPM).
  - *Mitigation:* Implement caching via Upstash Redis and automatic backoff/retry with jitter in `lib/llm/`.
- **Risk:** Generated simulation infinite loops or crashes in client.
  - *Mitigation:* AST loop-guard instrumentation with Acorn, 1e6 iteration budget, and isolated Web Worker verification.
