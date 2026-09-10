import { NextResponse } from "next/server";
import { loadPaddles } from "@/lib/pickleball/paddles";
import { withPaddleImages } from "@/lib/pickleball/media";

export async function GET() {
  const { paddles, meta } = loadPaddles();
  return NextResponse.json(
    { meta, paddles: withPaddleImages(paddles) },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
