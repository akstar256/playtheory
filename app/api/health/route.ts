import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  const store = getStore();

  let storeHealthy = false;
  try {
    storeHealthy = await store.isHealthy();
  } catch {
    storeHealthy = false;
  }

  const llmProvider = process.env.LLM_PROVIDER || "unconfigured";
  const llmConfigured = Boolean(process.env.LLM_API_KEY && process.env.LLM_API_KEY.trim().length > 0);
  const upstashConfigured = Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );

  const status = storeHealthy ? "ok" : "degraded";
  const durationMs = Date.now() - startTime;

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      durationMs,
      checks: {
        store: storeHealthy ? "healthy" : "fallback_active",
        upstashConfigured,
        llm: {
          configured: llmConfigured,
          provider: llmProvider,
          planModel: process.env.LLM_MODEL_PLAN || "gemini-2.5-pro",
          buildModel: process.env.LLM_MODEL_BUILD || "gemini-2.5-flash",
        },
      },
      version: "0.1.0",
    },
    {
      status: status === "ok" ? 200 : 200, // Health endpoint still 200 with degraded status
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
