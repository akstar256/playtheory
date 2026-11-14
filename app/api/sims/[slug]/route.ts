import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const store = getStore();

    const sim = await store.getSim(slug);
    if (!sim) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: `Simulation '${slug}' not found` } },
        { status: 404 }
      );
    }

    // Increment hit counter asynchronously
    store.incrementHits(slug).catch(() => {});

    return NextResponse.json({ sim });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: err.message } },
      { status: 500 }
    );
  }
}
