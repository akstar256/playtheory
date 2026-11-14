import { SimSpec, SimSpecSchema } from "@/lib/schemas/simSpec";
import { PLANNER_SYSTEM_PROMPT, buildPlannerPrompt } from "./prompts/planner";
import { BUILDER_SYSTEM_PROMPT, buildBuilderPrompt } from "./prompts/builder";
import { computeCodeHash } from "@/lib/pipeline/utils";

export interface LocalLMConfig {
  endpoint: string; // e.g. "http://localhost:1234" or "http://192.168.0.8:1234"
  model: string;    // e.g. "google/gemma-4-12b-qat"
  signal?: AbortSignal;
}

export const DEFAULT_LOCAL_LM_CONFIG: LocalLMConfig = {
  endpoint: "http://localhost:1234",
  model: "google/gemma-4-12b-qat",
};

/**
 * Pings the local LM Studio server to verify connectivity and list active models.
 */
export async function checkLocalLMStudio(endpoint: string = DEFAULT_LOCAL_LM_CONFIG.endpoint): Promise<{
  online: boolean;
  models: string[];
  activeModel?: string;
  corsEnabled: boolean;
  error?: string;
}> {
  const cleanBase = endpoint.replace(/\/+$/, "");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const res = await fetch(`${cleanBase}/v1/models`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    });

    if (!res.ok) {
      return {
        online: false,
        models: [],
        corsEnabled: true,
        error: `Server responded with HTTP ${res.status}`,
      };
    }

    const data = await res.json();
    const modelList = Array.isArray(data.data) ? data.data.map((m: any) => m.id) : [];
    const active = modelList.find((m: string) => m.toLowerCase().includes("gemma")) || modelList[0] || DEFAULT_LOCAL_LM_CONFIG.model;

    return {
      online: true,
      models: modelList,
      activeModel: active,
      corsEnabled: true,
    };
  } catch (err: any) {
    const isCorsError = err.name === "TypeError" && err.message.includes("Failed to fetch");
    return {
      online: false,
      models: [],
      corsEnabled: !isCorsError,
      error: isCorsError
        ? "CORS blocked. Please toggle 'Enable CORS' ON in LM Studio Server Settings."
        : (err.message || "Could not connect to LM Studio"),
    };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Generates SimSpec JSON using local Gemma via LM Studio.
 */
export async function planWithLocalLM(
  concept: string,
  level: "beginner" | "intermediate" | "advanced",
  config: Partial<LocalLMConfig> = {}
): Promise<SimSpec> {
  const endpoint = (config.endpoint || DEFAULT_LOCAL_LM_CONFIG.endpoint).replace(/\/+$/, "");
  const model = config.model || DEFAULT_LOCAL_LM_CONFIG.model;
  const prompt = buildPlannerPrompt(concept, level);

  const res = await fetch(`${endpoint}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: config.signal,
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: PLANNER_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`LM Studio Plan Error [${res.status}]: ${errText}`);
  }

  const json = await res.json();
  const rawText = json.choices?.[0]?.message?.content || "";

  let cleaned = rawText.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  const parsed = JSON.parse(cleaned);
  return SimSpecSchema.parse(parsed);
}

/**
 * Streams ES2020 JavaScript simulation code using local Gemma via LM Studio.
 */
export async function buildWithLocalLM(
  spec: SimSpec,
  onChunk: (chunk: string) => void,
  config: Partial<LocalLMConfig> = {}
): Promise<{ code: string; codeHash: string }> {
  const endpoint = (config.endpoint || DEFAULT_LOCAL_LM_CONFIG.endpoint).replace(/\/+$/, "");
  const model = config.model || DEFAULT_LOCAL_LM_CONFIG.model;
  const prompt = buildBuilderPrompt(spec);

  const res = await fetch(`${endpoint}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: config.signal,
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: BUILDER_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      stream: true,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`LM Studio Build Stream Error [${res.status}]: ${errText}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("LM Studio stream reader unavailable");

  const decoder = new TextDecoder();
  let accumulated = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("data: ")) {
        const payload = trimmed.slice(6).trim();
        if (payload === "[DONE]") continue;

        try {
          const parsed = JSON.parse(payload);
          const chunk = parsed.choices?.[0]?.delta?.content || "";
          if (chunk) {
            accumulated += chunk;
            onChunk(chunk);
          }
        } catch {
          // ignore partial JSON
        }
      }
    }
  }

  let cleanCode = accumulated.trim();
  if (cleanCode.startsWith("```javascript")) {
    cleanCode = cleanCode.replace(/^```javascript\s*/, "").replace(/\s*```$/, "");
  } else if (cleanCode.startsWith("```js")) {
    cleanCode = cleanCode.replace(/^```js\s*/, "").replace(/\s*```$/, "");
  } else if (cleanCode.startsWith("```")) {
    cleanCode = cleanCode.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }

  const codeHash = computeCodeHash(cleanCode);
  return { code: cleanCode, codeHash };
}

/**
 * Self-repairs code using local Gemma when verifier catches errors.
 */
export async function repairWithLocalLM(
  spec: SimSpec,
  failingCode: string,
  errors: any[],
  config: Partial<LocalLMConfig> = {}
): Promise<string> {
  const endpoint = (config.endpoint || DEFAULT_LOCAL_LM_CONFIG.endpoint).replace(/\/+$/, "");
  const model = config.model || DEFAULT_LOCAL_LM_CONFIG.model;

  const errorSummary = errors.map((e) => `- [${e.id}]: ${e.message}`).join("\n");
  const repairPrompt = `The following simulation code failed verification:\n\n${errorSummary}\n\nFailing Code:\n\`\`\`javascript\n${failingCode}\n\`\`\`\n\nPlease output the repaired ES2020 JavaScript code inside \`\`\`javascript code block only.`;

  const res = await fetch(`${endpoint}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: config.signal,
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: BUILDER_SYSTEM_PROMPT },
        { role: "user", content: repairPrompt },
      ],
      temperature: 0.1,
    }),
  });

  if (!res.ok) {
    throw new Error(`LM Studio Repair Error: HTTP ${res.status}`);
  }

  const json = await res.json();
  const raw = json.choices?.[0]?.message?.content || "";

  let clean = raw.trim();
  if (clean.startsWith("```javascript")) {
    clean = clean.replace(/^```javascript\s*/, "").replace(/\s*```$/, "");
  } else if (clean.startsWith("```js")) {
    clean = clean.replace(/^```js\s*/, "").replace(/\s*```$/, "");
  } else if (clean.startsWith("```")) {
    clean = clean.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }

  return clean;
}
