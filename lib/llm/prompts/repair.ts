import { SimSpec } from "@/lib/schemas/simSpec";
import { formatFailuresForRepair } from "@/lib/verify";
import { VerificationReport } from "@/lib/schemas/contracts";

export const REPAIR_SYSTEM_PROMPT = `You are the lead Automated Debugging & Repair Engineer for PlayTheory.
Your task is to fix a JavaScript simulation module that failed automated verification checks.

STRICT REPAIR RULES:
1. Output ONLY the executable JavaScript code for the corrected module. No markdown, no commentary.
2. Return the full corrected module: 'const sim = { init, step, metrics, draw };'
3. Make the MINIMAL changes necessary to resolve the failing checks. DO NOT redesign the entire system.
4. If a dead slider check failed, DO NOT remove the parameter from parameters or spec! Ensure that changing the slider noticeably alters the calculation in step() and results in metrics().
5. If division by zero or NaN occurred, guard all denominators: (Math.abs(denom) < 1e-9 ? 0 : num / denom).
6. Never use Math.random() or Date.now(). Always use the provided rng() and SimKit helpers.
7. Preserve all metric keys defined in spec.visual.plots in sim.metrics().
`;

export function buildRepairPrompt(
  spec: SimSpec,
  failingCode: string,
  report: VerificationReport,
  attempt: number,
  simplify: boolean = false
): string {
  const failureSummary = formatFailuresForRepair(report, failingCode, spec);

  const instructions = simplify || attempt >= 3
    ? `ATTEMPT 3 (FINAL ATTEMPT - SIMPLIFY):
Produce the simplest, most direct version of the simulation dynamics that strictly conforms to the archetype contract and passes all checks. Avoid complex nested loops or edge cases.`
    : `ATTEMPT ${attempt} OF 3:
Fix the identified errors with minimal modifications. Ensure the code hash differs from the previous implementation.`;

  return `${instructions}

=== SPECIFICATION ===
${JSON.stringify({
  title: spec.title,
  concept: spec.concept,
  archetype: spec.archetype,
  parameters: spec.parameters,
  dynamics: spec.dynamics,
  visualPlots: spec.visual.plots,
}, null, 2)}

=== FAILING CODE ===
${failingCode}

=== VERIFIER FAILURE REPORT ===
${failureSummary}

Return the complete corrected 'const sim = { ... };' module now.`;
}
