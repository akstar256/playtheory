import { NextRequest, NextResponse } from "next/server";
import { RepairRequestSchema } from "@/lib/schemas/contracts";
import { verifyJobToken, signJobToken } from "@/lib/security/jobToken";
import { getLLMAdapter } from "@/lib/llm";
import { REPAIR_SYSTEM_PROMPT, buildRepairPrompt } from "@/lib/llm/prompts/repair";
import { computeCodeHash } from "@/lib/pipeline/utils";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const parseResult = RepairRequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: { code: "INVALID_REQUEST", message: parseResult.error.message, retryable: false } },
        { status: 400 }
      );
    }

    const { jobToken, spec, code, errors, attempt, simplify } = parseResult.data;

    // 1. Verify Job Token & Enforce Max 3 Attempts Cap
    const tokenPayload = verifyJobToken(jobToken);
    if (!tokenPayload) {
      return NextResponse.json(
        { error: { code: "INVALID_OR_EXPIRED_TOKEN", message: "Job token invalid or expired.", retryable: false } },
        { status: 401 }
      );
    }

    if (tokenPayload.attemptsUsed >= 3) {
      return NextResponse.json(
        {
          error: {
            code: "MAX_REPAIRS_EXCEEDED",
            message: "Self-repair attempts exhausted (maximum 3 attempts permitted).",
            retryable: false,
          },
        },
        { status: 403 }
      );
    }

    // 2. Call Repair LLM
    const llm = getLLMAdapter();
    const prompt = buildRepairPrompt(
      spec,
      code,
      {
        status: "fail",
        attempt: tokenPayload.attemptsUsed,
        codeHash: computeCodeHash(code),
        checks: errors,
        timings: { stepMsAvg: 0, drawMsAvg: 0 },
      },
      attempt,
      simplify
    );

    let repairResult;
    try {
      repairResult = await llm.stream({
        systemPrompt: REPAIR_SYSTEM_PROMPT,
        prompt,
        temperature: 0.1,
        onChunk: () => {},
      });
    } catch (err: any) {
      return NextResponse.json(
        { error: { code: "REPAIR_LLM_FAILED", message: err.message, retryable: true } },
        { status: 502 }
      );
    }

    let repairedCode = repairResult.data.trim();
    if (repairedCode.startsWith("```javascript")) {
      repairedCode = repairedCode.replace(/^```javascript\s*/, "").replace(/\s*```$/, "");
    } else if (repairedCode.startsWith("```js")) {
      repairedCode = repairedCode.replace(/^```js\s*/, "").replace(/\s*```$/, "");
    } else if (repairedCode.startsWith("```")) {
      repairedCode = repairedCode.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    const newCodeHash = computeCodeHash(repairedCode);
    const updatedAttempts = tokenPayload.attemptsUsed + 1;
    const updatedJobToken = signJobToken(tokenPayload.jobId, updatedAttempts);

    return NextResponse.json({
      success: true,
      code: repairedCode,
      codeHash: newCodeHash,
      attempt: updatedAttempts,
      jobToken: updatedJobToken,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: err.message, retryable: false } },
      { status: 500 }
    );
  }
}
