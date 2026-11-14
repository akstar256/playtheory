import { z } from "zod";

export const ARCHETYPES = [
  "particles",
  "agents",
  "ode_phase",
  "graph_network",
  "cellular_automaton",
  "queue_flow",
  "geometry_optics",
  "monte_carlo",
  "wave",
  "landscape_optimization",
] as const;

export type Archetype = (typeof ARCHETYPES)[number];

export const ParameterSchema = z.preprocess(
  (raw: any) => {
    if (typeof raw !== "object" || raw === null) return raw;
    const min = typeof raw.min === "number" ? raw.min : (parseFloat(raw.min) || 0);
    const max = typeof raw.max === "number" ? raw.max : (parseFloat(raw.max) || 10);
    const step = typeof raw.step === "number" ? raw.step : (parseFloat(raw.step) || 0.1);
    const defVal = typeof raw.default === "number" ? raw.default : (min + max) / 2;
    const desc = raw.description || raw.label || raw.id || "Parameter";
    const hint = raw.effectHint || raw.description || "Alters simulation rate and equilibrium.";
    return {
      id: raw.id || "param",
      label: raw.label || raw.id || "Param",
      min,
      max,
      step,
      default: defVal,
      unit: raw.unit || "",
      description: desc,
      effectHint: hint,
    };
  },
  z.object({
    id: z.string().min(1).max(32),
    label: z.string().min(1).max(40),
    min: z.number(),
    max: z.number(),
    step: z.number().positive(),
    default: z.number(),
    unit: z.string().max(16).optional(),
    description: z.string().min(1).max(200),
    effectHint: z.string().min(1).max(200),
  })
).refine((p) => p.min < p.max, {
  message: "Parameter min must be strictly less than max",
}).refine((p) => p.default >= p.min && p.default <= p.max, {
  message: "Parameter default must fall between min and max",
});

export type SimParameter = z.infer<typeof ParameterSchema>;

export const StateVariableSchema = z.preprocess(
  (raw: any) => {
    if (typeof raw !== "object" || raw === null) return raw;
    return {
      id: raw.id || "val",
      name: raw.name || raw.id || "Value",
      unit: raw.unit || "",
      description: raw.description || raw.name || "State metric",
    };
  },
  z.object({
    id: z.string().min(1).max(32),
    name: z.string().min(1).max(40),
    unit: z.string().max(16).optional(),
    description: z.string().min(1).max(200),
  })
);

export const PlotSeriesSchema = z.preprocess(
  (raw: any) => {
    if (typeof raw !== "object" || raw === null) return raw;
    return {
      metricKey: raw.metricKey || raw.id || "metric",
      label: raw.label || raw.metricKey || "Metric",
    };
  },
  z.object({
    metricKey: z.string().min(1).max(32),
    label: z.string().min(1).max(40),
  })
);

export const PlotSchema = z.preprocess(
  (raw: any) => {
    if (typeof raw !== "object" || raw === null) return raw;
    const series = Array.isArray(raw.series) && raw.series.length > 0 ? raw.series : [{ metricKey: "metric", label: "Metric" }];
    return {
      id: raw.id || "plot_main",
      title: raw.title || "Telemetry vs Time",
      series,
    };
  },
  z.object({
    id: z.string().min(1).max(32),
    title: z.string().min(1).max(50),
    series: z.array(PlotSeriesSchema).min(1).max(4),
  })
);

export const PresetSchema = z.preprocess(
  (raw: any) => {
    if (typeof raw !== "object" || raw === null) return raw;
    return {
      name: raw.name || "Default Preset",
      description: raw.description || "Standard operating parameters",
      params: typeof raw.params === "object" && raw.params !== null ? raw.params : {},
      observe: raw.observe || raw.description || "Observe dynamic stabilization and state behavior.",
    };
  },
  z.object({
    name: z.string().min(1).max(50),
    description: z.string().min(1).max(200),
    params: z.record(z.string(), z.number()),
    observe: z.string().min(1).max(200),
  })
);

export const MisconceptionSchema = z.preprocess(
  (raw: any) => {
    if (typeof raw !== "object" || raw === null) return raw;
    return {
      wrong: raw.wrong || "Intuitive misconception about the concept",
      right: raw.right || "Scientific principle and reality",
    };
  },
  z.object({
    wrong: z.string().min(1).max(300),
    right: z.string().min(1).max(300),
  })
);

export const QuizQuestionSchema = z.preprocess(
  (raw: any) => {
    if (typeof raw !== "object" || raw === null) return raw;
    const opts = Array.isArray(raw.options) && raw.options.length >= 4 ? raw.options.slice(0, 4) : ["Option A", "Option B", "Option C", "Option D"];
    return {
      question: raw.question || "What governs this physical behavior?",
      options: opts,
      answerIndex: typeof raw.answerIndex === "number" && raw.answerIndex >= 0 && raw.answerIndex < 4 ? raw.answerIndex : 0,
      explanation: raw.explanation || "This is dictated by the fundamental dynamics of the system.",
    };
  },
  z.object({
    question: z.string().min(1).max(300),
    options: z.array(z.string().min(1).max(150)).length(4),
    answerIndex: z.number().int().min(0).max(3),
    explanation: z.string().min(1).max(400),
  })
);

export const SimSpecSchema = z.preprocess(
  (raw: any) => {
    if (typeof raw !== "object" || raw === null) return raw;

    // Coerce dynamics to string if model returned an object
    let dynamics = raw.dynamics;
    if (typeof dynamics === "object" && dynamics !== null) {
      dynamics = Object.entries(dynamics)
        .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
        .join("\n");
    } else if (typeof dynamics !== "string") {
      dynamics = "Mathematical equations and discrete update mechanics govern system transitions.";
    }

    // Coerce visual
    const visual = typeof raw.visual === "object" && raw.visual !== null ? raw.visual : {};
    if (!visual.canvasDescription) visual.canvasDescription = "2D animated coordinate canvas with live state rendering.";
    if (!Array.isArray(visual.encodings) || visual.encodings.length === 0) {
      visual.encodings = ["blue = active state", "green = target equilibrium"];
    }
    if (!Array.isArray(visual.plots) || visual.plots.length === 0) {
      visual.plots = [{ id: "main_plot", title: "System Metrics", series: [{ metricKey: "metric", label: "Metric" }] }];
    }

    // Coerce archetype
    const archetype = ARCHETYPES.includes(raw.archetype) ? raw.archetype : "ode_phase";

    // Coerce safety
    const safety = typeof raw.safety === "object" && raw.safety !== null ? raw.safety : { allowed: true };

    // Coerce presets
    let presets = Array.isArray(raw.presets) && raw.presets.length >= 2 ? raw.presets : [
      { name: "Low Regime", description: "Minimal parameter baseline", params: {}, observe: "Minimal activity" },
      { name: "High Regime", description: "Elevated parameter baseline", params: {}, observe: "Rapid response" }
    ];

    // Coerce misconceptions
    let misconceptions = Array.isArray(raw.misconceptions) && raw.misconceptions.length >= 1 ? raw.misconceptions : [
      { wrong: "The system behaves strictly linearly at all times.", right: "Feedback loops introduce nonlinear saturation and phase transitions." }
    ];

    // Coerce quiz
    let quiz = Array.isArray(raw.quiz) && raw.quiz.length >= 2 ? raw.quiz : [
      { question: "How does the system respond to increased input?", options: ["It shifts nonlinearly", "It remains static", "It drops to zero", "It oscillates infinitely"], answerIndex: 0, explanation: "Dynamic feedback governs nonlinear transitions." },
      { question: "What happens at equilibrium?", options: ["Rates balance out", "Everything freezes", "Energy is destroyed", "Particles vanish"], answerIndex: 0, explanation: "Equilibrium is reached when forward and backward rates balance." }
    ];

    return {
      ...raw,
      schemaVersion: 1,
      safety,
      level: ["beginner", "intermediate", "advanced"].includes(raw.level) ? raw.level : "intermediate",
      archetype,
      dynamics,
      visual,
      presets,
      misconceptions,
      quiz,
    };
  },
  z.object({
    schemaVersion: z.literal(1),
    safety: z.object({
      allowed: z.boolean(),
      reason: z.string().optional(),
    }),
    title: z.string().min(1).max(100),
    concept: z.string().min(1).max(150),
    level: z.enum(["beginner", "intermediate", "advanced"]),
    archetype: z.enum(ARCHETYPES),
    coreIdea: z.string().min(1).max(300), // max 2 sentences
    learningObjectives: z.array(z.string().min(1).max(200)).min(2).max(5),
    stateVariables: z.array(StateVariableSchema).min(1).max(10),
    parameters: z.array(ParameterSchema).min(2).max(6), // 2-6 only per contract
    dynamics: z.string().min(1).max(3000), // plain language rules & equations
    visual: z.object({
      canvasDescription: z.string().min(1).max(1000),
      encodings: z.array(z.string().min(1).max(100)).min(1).max(6),
      plots: z.array(PlotSchema).min(1).max(3),
    }),
    presets: z.array(PresetSchema).min(2).max(5),
    misconceptions: z.array(MisconceptionSchema).min(1).max(4),
    quiz: z.array(QuizQuestionSchema).min(2).max(5),
  })
);

export type SimSpec = z.infer<typeof SimSpecSchema>;
