import { SimSpec } from "@/lib/schemas/simSpec";
import { GuidedTour, GuidedTourSchema, TourStep } from "@/lib/schemas/guide";
import { getLLMAdapter } from "@/lib/llm";

export function generateStaticTourFromSpec(spec: SimSpec): GuidedTour {
  const steps: TourStep[] = [];

  // Default baseline step
  const baselineParams: Record<string, number> = {};
  for (const p of spec.parameters) {
    baselineParams[p.id] = p.default;
  }

  steps.push({
    id: "step-baseline",
    title: "1. Baseline Equilibrium",
    text: `Welcome to ${spec.title}. We begin with standard default parameters to establish the system's baseline behavior.`,
    setParams: baselineParams,
    prediction: {
      question: `What primary dynamic will emerge under baseline settings?`,
      options: [
        "The system maintains balanced, continuous activity",
        "The system immediately freezes with zero movement",
        "The state values explode toward infinity",
      ],
      answerIndex: 0,
      revealText: `As observed, standard parameters allow the simulation to run within its calibrated physical operating envelope.`,
    },
  });

  // Steps built from spec presets
  spec.presets.forEach((preset, idx) => {
    const stepNum = idx + 2;
    steps.push({
      id: `step-preset-${idx}`,
      title: `${stepNum}. Exploring "${preset.name}"`,
      text: `${preset.description} Observe: ${preset.observe}`,
      setParams: preset.params,
      prediction: {
        question: `When applying "${preset.name}", what do you predict will happen?`,
        options: [
          preset.observe.slice(0, 100),
          "All activity abruptly stops",
          "The output values reverse direction entirely",
        ],
        answerIndex: 0,
        revealText: `Correct observation: ${preset.observe}`,
      },
    });
  });

  // Limit to at most 5 steps
  return { steps: steps.slice(0, 5) };
}

export async function generateGuidedTour(spec: SimSpec): Promise<GuidedTour> {
  const llm = getLLMAdapter();

  const prompt = `You are an expert interactive STEM educator.
Design an engaging 4-step guided walkthrough for the following simulation specification:

=== SIMULATION SPECIFICATION ===
Title: ${spec.title}
Concept: ${spec.concept}
Archetype: ${spec.archetype}
Core Idea: ${spec.coreIdea}
Dynamics: ${spec.dynamics}
Parameters: ${JSON.stringify(spec.parameters.map((p) => ({ id: p.id, label: p.label, default: p.default, min: p.min, max: p.max, effect: p.effectHint })))}
Presets: ${JSON.stringify(spec.presets)}
=== END SPECIFICATION ===

Create 4 guided steps. For each step:
- title: concise title (e.g. "1. The Equilibrium Baseline")
- text: 1-2 sentence explanation connecting the parameters to physical intuition
- setParams: valid map of parameter id to numeric values
- prediction: an interactive "predict-then-reveal" question:
  - question: ask the learner what will happen BEFORE the simulation runs
  - options: 3 short plausible answer choices
  - answerIndex: 0-based index of the correct prediction
  - revealText: 1-2 sentence reveal explaining the outcome once the sliders change

Output ONLY valid JSON matching:
{
  "steps": [ ... ]
}`;

  try {
    const result = await llm.generateJSON({
      schema: GuidedTourSchema,
      prompt,
      temperature: 0.2,
      timeoutMs: 25000,
    });
    return result.data;
  } catch {
    // Graceful fallback to static tour constructed from presets
    return generateStaticTourFromSpec(spec);
  }
}
