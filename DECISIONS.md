# PlayTheory — Architecture & Engineering Decisions Log

Every assumption, technical decision, or deviation is logged here as a concise one-liner.

1. **2026-11-14**: Chose Google Gemini API as primary LLM provider with `gemini-2.5-pro` for planning and `gemini-2.5-flash` for code generation.
2. **2026-11-14**: Set `DAILY_BUDGET_USD=0` in `.env.local` to indicate free-tier quota mode while enforcing rate limits via `RATE_LIMIT_GENERATIONS_PER_HOUR=20`.
3. **2026-11-14**: Chose dual store architecture (`lib/store/`) supporting in-memory for zero-dependency tests/local dev and Upstash Redis for production persistence.
4. **2026-11-14**: Selected Next.js App Router with TypeScript strict mode, Tailwind CSS, Vitest for unit testing, and Playwright for E2E and headless verification.
5. **2026-11-14**: Vercel selected as primary deployment host with automatic GitHub CI/CD integration.
6. **2026-11-14**: Implemented `SimKit` with Okabe-Ito colorblind palette, Euler-Cromer integration helpers, and Box-Muller Gaussian PRNG.
7. **2026-11-14**: Chose native fetch-based SSE streaming for Gemini API to ensure zero-dependency edge compatibility and low latency.
8. **2026-11-14**: Sandboxed iframe uses `<iframe sandbox="allow-scripts">` without `allow-same-origin` and CSP `default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:;` for total process and DOM isolation.
9. **2026-11-14**: Implemented AST loop-guard rewriting using Acorn and Astring, wrapping all loops with iteration counters and a hard 1,000,000-iteration budget throwing `LoopBudgetError`.
10. **2026-11-14**: Implemented signed HMAC SHA-256 job tokens to strictly cap self-repair iterations at 3 attempts, preventing unbounded spend and client replay.
11. **2026-11-14**: Dead slider sensitivity check executes 300 steps at min vs max parameter bounds; fails if more than one-third of parameters produce zero metric variance.
