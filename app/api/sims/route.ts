import { NextRequest, NextResponse } from "next/server";
import { getStore, StoredSimulation } from "@/lib/store";
import { SaveSimRequestSchema } from "@/lib/schemas";
import { generateSlug, computeCacheKey } from "@/lib/pipeline/utils";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const parseResult = SaveSimRequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: { code: "INVALID_REQUEST", message: parseResult.error.message } },
        { status: 400 }
      );
    }

    const { spec, code, report, repairHistory } = parseResult.data;
    const store = getStore();

    const slug = generateSlug(spec.title);
    const cacheKey = computeCacheKey(spec.concept, spec.level, spec.schemaVersion);

    const record: StoredSimulation = {
      slug,
      spec,
      code,
      report,
      repairHistory: repairHistory || [],
      createdAt: Date.now(),
      source: "user",
      cacheKey,
      hits: 1,
    };

    await store.saveSim(record);

    return NextResponse.json({
      success: true,
      slug,
      url: `/s/${slug}`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: "PERSIST_FAILED", message: err.message } },
      { status: 500 }
    );
  }
}
