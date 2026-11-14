import { z } from "zod";

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
}

export interface LLMResult<T> {
  data: T;
  rawText: string;
  usage: TokenUsage;
  model: string;
  durationMs: number;
}

export interface GenerateJSONOptions<T extends z.ZodTypeAny> {
  schema: T;
  systemPrompt?: string;
  prompt: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  timeoutMs?: number;
}

export interface StreamOptions {
  systemPrompt?: string;
  prompt: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  timeoutMs?: number;
  onChunk: (textChunk: string) => void | Promise<void>;
}

export interface LLMAdapter {
  generateJSON<T extends z.ZodTypeAny>(opts: GenerateJSONOptions<T>): Promise<LLMResult<z.infer<T>>>;
  stream(opts: StreamOptions): Promise<LLMResult<string>>;
}
