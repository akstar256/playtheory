import { describe, it, expect } from "vitest";
import { SimSpecSchema, ParameterSchema } from "@/lib/schemas/simSpec";
import { particlesSpec } from "@/lib/archetypes/particles";
import { odePhaseSpec } from "@/lib/archetypes/ode_phase";
import { agentsSpec } from "@/lib/archetypes/agents";

describe("SimSpec Schema Validation", () => {
  it("should validate the 3 hand-written archetype specs", () => {
    expect(() => SimSpecSchema.parse(particlesSpec)).not.toThrow();
    expect(() => SimSpecSchema.parse(odePhaseSpec)).not.toThrow();
    expect(() => SimSpecSchema.parse(agentsSpec)).not.toThrow();
  });

  it("should reject parameter with min >= max", () => {
    expect(() =>
      ParameterSchema.parse({
        id: "speed",
        label: "Speed",
        min: 100,
        max: 50,
        step: 1,
        default: 75,
        description: "Speed",
        effectHint: "Higher is faster",
      })
    ).toThrow();
  });

  it("should reject parameter with default outside min and max", () => {
    expect(() =>
      ParameterSchema.parse({
        id: "speed",
        label: "Speed",
        min: 10,
        max: 50,
        step: 1,
        default: 5,
        description: "Speed",
        effectHint: "Higher is faster",
      })
    ).toThrow();
  });

  it("should enforce parameter count between 2 and 6", () => {
    const invalidSpec = {
      ...particlesSpec,
      parameters: [particlesSpec.parameters[0]], // only 1 parameter
    };
    expect(() => SimSpecSchema.parse(invalidSpec)).toThrow();
  });
});
