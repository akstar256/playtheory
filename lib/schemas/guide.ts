import { z } from "zod";

export const TourStepSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(60),
  text: z.string().min(1).max(350),
  setParams: z.record(z.string(), z.number()),
  prediction: z.object({
    question: z.string().min(1).max(250),
    options: z.array(z.string().min(1).max(120)).min(2).max(4),
    answerIndex: z.number().int().min(0).max(3),
    revealText: z.string().min(1).max(350),
  }).optional(),
});

export type TourStep = z.infer<typeof TourStepSchema>;

export const GuidedTourSchema = z.object({
  steps: z.array(TourStepSchema).min(3).max(6),
});

export type GuidedTour = z.infer<typeof GuidedTourSchema>;

export const GuideRequestSchema = z.object({
  spec: z.any(), // SimSpec
});

export type GuideRequest = z.infer<typeof GuideRequestSchema>;
