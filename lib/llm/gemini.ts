import { z } from "zod";
import { LLMAdapter, LLMResult, GenerateJSONOptions, StreamOptions, TokenUsage } from "./types";

export class GeminiAdapter implements LLMAdapter {
  private apiKey: string;
  private defaultPlanModel: string;
  private defaultBuildModel: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.LLM_API_KEY || "";
    this.defaultPlanModel = process.env.LLM_MODEL_PLAN || "gemini-2.5-pro";
    this.defaultBuildModel = process.env.LLM_MODEL_BUILD || "gemini-2.5-flash";
  }

  private calculateCost(model: string, promptTokens: number, completionTokens: number): number {
    // Nominal cost rates per million tokens
    let inputRate = 0.125; // default flash $0.125 / 1M
    let outputRate = 0.375;

    if (model.includes("pro")) {
      inputRate = 1.25;
      outputRate = 5.0;
    } else if (model.includes("lite")) {
      inputRate = 0.075;
      outputRate = 0.3;
    }

    return (promptTokens / 1_000_000) * inputRate + (completionTokens / 1_000_000) * outputRate;
  }

  private cleanJsonString(str: string): string {
    let cleaned = str.trim();
    // Strip markdown code fences if model output them
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }
    return cleaned.trim();
  }

  private async fetchWithRetry(url: string, options: RequestInit, retries = 2): Promise<Response> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(url, options);
        if (res.status === 429 && attempt < retries) {
          // Rate limit backoff with jitter
          const backoff = (attempt + 1) * 2000 + Math.random() * 1000;
          await new Promise((r) => setTimeout(r, backoff));
          continue;
        }
        return res;
      } catch (err: any) {
        if (attempt === retries) throw err;
        await new Promise((r) => setTimeout(r, 1500));
      }
    }
    throw new Error("Failed to execute LLM request after retries");
  }

  async generateJSON<T extends z.ZodTypeAny>(opts: GenerateJSONOptions<T>): Promise<LLMResult<z.infer<T>>> {
    const startTime = Date.now();
    const model = opts.model || this.defaultPlanModel;

    if (!this.apiKey) {
      throw new Error("Missing LLM_API_KEY for GeminiAdapter");
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;

    const body: any = {
      contents: [
        {
          role: "user",
          parts: [{ text: opts.prompt }],
        },
      ],
      generationConfig: {
        temperature: opts.temperature ?? 0.2,
        responseMimeType: "application/json",
      },
    };

    if (opts.systemPrompt) {
      body.systemInstruction = {
        parts: [{ text: opts.systemPrompt }],
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), opts.timeoutMs || 45000);

    let res: Response;
    try {
      res = await this.fetchWithRetry(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API error [${res.status}]: ${errText}`);
    }

    const jsonRes = await res.json();
    const rawText = jsonRes.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const cleanedText = this.cleanJsonString(rawText);

    let parsedData: unknown;
    try {
      parsedData = JSON.parse(cleanedText);
    } catch (parseErr: any) {
      throw new Error(`Failed to parse Gemini JSON output: ${parseErr.message}\nRaw: ${rawText.slice(0, 500)}`);
    }

    const validated = opts.schema.parse(parsedData);

    const usageMeta = jsonRes.usageMetadata || {};
    const promptTokens = usageMeta.promptTokenCount || 0;
    const completionTokens = usageMeta.candidatesTokenCount || 0;
    const totalTokens = usageMeta.totalTokenCount || promptTokens + completionTokens;

    const usage: TokenUsage = {
      promptTokens,
      completionTokens,
      totalTokens,
      estimatedCostUsd: this.calculateCost(model, promptTokens, completionTokens),
    };

    return {
      data: validated,
      rawText,
      usage,
      model,
      durationMs: Date.now() - startTime,
    };
  }

  async stream(opts: StreamOptions): Promise<LLMResult<string>> {
    const startTime = Date.now();
    const model = opts.model || this.defaultBuildModel;

    if (!this.apiKey) {
      throw new Error("Missing LLM_API_KEY for GeminiAdapter");
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${this.apiKey}`;

    const body: any = {
      contents: [
        {
          role: "user",
          parts: [{ text: opts.prompt }],
        },
      ],
      generationConfig: {
        temperature: opts.temperature ?? 0.2,
      },
    };

    if (opts.systemPrompt) {
      body.systemInstruction = {
        parts: [{ text: opts.systemPrompt }],
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), opts.timeoutMs || 60000);

    let res: Response;
    try {
      res = await this.fetchWithRetry(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini Stream API error [${res.status}]: ${errText}`);
    }

    const reader = res.body?.getReader();
    if (!reader) {
      throw new Error("Gemini stream body reader unavailable");
    }

    const decoder = new TextDecoder();
    let accumulatedText = "";
    let promptTokens = 0;
    let completionTokens = 0;

    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const chunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (chunk) {
              accumulatedText += chunk;
              await opts.onChunk(chunk);
            }
            if (parsed.usageMetadata) {
              promptTokens = parsed.usageMetadata.promptTokenCount || promptTokens;
              completionTokens = parsed.usageMetadata.candidatesTokenCount || completionTokens;
            }
          } catch {
            // Ignore incomplete SSE json chunks
          }
        }
      }
    }

    const totalTokens = promptTokens + completionTokens;
    const usage: TokenUsage = {
      promptTokens,
      completionTokens,
      totalTokens,
      estimatedCostUsd: this.calculateCost(model, promptTokens, completionTokens),
    };

    return {
      data: accumulatedText,
      rawText: accumulatedText,
      usage,
      model,
      durationMs: Date.now() - startTime,
    };
  }
}
