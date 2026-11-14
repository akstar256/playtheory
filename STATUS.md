# PlayTheory — Current Project Status

> Updated after each milestone. Single source of truth for current state and next immediate steps.

**Current Phase:** Phase 1 (Vertical Slice)  
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
- [x] Vitest unit test suite (6/6 passing across store and health check)
- [x] Production build passes (`npm run build`)
- [x] Production smoke test script green (`scripts/smoke.ts`)

---

### What Is In Progress / Broken
- [ ] Phase 1: Vertical Slice (Zod schemas, Gemini LLM streaming adapter, archetypes, sandboxed iframe)

---

### What Is Next
1. Build `lib/schemas/simSpec.ts` and `lib/schemas/contracts.ts` (Zod schemas per Section 7).
2. Implement Gemini LLM provider adapter in `lib/llm/gemini.ts` (JSON generation, streaming SSE, cost accounting).
3. Author 3 initial archetype exemplars (`particles`, `ode_phase`, `agents`) in `lib/archetypes/`.
4. Implement sandboxed iframe runtime shell with `SimKit`.
5. Connect generation pipeline (`/api/plan` -> `/api/build`) and interactive player with parameter panel and live canvas.

---

### Risks & Mitigations
- **Risk:** LLM Rate limits on free tier (5–15 RPM).
  - *Mitigation:* Implement caching via Upstash Redis and automatic backoff/retry with jitter in `lib/llm/`.
- **Risk:** Generated simulation infinite loops or crashes in client.
  - *Mitigation:* AST loop-guard instrumentation with Acorn, 1e6 iteration budget, and isolated Web Worker verification.
