import { describe, it, expect } from "vitest";
import { generateStaticTourFromSpec } from "@/lib/pipeline/guide";
import { particlesSpec } from "@/lib/archetypes/particles";
import { odePhaseSpec } from "@/lib/archetypes/ode_phase";
import { agentsSpec } from "@/lib/archetypes/agents";
import { GuidedTourSchema } from "@/lib/schemas/guide";

describe("Guided Tour Generator", () => {
  it("should generate a valid static tour conforming to GuidedTourSchema for all exemplars", () => {
    const specs = [particlesSpec, odePhaseSpec, agentsSpec];

    for (const spec of specs) {
      const tour = generateStaticTourFromSpec(spec);
      expect(() => GuidedTourSchema.parse(tour)).not.toThrow();
      expect(tour.steps.length).toBeGreaterThanOrEqual(3);

      for (const step of tour.steps) {
        expect(step.title).toBeDefined();
        expect(step.setParams).toBeDefined();
        expect(step.prediction).toBeDefined();
        expect(step.prediction?.options.length).toBeGreaterThanOrEqual(2);
        expect(step.prediction?.answerIndex).toBeGreaterThanOrEqual(0);
        expect(step.prediction?.answerIndex).toBeLessThan(step.prediction!.options.length);
      }
    }
  });
});
