import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { getLLMAdapter } from "@/lib/llm";
import { PlanRequestSchema, SimSpecSchema } from "@/lib/schemas";
import { computeCacheKey, normalizeConcept } from "@/lib/pipeline/utils";
import { PLANNER_SYSTEM_PROMPT, buildPlannerPrompt } from "@/lib/llm/prompts/planner";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const rawBody = await req.json();
    const parseResult = PlanRequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: { code: "INVALID_REQUEST", message: parseResult.error.message, retryable: false } },
        { status: 400 }
      );
    }

    const { concept, level } = parseResult.data;
    const store = getStore();

    // 1. Per-IP Rate Limiting
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const hourlyLimit = parseInt(process.env.RATE_LIMIT_GENERATIONS_PER_HOUR || "20", 10);
    const rateLimit = await store.checkRateLimit(`plan:${ip}`, hourlyLimit, 3600);

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: {
            code: "RATE_LIMITED",
            message: `Hourly generation limit of ${hourlyLimit} reached. Please try again shortly or explore the gallery.`,
            retryable: false,
          },
        },
        { status: 429 }
      );
    }

    // 2. Cache Lookup
    const cacheKey = computeCacheKey(concept, level, 1);
    const cachedSim = await store.getSimByCacheKey(cacheKey);

    if (cachedSim) {
      return NextResponse.json({
        type: "cached",
        slug: cachedSim.slug,
        spec: cachedSim.spec,
        code: cachedSim.code,
        report: cachedSim.report,
        cached: true,
      });
    }

    // 3. Planner LLM Call
    const llm = getLLMAdapter();
    const planPrompt = buildPlannerPrompt(normalizeConcept(concept), level);

    let planResult;
    try {
      planResult = await llm.generateJSON({
        schema: SimSpecSchema,
        systemPrompt: PLANNER_SYSTEM_PROMPT,
        prompt: planPrompt,
        temperature: 0.2,
      });
    } catch (llmErr: any) {
      return NextResponse.json(
        { error: { code: "LLM_PLAN_FAILED", message: llmErr.message, retryable: true } },
        { status: 502 }
      );
    }

    const spec = planResult.data;

    // 4. Content Safety Check
    if (!spec.safety.allowed) {
      return NextResponse.json({
        type: "refusal",
        reason: spec.safety.reason || "This concept cannot be simulated safely.",
        cached: false,
      });
    }

    return NextResponse.json({
      type: "spec",
      spec,
      cached: false,
      durationMs: Date.now() - startTime,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: err.message, retryable: false } },
      { status: 500 }
    );
  }
}
