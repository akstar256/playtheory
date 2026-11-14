import { describe, it, expect } from "vitest";
import { ARCHETYPE_EXEMPLARS } from "@/lib/archetypes";
import { SimKit } from "@/lib/runtime/simkit";

describe("Archetype Exemplar Modules Execution", () => {
  for (const [key, exemplar] of Object.entries(ARCHETYPE_EXEMPLARS)) {
    it(`should successfully initialize, step, and produce metrics for '${key}'`, () => {
      // Evaluate module in safe sandbox scope with SimKit
      const runner = new Function("SimKit", `
        ${exemplar.code}
        return sim;
      `);

      const sim = runner(SimKit);
      expect(sim).toBeDefined();
      expect(typeof sim.init).toBe("function");
      expect(typeof sim.step).toBe("function");
      expect(typeof sim.metrics).toBe("function");
      expect(typeof sim.draw).toBe("function");

      // PRNG
      let seed = 42;
      const rng = () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      };

      // Defaults
      const params: Record<string, number> = {};
      for (const p of exemplar.spec.parameters) {
        params[p.id] = p.default;
      }

      // 1. init
      let state = sim.init(params, rng);
      expect(state).toBeDefined();

      // 2. step 60 times at dt = 1/60
      const dt = 1 / 60;
      for (let i = 0; i < 60; i++) {
        state = sim.step(state, params, dt, rng);
      }
      expect(state).toBeDefined();

      // 3. metrics
      const metrics = sim.metrics(state, params);
      expect(metrics).toBeDefined();

      // Verify every metricKey required by spec.visual.plots is present and finite
      for (const plot of exemplar.spec.visual.plots) {
        for (const series of plot.series) {
          const val = metrics[series.metricKey];
          expect(
            typeof val === "number" && !isNaN(val) && isFinite(val),
            `Archetype '${key}' missing finite metric '${series.metricKey}'`
          ).toBe(true);
        }
      }
    });
  }
});
