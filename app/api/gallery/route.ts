import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { ARCHETYPE_EXEMPLARS } from "@/lib/archetypes";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const store = getStore();
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20", 10);
    let items = await store.listGallery(limit);

    // If store is empty, seed on the fly with the 3 hand-written exemplars!
    if (items.length === 0) {
      items = Object.entries(ARCHETYPE_EXEMPLARS).map(([key, exemplar]) => ({
        slug: `${key}-exemplar`,
        spec: exemplar.spec,
        code: exemplar.code,
        report: {
          status: "pass",
          attempt: 0,
          codeHash: "seed",
          checks: [],
          timings: { stepMsAvg: 0.5, drawMsAvg: 1.2 },
        },
        repairHistory: [],
        createdAt: Date.now(),
        source: "seed",
        cacheKey: `seed_${key}`,
        hits: 10,
      }));
    }

    return NextResponse.json({ items });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: "GALLERY_FAILED", message: err.message } },
      { status: 500 }
    );
  }
}
