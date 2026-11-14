# PlayTheory — Deployment Guide

## Overview
PlayTheory is built with Next.js (App Router) and can be deployed to Vercel, DeployXA, or any Node.js container host.

---

## 1. Deploying to Vercel (Recommended)

1. **Import Repository**:
   - Go to [Vercel Dashboard](https://vercel.com/new).
   - Select your GitHub repository: `playtheory`.

2. **Configure Environment Variables**:
   Add the following environment variables in the Vercel project settings:
   - `LLM_PROVIDER`: `gemini`
   - `LLM_API_KEY`: *(Your Google AI Studio API key)*
   - `LLM_MODEL_PLAN`: `gemini-2.5-pro`
   - `LLM_MODEL_BUILD`: `gemini-2.5-flash`
   - `UPSTASH_REDIS_REST_URL`: *(Your Upstash REST URL)*
   - `UPSTASH_REDIS_REST_TOKEN`: *(Your Upstash REST Token)*
   - `JOB_TOKEN_SECRET`: *(A random 32+ character HMAC secret)*
   - `DAILY_BUDGET_USD`: `0`
   - `RATE_LIMIT_GENERATIONS_PER_HOUR`: `20`
   - `NEXT_PUBLIC_SITE_URL`: `https://<your-project>.vercel.app`

3. **Deploy**:
   - Click **Deploy**. Vercel will automatically run `npm run build` and launch the app.

---

## 2. Post-Deployment Smoke Test

Verify production deployment health by running the smoke test suite against your live URL:

```bash
npm run smoke https://<your-project>.vercel.app
```

The smoke test validates:
- Homepage HTTP 200 response
- `/api/health` status, storage connectivity, and LLM configuration
