# PlayTheory — System Architecture

## 1. Overview
PlayTheory is a **compound AI system** that transforms natural-language concept prompts into verified, interactive, sandboxed JavaScript simulations with live plots, guided predict-then-reveal tours, and misconception quizzes.

Unlike chat-based LLM wrappers, PlayTheory implements a strict generative compile-and-verify loop:
1. **Simulation Planner (`gemini-2.5-pro`)**: Produces a structured mathematical and visual specification (`SimSpec`).
2. **Code Builder (`gemini-2.5-flash`)**: Streams constrained simulation code adhering to the `SimKit` runtime interface.
3. **Automated Verifier Engine**: Validates AST safety, numerical stability, parameter sensitivity, and rendering sanity inside an isolated browser environment.
4. **Self-Repair Loop (`gemini-2.5-flash`)**: Feeds structured verifier errors back to the model for iterative correction (capped at 3 signed attempts).
5. **Persistence & Caching**: Upstash Redis REST store caches verified simulations, rate-limits abuse, and serves the public gallery.

---

## 2. Pipeline Flow Diagram

```mermaid
flowchart TD
  User([Learner Prompt]) --> APIPlan[POST /api/plan]
  APIPlan --> ModCheck[Moderation & Concept Normalization]
  ModCheck --> CacheCheck{Prompt Cache Hit?}
  
  CacheCheck -- Yes --> CachedSim[Instant Simulation Page]
  CacheCheck -- No --> PlannerLLM[Planner LLM: gemini-2.5-pro]
  
  PlannerLLM --> SimSpec[SimSpec JSON Schema]
  
  SimSpec --> APIBuild[POST /api/build SSE Stream]
  SimSpec --> APIGuide[POST /api/guide in Parallel]
  
  APIBuild --> BuilderLLM[Builder LLM: gemini-2.5-flash + Few-Shot Exemplars]
  BuilderLLM --> SimCode[Constrained Sim Module JS]
  
  SimCode --> Verifier[Client-Side Verification Engine]
  
  subgraph Verifier Engine [12-Point Verifier Harness]
    V1[1. Static Size & Acorn AST Parse]
    V2[2. Banned Identifiers window, fetch, eval]
    V3[3. AST Loop-Guard Instrumentation]
    V4[4. Contract Check: init, step, metrics, draw]
    V5[5. Headless Model Run: 600 Steps at 60Hz]
    V6[6. Finite Numbers & Non-NaN Assertion]
    V7[7. Plot metricKey Alignment]
    V8[8. PRNG Determinism Check]
    V9[9. Dead Slider Detection: Parameter Sensitivity]
    V10[10. Magnitude Bounds: < 1e9 at Extreme Sliders]
    V11[11. Canvas Operations & Non-Blank Entropy]
    V12[12. Visual Motion: Frame t=5 differs from t=0]
  end
  
  Verifier --> Verifier Engine
  
  Verifier Engine -- Pass --> APISims[POST /api/sims Persist & Slugify]
  Verifier Engine -- Fail (Attempts < 3) --> APIRepair[POST /api/repair LLM + HMAC Token]
  APIRepair --> SimCode
  Verifier Engine -- Fail (Attempts exhausted) --> Fallback[Graceful Fallback to Nearest Archetype]
  
  APISims --> SimPage[Interactive Simulation Page /s/:slug]
  APIGuide --> TourQuiz[Predict-then-Reveal Tour & Quiz]
  TourQuiz --> SimPage
```

---

## 3. Data Contracts & Interfaces

### 3.1 `SimSpec` (Zod-validated)
- `schemaVersion`: 1
- `safety`: `{ allowed: boolean; reason?: string }`
- `title`, `concept`, `level`: (`beginner` | `intermediate` | `advanced`)
- `archetype`: (`particles` | `ode_phase` | `agents` | `cellular_automaton` | `queue_flow`)
- `coreIdea`: max 2 sentences capturing the physical or computational invariant
- `learningObjectives`: 3-4 observable learning outcomes
- `stateVariables`: array of descriptors (`id, name, unit, description`)
- `parameters`: 2-6 sliders (`id, label, min, max, step, default, unit, description, effectHint`)
- `dynamics`: physical equations / plain-text discrete rules
- `visual`: canvas description, color encodings, and 1-3 plot series
- `presets`: 2-5 parameter configurations illustrating distinct system regimes
- `misconceptions`: 2-3 common misconceptions vs physics reality
- `quiz`: multiple-choice questions with answerIndex and explanations

### 3.2 Simulation Module Interface
Single JavaScript object conforming to:
```javascript
const sim = {
  // 1. Initialize state with parameters and deterministic PRNG
  init(params, rng) {
    return { /* state */ };
  },

  // 2. Advance physics by dt seconds; mutate state in place
  step(state, params, dt, rng) {
    return state;
  },

  // 3. Return key-value numerical metrics for live plotting
  metrics(state, params) {
    return { metricKey: 0.0 };
  },

  // 4. Render current frame to 960x600 canvas using SimKit
  draw(ctx, state, params, view) {
    // view: { width: 960, height: 600, t: number }
  }
};
```

---

## 4. Five Simulation Archetypes

1. **`particles` (Projectile Motion with Air Drag):**
   - High-speed kinematic particles, drag equation ($F_d = \frac{1}{2}\rho v^2 C_d A$), crosswind vectors, apex detection, and multi-particle trail buffers.
2. **`ode_phase` (Lotka-Volterra Predator-Prey):**
   - Coupled nonlinear ordinary differential equations, Runge-Kutta numerical integration, periodic limit cycles, and dual-coordinate phase portraits.
3. **`agents` (Epidemic SIR Dynamics):**
   - Spatial multi-agent modeling with contagious contact transmission, recovery timelines, and real-time Susceptible-Infected-Recovered area charts.
4. **`cellular_automaton` (Conway's Game of Life):**
   - 2D toroidal discrete grid, 8-neighbor Moore rules, gliders, blinkers, and live population census plotting.
5. **`queue_flow` (M/M/1 Server Queue Dynamics):**
   - Poisson arrivals, exponential service durations, FIFO buffer backpressure, and asymptotic delay explosions as $\rho \to 1$.

---

## 5. Security & Isolation Architecture

- **Sandboxed `<iframe>` Execution:**
  - Simulations run inside an `<iframe sandbox="allow-scripts">` without `allow-same-origin`.
  - Strict Content Security Policy (CSP):
    `default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:;`
- **Banned Globals:**
  - Static AST scanning rejects: `window`, `document`, `fetch`, `XMLHttpRequest`, `WebSocket`, `eval`, `Function`, `localStorage`, `sessionStorage`, `setTimeout`, `setInterval`, `Math.random` (must use host-provided `rng`).
- **AST Loop-Guard Instrumentation:**
  - Acorn parses the AST and injects iteration counters:
    ```javascript
    {
      let __pt_loop_ctr_1 = 0;
      while (...) {
        if (++__pt_loop_ctr_1 > 1000000) throw new Error("Loop budget exceeded");
        // loop body
      }
    }
    ```
- **HMAC-SHA256 Job Tokens:**
  - Every repair request requires a signed HMAC token encoding `slug`, `attempt`, `codeHash`, and timestamp.
  - Capped strictly at max 3 repair attempts to prevent quota exhaustion and infinite repair loops.
- **Dual-Mode Persistence Store:**
  - Production uses Upstash Redis REST API (`@upstash/redis`).
  - Gracefully falls back to an in-memory store if Redis is unavailable or unconfigured, ensuring zero downtime in isolated test environments.
