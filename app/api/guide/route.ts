import { NextRequest, NextResponse } from "next/server";
import { GuideRequestSchema } from "@/lib/schemas/guide";
import { generateGuidedTour } from "@/lib/pipeline/guide";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const parseResult = GuideRequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: { code: "INVALID_REQUEST", message: parseResult.error.message } },
        { status: 400 }
      );
    }

    const { spec } = parseResult.data;
    const tour = await generateGuidedTour(spec);

    return NextResponse.json({ success: true, tour });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: "GUIDE_FAILED", message: err.message } },
      { status: 500 }
    );
  }
}
