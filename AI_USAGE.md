# PlayTheory — AI Usage & Tooling Disclosure

> Submitted for **IceHacks 2026** in full compliance with hackathon rules regarding transparent disclosure of artificial intelligence assistance, models, and developer tooling.

---

## 1. Development & Engineering Tooling

- **Lead Engineering Agent:** **Antigravity (Google DeepMind)**
  - Provided autonomous architectural implementation, system design, test suite authoring, and documentation based on the master build brief.
  - Authored all unit tests, end-to-end integration workflows, AST instrumentation transforms, and verification check modules.
- **Developer Oversight:**
  - Continuous human-in-the-loop review, credential provisioning, architectural direction, commit approvals, and deployment validation.

---

## 2. In-App Runtime AI Models & Multi-Stage Architecture

PlayTheory does not treat LLMs as a single black box. Instead, it employs a **compound AI architecture** with distinct specialized models assigned to each stage:

### 2.1 Simulation Planner
- **Model:** `gemini-2.5-pro` (via Google AI Studio)
- **Role:** High-reasoning mathematical decomposition and visual design.
- **Output:** Zod-validated `SimSpec` JSON schema defining equations, state variables, parameter ranges, visual encodings, and active learning tour steps.
- **Techniques:** JSON schema mode enforcement, parameter sensitivity boundaries, safety filtering against dangerous chemical/weapon synthesis.

### 2.2 Code Builder
- **Model:** `gemini-2.5-flash` (via Google AI Studio)
- **Role:** Fast, low-latency ES2020 JavaScript simulation authoring.
- **Output:** SSE token stream yielding an isolated `sim` module implementing `init`, `step`, `metrics`, and `draw`.
- **Techniques:** Few-shot prompting conditioned on the 5 hand-crafted archetype exemplars, strict mathematical helper constraints (`SimKit`).

### 2.3 Autonomous Self-Repair Engine
- **Model:** `gemini-2.5-flash` (via Google AI Studio)
- **Role:** Error correction and targeted bug remediation.
- **Input:** Failing check ID, error stack trace, failing simulation code, and original `SimSpec`.
- **Techniques:** Surgical code patching with AST verification re-runs, secured by signed HMAC-SHA256 job tokens capped at 3 attempts.

---

## 3. Human & Automated Safety Guardrails

To prevent hallucinations, malicious code execution, and infinite loops, PlayTheory wraps all AI outputs in multiple non-AI safety layers:

1. **AST Loop-Guard Instrumentation (Acorn & Astring):**
   - Automatically injects monotonic iteration counters into all `for`, `while`, and `do-while` loops in the generated AST, preventing browser freezes regardless of model output.
2. **Static AST Analysis for Banned Globals:**
   - Detects and rejects any usage of `window`, `document`, `fetch`, `XMLHttpRequest`, `WebSocket`, `eval`, `localStorage`, or external network APIs.
3. **Double-Sandboxed Iframe Execution:**
   - Client executes code inside `<iframe sandbox="allow-scripts">` without `allow-same-origin`, reinforced with a zero-network Content Security Policy (`default-src 'none'`).
4. **12-Point Automated Verifier:**
   - Runs 600 steps in a headless harness, checks for finite numbers, sweeps parameter sliders to detect fake/dead controls, and asserts visual canvas entropy before the user sees the simulation.

---

## 4. Sponsor & Infrastructure Tooling

- **Google Gemini API:** AI model provider for planning, streaming code synthesis, and repair.
- **Upstash Redis Serverless REST:** KV caching, rate limiting, and simulation persistence with sub-50ms latency.
- **Vercel:** Next.js App Router edge hosting and continuous automated deployment from GitHub.
