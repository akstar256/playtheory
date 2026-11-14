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

export const ParameterSchema = z.object({
  id: z.string().min(1).max(32),
  label: z.string().min(1).max(40),
  min: z.number(),
  max: z.number(),
  step: z.number().positive(),
  default: z.number(),
  unit: z.string().max(16).optional(),
  description: z.string().min(1).max(200),
  effectHint: z.string().min(1).max(200),
}).refine((p) => p.min < p.max, {
  message: "Parameter min must be strictly less than max",
}).refine((p) => p.default >= p.min && p.default <= p.max, {
  message: "Parameter default must fall between min and max",
});

export type SimParameter = z.infer<typeof ParameterSchema>;

export const StateVariableSchema = z.object({
  id: z.string().min(1).max(32),
  name: z.string().min(1).max(40),
  unit: z.string().max(16).optional(),
  description: z.string().min(1).max(200),
});

export const PlotSeriesSchema = z.object({
  metricKey: z.string().min(1).max(32),
  label: z.string().min(1).max(40),
});

export const PlotSchema = z.object({
  id: z.string().min(1).max(32),
  title: z.string().min(1).max(50),
  series: z.array(PlotSeriesSchema).min(1).max(4),
});

export const PresetSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().min(1).max(200),
  params: z.record(z.string(), z.number()),
  observe: z.string().min(1).max(200),
});

export const MisconceptionSchema = z.object({
  wrong: z.string().min(1).max(300),
  right: z.string().min(1).max(300),
});

export const QuizQuestionSchema = z.object({
  question: z.string().min(1).max(300),
  options: z.array(z.string().min(1).max(150)).length(4),
  answerIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(1).max(400),
});

export const SimSpecSchema = z.object({
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
});

export type SimSpec = z.infer<typeof SimSpecSchema>;
