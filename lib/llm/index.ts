import { LLMAdapter } from "./types";
import { GeminiAdapter } from "./gemini";

export * from "./types";
export * from "./gemini";

let adapterInstance: LLMAdapter | null = null;

export function getLLMAdapter(): LLMAdapter {
  if (adapterInstance) {
    return adapterInstance;
  }

  const provider = (process.env.LLM_PROVIDER || "gemini").toLowerCase();

  switch (provider) {
    case "gemini":
      adapterInstance = new GeminiAdapter();
      break;
    default:
      adapterInstance = new GeminiAdapter();
      break;
  }

  return adapterInstance;
}

export function setLLMAdapter(custom: LLMAdapter | null): void {
  adapterInstance = custom;
}
