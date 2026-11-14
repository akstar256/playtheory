import { z } from "zod";
import { SimSpecSchema } from "./simSpec";

// 7.3 VerificationReport
export const VerificationCheckSchema = z.object({
  id: z.string(),
  status: z.enum(["pass", "fail", "warn"]),
  message: z.string().optional(),
  evidence: z.unknown().optional(),
});

export const VerificationReportSchema = z.object({
  status: z.enum(["pass", "fail"]),
  attempt: z.number().int().min(0),
  codeHash: z.string(),
  checks: z.array(VerificationCheckSchema),
  timings: z.object({
    stepMsAvg: z.number(),
    drawMsAvg: z.number(),
  }),
});

export type VerificationReport = z.infer<typeof VerificationReportSchema>;
export type VerificationCheck = z.infer<typeof VerificationCheckSchema>;

// API: POST /api/plan
export const PlanRequestSchema = z.object({
  concept: z.string().trim().min(1).max(120),
  level: z.enum(["beginner", "intermediate", "advanced"]).default("intermediate"),
});

export type PlanRequest = z.infer<typeof PlanRequestSchema>;

export const PlanResponseSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("spec"),
    spec: SimSpecSchema,
    cached: z.literal(false),
  }),
  z.object({
    type: z.literal("cached"),
    slug: z.string(),
    spec: SimSpecSchema,
    code: z.string(),
    report: VerificationReportSchema,
    cached: z.literal(true),
  }),
  z.object({
    type: z.literal("refusal"),
    reason: z.string(),
    cached: z.literal(false),
  }),
]);

export type PlanResponse = z.infer<typeof PlanResponseSchema>;

// API: POST /api/build
export const BuildRequestSchema = z.object({
  spec: SimSpecSchema,
});

export type BuildRequest = z.infer<typeof BuildRequestSchema>;

// API: POST /api/repair
export const RepairRequestSchema = z.object({
  jobToken: z.string(),
  spec: SimSpecSchema,
  code: z.string(),
  errors: z.array(VerificationCheckSchema),
  attempt: z.number().int().min(1).max(3),
  simplify: z.boolean().optional(),
});

export type RepairRequest = z.infer<typeof RepairRequestSchema>;

// API: POST /api/sims
export const SaveSimRequestSchema = z.object({
  spec: SimSpecSchema,
  code: z.string(),
  report: VerificationReportSchema,
  repairHistory: z.array(z.unknown()).default([]),
  jobToken: z.string().optional(),
});

export type SaveSimRequest = z.infer<typeof SaveSimRequestSchema>;

// Standard Error Response
export const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    retryable: z.boolean().default(false),
  }),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
