# PlayTheory — AI Usage Disclosure & Engineering Methodology

## Overview

PlayTheory was engineered as a compound AI system and interactive computational laboratory. This document provides a transparent disclosure of how artificial intelligence was utilized across the development lifecycle, distinguishing intentional human architectural design from AI-assisted code synthesis and automated testing.

PlayTheory was **not** "vibe coded" through unconstrained prompt-and-pray generation. The project is built upon rigorous mathematical contracts, deterministic client-side AST instrumentation, and a multi-stage verification state machine where AI components operate within strict constraints.

---

## 1. System Architecture: Deterministic Engineering vs. Model Synthesis

A foundational principle of PlayTheory is that **AI models are probabilistic, but physical simulation and code execution must be deterministic and safe**.

### Human-Engineered Core Infrastructure
The following foundational components were designed, architected, and specified with explicit human engineering:
- **Formal Schema Contracts (`lib/schemas/`):** Zod schemas defining `SimSpec`, `SimParameter`, `PlotConfig`, and `VerificationReport`. Every model output is strictly validated against these runtime schemas before code execution.
- **Acorn AST Loop-Guard Engine (`lib/verify/instrument.ts`):** A custom JavaScript AST transformer built with `acorn`, `acorn-walk`, and `astring`. It statically parses simulation code and injects runtime counter guards into all `for`, `while`, and `do-while` loops to mathematically eliminate infinite loop hangs.
- **12-Point Automated Verifier (`lib/verify/`):** A 100% deterministic, non-AI client-side test suite that executes 600 headless physics steps, checks numerical boundedness (rejecting `NaN` and `Infinity`), detects dead sliders via sensitivity analysis, and inspects canvas pixel variance.
- **Security Sandbox Runtime (`lib/runtime/shell.ts`):** An isolated iframe host communicating exclusively over `postMessage` with synthetic clocks, custom PRNG seeds, and banned global protection (`window`, `document`, `fetch`, `eval`, `localStorage`).
- **HMAC-SHA256 Job Tokens (`lib/security/jobToken.ts`):** Cryptographically signed tokens that enforce self-repair quotas (maximum 3 attempts) and prevent tampering.

### Structured Model Roles in the Compound Pipeline
AI is employed in targeted, isolated stages of the pipeline:
- **Architectural Planner (Gemini 2.5 Pro / Local Gemma 4 12B):** Translates freeform natural language concepts into a structured `SimSpec` JSON document defining the mathematical archetype, differential equations, parameter boundaries, and educational objectives.
- **Constrained Code Synthesizer (Gemini 2.5 Flash / Local Gemma 4 12B):** Implements the `SimSpec` into an ES2020 JavaScript module adhering to the rigid `init(params)`, `step(dt, params)`, `draw(ctx, width, height)`, and `metrics()` contract.
- **Autonomous Self-Repair Agent:** When deterministic AST verification fails, the orchestrator compiles exact line numbers and failure diagnostics into a structured repair prompt, allowing the model to patch syntax or numerical issues automatically.

---

## 2. AI Tools Used During Development

### AI Models & Assistants
- **Google Gemini (Gemini 2.5 Pro, Gemini 3.5 Flash, Gemini 3.5 Flash Lite):** Powers the cloud-based mathematical planning, code synthesis, guided tour generation, and multi-model failover chain.
- **Google Gemma 4 12B QAT (via LM Studio):** Powers the local, private, on-device inference option, running locally on Apple Silicon without network access.
- **Claude 3.5 Sonnet (Anthropic) / Google Antigravity:** Utilized as an interactive development accelerator for:
  - Drafting comprehensive Vitest unit test suites (`tests/unit/`).
  - Developing the 30-concept automated benchmark evaluation harness (`scripts/eval.ts`).
  - Crafting automated production health and smoke testing scripts (`scripts/smoke.ts`).
  - Stress-testing edge cases (extreme parameter inputs, rate limit failovers, malformed AST inputs, and on-device token limits).

---

## 3. Integration of Google Chrome Modern Web Guidance

To avoid generic, cookie-cutter "AI-generated UI" anti-patterns (such as non-semantic divs, missing focus indicators, heavy JavaScript animation overlays, and unoptimized page navigation), the frontend was audited and aligned with **[Google Chrome Modern Web Guidance](https://github.com/GoogleChrome/modern-web-guidance)** (`modern-web-guidance@latest`):

1. **Speculation Rules API (`improve-next-page-load-performance`):**
   - Implemented `<script type="speculationrules">` in `app/layout.tsx` for moderate eagerness prefetching and prerendering on link hover, delivering instant 0ms page transitions.
2. **Native HTML5 Dialog Element (`ui-components/dialog` & `ui-behaviors/animate-to-from-top-layer`):**
   - Built `components/ShareDialog.tsx` with native `<dialog>`, utilizing `@starting-style` entry transitions, `transition-behavior: allow-discrete`, backdrop blur, and scroll containment (`overscroll-behavior: contain`) without relying on bloated modal libraries.
3. **CSS Container Queries (`css/size-aware-styling`):**
   - Applied `container-type: inline-size` (`cq-container`) to simulation cards and parameter controls, enabling components to adapt their layouts based on container dimensions rather than rigid viewport media queries.
4. **Accessible WAI-ARIA Tabs (`ui-components/tabs`):**
   - Refactored the simulation control modes into standard `role="tablist"`, `role="tab"`, and `role="tabpanel"` elements with keyboard focus management and `aria-selected` state synchronization.
5. **Native Accordion Disclosures (`ui-components/accordion`):**
   - Transformed telemetry status and architecture documentation into native `<details className="modern-accordion">` and `<summary>` components with exclusive grouping (`name="..."`) and smooth height transitions (`interpolate-size: allow-keywords`).
6. **Natural Micro-Interactions (`user-experience/natural-interactions`):**
   - Applied `:focus-visible` styling ensuring a minimum 3:1 WCAG contrast ratio and tactile `:active` spring scaling (`scale: 0.98`) for physical button feedback.

---

## 4. Evaluation & Verification Rigor

The application's reliability is backed by deterministic automated testing and benchmarking:
- **Unit & AST Tests:** 9 test suites covering 35 unit, schema, and AST loop-guard tests (`npm run test`).
- **30-Concept Benchmark Evaluation:** Tested across 30 scientific and computational concepts spanning physics, mathematics, biology, systems, economics, and computer science (`docs/EVAL.md`), achieving a **100.0%** pass rate.
- **Production Smoke Tests:** Live automated verification testing the deployed production app, health endpoints, and Upstash Redis connectivity (`npm run smoke https://playtheory-gamma.vercel.app`).
- **Zero Mock Telemetry:** The live telemetry dashboard (`/status`) measures actual serverless roundtrip latency via `performance.now()` against live Upstash Redis clusters.

---

## 5. Summary

AI in PlayTheory is treated as a specialized computational engine operating inside a structured, human-engineered harness. The system couples the generative capability of modern LLMs with strict static analysis, AST loop protection, sandboxed browser execution, and native web platform standards.
