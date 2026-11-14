import { SimSpec } from "@/lib/schemas/simSpec";
import { particlesSpec, particlesCode } from "./particles";
import { odePhaseSpec, odePhaseCode } from "./ode_phase";
import { agentsSpec, agentsCode } from "./agents";

export interface ArchetypeExemplar {
  spec: SimSpec;
  code: string;
}

export const ARCHETYPE_EXEMPLARS: Record<string, ArchetypeExemplar> = {
  particles: { spec: particlesSpec, code: particlesCode },
  ode_phase: { spec: odePhaseSpec, code: odePhaseCode },
  agents: { spec: agentsSpec, code: agentsCode },
};

/**
 * Returns the matching exemplar for a given archetype, or falls back to particles.
 */
export function getArchetypeExemplar(archetype: string): ArchetypeExemplar {
  return ARCHETYPE_EXEMPLARS[archetype] || ARCHETYPE_EXEMPLARS.particles;
}

/**
 * Returns the nearest secondary exemplar for few-shot context.
 */
export function getSecondaryExemplar(primaryArchetype: string): ArchetypeExemplar {
  const keys = Object.keys(ARCHETYPE_EXEMPLARS);
  const secondaryKey = keys.find((k) => k !== primaryArchetype) || "particles";
  return ARCHETYPE_EXEMPLARS[secondaryKey];
}
