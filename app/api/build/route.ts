import { NextRequest } from "next/server";
import { BuildRequestSchema } from "@/lib/schemas";
import { getLLMAdapter } from "@/lib/llm";
import { BUILDER_SYSTEM_PROMPT, buildBuilderPrompt } from "@/lib/llm/prompts/builder";
import { signJobToken } from "@/lib/security/jobToken";
import { computeCodeHash } from "@/lib/pipeline/utils";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const parseResult = BuildRequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: { code: "INVALID_REQUEST", message: parseResult.error.message } }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { spec } = parseResult.data;
    const jobId = crypto.randomUUID();
    const jobToken = signJobToken(jobId, 0);

    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    const llm = getLLMAdapter();
    const prompt = buildBuilderPrompt(spec);

    // Asynchronously stream LLM tokens to SSE
    (async () => {
      let accumulatedCode = "";
      try {
        await llm.stream({
          systemPrompt: BUILDER_SYSTEM_PROMPT,
          prompt,
          temperature: 0.2,
          onChunk: async (chunk) => {
            accumulatedCode += chunk;
            const sseEvent = `data: ${JSON.stringify({ type: "code_chunk", chunk })}\n\n`;
            await writer.write(encoder.encode(sseEvent));
          },
        });

        // Strip markdown backticks if model generated them
        let cleanCode = accumulatedCode.trim();
        if (cleanCode.startsWith("```javascript")) {
          cleanCode = cleanCode.replace(/^```javascript\s*/, "").replace(/\s*```$/, "");
        } else if (cleanCode.startsWith("```js")) {
          cleanCode = cleanCode.replace(/^```js\s*/, "").replace(/\s*```$/, "");
        } else if (cleanCode.startsWith("```")) {
          cleanCode = cleanCode.replace(/^```\s*/, "").replace(/\s*```$/, "");
        }

        const codeHash = computeCodeHash(cleanCode);

        // Emit done event
        const doneEvent = `data: ${JSON.stringify({
          type: "done",
          code: cleanCode,
          codeHash,
          jobToken,
          jobId,
        })}\n\n`;
        await writer.write(encoder.encode(doneEvent));
      } catch (err: any) {
        const errorEvent = `data: ${JSON.stringify({
          type: "error",
          message: err.message || "Failed to generate simulation code",
        })}\n\n`;
        await writer.write(encoder.encode(errorEvent));
      } finally {
        await writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: { code: "SERVER_ERROR", message: err.message } }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
