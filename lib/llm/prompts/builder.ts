import { SimSpec } from "@/lib/schemas/simSpec";
import { getArchetypeExemplar } from "@/lib/archetypes";

export const BUILDER_SYSTEM_PROMPT = `You are the lead Simulation Engineer for PlayTheory.
Your task is to write a single, clean, highly robust JavaScript simulation module conforming to the SimSpec.

CRITICAL CONTRACT:
You must define exactly ONE global object named 'sim':
const sim = {
  // params: key-value map of numbers, rng: seeded () => number in [0, 1)
  init(params, rng) {
    // Return initial state object
  },

  // Advance state by dt seconds; mutate state in place or return state
  step(state, params, dt, rng) {
    // Return updated state
  },

  // Return key-value dictionary of finite numbers for all spec.visual.plots series metricKeys
  metrics(state, params) {
    // Return { [metricKey]: number }
  },

  // Render to HTML5 2D canvas (view = { width: 960, height: 600, t })
  // MUST NOT mutate state!
  draw(ctx, state, params, view) {
    // Canvas drawing commands using SimKit
  }
};

STRICT SAFETY & QUALITY RULES:
1. Output ONLY JavaScript code. Do not output markdown, HTML, or explanations.
2. BANNED IDENTIFIERS: fetch, XMLHttpRequest, WebSocket, eval, Function, import, document.write, window.parent, window.top, postMessage, localStorage, sessionStorage, indexedDB, setTimeout, setInterval, requestAnimationFrame.
3. NEVER use Math.random(). ALWAYS use the provided 'rng()' function or 'SimKit.gaussian(rng)'.
4. NEVER use Date.now() or performance.now(). Use 'view.t' or accumulate dt.
5. NUMERICAL STABILITY:
   - Always guard against division by zero (e.g. denom < 1e-9 ? 0 : num / denom).
   - Ensure all metric values and state variables are FINITE numbers (no NaN or Infinity).
   - Clamp extreme values with SimKit.clamp.
6. SENSITIVITY: Every parameter in spec.parameters MUST meaningfully change the simulation outcome.
7. SimKit HELPER GLOBALS AVAILABLE:
   - SimKit.clamp(val, min, max)
   - SimKit.lerp(a, b, t)
   - SimKit.map(val, inMin, inMax, outMin, outMax)
   - SimKit.palette (array of 9 colorblind-safe hex colors)
   - SimKit.vec2 (create, add, sub, scale, dot, mag, norm, dist)
   - SimKit.gaussian(rng, mean, stdDev)
   - SimKit.hash(state)
   - SimKit.text(ctx, str, x, y, opts)
   - SimKit.arrow(ctx, x1, y1, x2, y2, opts)
   - SimKit.grid(ctx, view, opts)
   - SimKit.axes(ctx, rect, opts)
8. Canvas dimensions: 960 x 600 logical pixels.
`;

export function buildBuilderPrompt(spec: SimSpec): string {
  const exemplar = getArchetypeExemplar(spec.archetype);

  return `Here is a verified exemplar of the '${spec.archetype}' archetype to guide your code architecture:

=== EXEMPLAR CODE START ===
${exemplar.code}
=== EXEMPLAR CODE END ===

Now, implement the simulation module for the following specification:

=== SPECIFICATION JSON ===
${JSON.stringify(spec, null, 2)}
=== END SPECIFICATION ===

Implement the full 'const sim = { init, step, metrics, draw };' module matching 'dynamics' and 'visual' from the specification.
Ensure every metric in spec.visual.plots is returned by metrics().
Output ONLY the executable JavaScript code.`;
}
