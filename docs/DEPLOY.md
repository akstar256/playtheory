# PlayTheory — Deployment & Verification Guide

## 1. Live Production Deployment

- **Production URL:** [https://playtheory-gamma.vercel.app](https://playtheory-gamma.vercel.app)
- **Deployment Platform:** Vercel (Next.js 15 App Router on Node.js 20)
- **Database & Cache:** Upstash Redis Serverless REST API
- **AI Backend:** Google AI Studio (Gemini 2.5 Pro & Gemini 2.5 Flash)

---

## 2. Environment Configuration

The following production environment variables are configured in the Vercel dashboard:

| Variable | Recommended Production Value | Description |
|---|---|---|
| `LLM_PROVIDER` | `gemini` | Primary LLM provider |
| `LLM_API_KEY` | `AQ.Ab8RN6...` | Google AI Studio API key |
| `LLM_MODEL_PLAN` | `gemini-3.5-flash-lite` | Model for SimSpec JSON planning |
| `LLM_MODEL_BUILD` | `gemini-3.5-flash-lite` | Fast model for ES2020 JavaScript synthesis |
| `UPSTASH_REDIS_REST_URL` | `https://vital-shad-130406.upstash.io` | Upstash Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | `gQAAAAAA...` | Upstash Redis REST authentication token |
| `JOB_TOKEN_SECRET` | *(32+ hex characters)* | HMAC-SHA256 secret for signing repair job tokens |
| `DAILY_BUDGET_USD` | `0` | Daily spend budget limit ($0 for free quota tiers) |
| `RATE_LIMIT_GENERATIONS_PER_HOUR` | `20` | Per-IP hourly generation limit |
| `NEXT_PUBLIC_SITE_URL` | `https://playtheory-gamma.vercel.app` | Base site URL for CORS and meta tags |

---

## 3. Post-Deployment Verification & Smoke Testing

To verify the live production deployment from the command line:

```bash
# 1. Run live production smoke test (Homepage, /api/health, /api/gallery, /api/stats)
npm run smoke https://playtheory-gamma.vercel.app

# 2. Verify all 30 benchmark concepts
npm run eval

# 3. Seed 20 production simulations into Upstash Redis
npm run seed
```

---

## 4. Production Verification Checklist

- [x] Homepage loads with 200 OK and no hydration errors
- [x] `/api/health` reports status `"ok"` with Upstash Redis ping latency < 50ms
- [x] `/api/stats` returns accurate operational counts and telemetry
- [x] `/status` page renders operational dashboard with 4 KPI cards
- [x] `/about` page renders complete architecture and mission overview
- [x] 5 archetype exemplar simulations play at 60 FPS in sandboxed iframes:
  - `/s/particles-exemplar` (Projectile Motion)
  - `/s/ode_phase-exemplar` (Lotka-Volterra Predator-Prey)
  - `/s/agents-exemplar` (Epidemic SIR)
  - `/s/cellular_automaton-exemplar` (Conway's Game of Life)
  - `/s/queue_flow-exemplar` (M/M/1 Server Queue)
- [x] Interactive predict-then-reveal tour steps through system states correctly
- [x] Misconceptions panel highlights common intuitive myths vs physical realities
- [x] Conceptual mastery quiz validates correct answers with educational rationales
- [x] "Under the Hood" tab displays SimSpec JSON, verification report, and source code
- [x] Dark mode toggle switches color palettes smoothly without flash
- [x] Responsive layout displays cleanly on mobile viewports (390px iPhone width)
