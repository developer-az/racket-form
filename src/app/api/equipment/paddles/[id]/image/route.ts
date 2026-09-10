import { getPaddleById } from "@/lib/pickleball/paddles";
import { externalPaddleImage, paddlePortraitSvg } from "@/lib/pickleball/media";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const format = new URL(request.url).searchParams.get("format");

  const paddle = getPaddleById(id);
  if (!paddle) {
    return new Response("Not found", { status: 404 });
  }

  const external = externalPaddleImage(id);
  if (external && format !== "svg") {
    return Response.redirect(external, 302);
  }

  const svg = paddlePortraitSvg(paddle);
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
