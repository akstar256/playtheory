import { SimSpec } from "@/lib/schemas/simSpec";
import { particlesSpec, particlesCode } from "./particles";
import { odePhaseSpec, odePhaseCode } from "./ode_phase";
import { agentsSpec, agentsCode } from "./agents";
import { cellularAutomatonSpec, cellularAutomatonCode } from "./cellular_automaton";
import { queueFlowSpec, queueFlowCode } from "./queue_flow";

export interface ArchetypeExemplar {
  spec: SimSpec;
  code: string;
}

export const ARCHETYPE_EXEMPLARS: Record<string, ArchetypeExemplar> = {
  particles: { spec: particlesSpec, code: particlesCode },
  ode_phase: { spec: odePhaseSpec, code: odePhaseCode },
  agents: { spec: agentsSpec, code: agentsCode },
  cellular_automaton: { spec: cellularAutomatonSpec, code: cellularAutomatonCode },
  queue_flow: { spec: queueFlowSpec, code: queueFlowCode },
};

export function getArchetypeExemplar(archetype: string): ArchetypeExemplar {
  return ARCHETYPE_EXEMPLARS[archetype] || ARCHETYPE_EXEMPLARS.particles;
}

export function getSecondaryExemplar(primaryArchetype: string): ArchetypeExemplar {
  const keys = Object.keys(ARCHETYPE_EXEMPLARS);
  const secondaryKey = keys.find((k) => k !== primaryArchetype) || "particles";
  return ARCHETYPE_EXEMPLARS[secondaryKey];
}
