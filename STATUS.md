# PlayTheory — Current Project Status

> Updated after each milestone. Single source of truth for current state and next immediate steps.

**Current Phase:** Phase 2 (Verifier and Self-Repair Loop)  
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
- [x] Full end-to-end concept prompt generator on homepage
- [x] Unit test suite passing 19/19 tests across schemas, math helpers, archetypes, store, and health

---

### What Is In Progress / Broken
- [ ] Phase 2: Verifier harness (12 checks: static AST, loop-guard, headless worker, canvas variance) and self-repair loop (`/api/repair`)

---

### What Is Next
1. Commit Phase 1 changes and push to `origin/main` to trigger Vercel deployment.
2. Implement AST loop-guard instrumentation with Acorn in `lib/verify/loopGuard.ts`.
3. Implement static checks and banned identifier analysis in `lib/verify/static.ts`.
4. Implement headless worker checks (600 steps, finite metrics, dead slider sensitivity) in `lib/verify/modelChecks.ts`.
5. Implement offscreen canvas variance and animation checks in `lib/verify/drawChecks.ts`.
6. Implement `/api/repair` with client state machine orchestrator and live timeline UI.

---

### Risks & Mitigations
- **Risk:** LLM Rate limits on free tier (5–15 RPM).
  - *Mitigation:* Implement caching via Upstash Redis and automatic backoff/retry with jitter in `lib/llm/`.
- **Risk:** Generated simulation infinite loops or crashes in client.
  - *Mitigation:* AST loop-guard instrumentation with Acorn, 1e6 iteration budget, and isolated Web Worker verification.
