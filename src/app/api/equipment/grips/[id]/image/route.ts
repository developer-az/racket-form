import { GRIPS } from "@/data/equipment/grips";
import { gripPortraitSvg } from "@/lib/equipment/media/portraits";
import { externalGripImage } from "@/lib/equipment/media/externalImages";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const format = new URL(request.url).searchParams.get("format");

  const grip = GRIPS.find((g) => g.id === id);
  if (!grip) {
    return new Response("Not found", { status: 404 });
  }

  const external = externalGripImage(id);
  if (external && format !== "svg") {
    return Response.redirect(external, 302);
  }
  if (format !== "svg") {
    // No product photo on file: clients render a neutral well. The spec tile is opt-in.
    return new Response("No photo", { status: 404, headers: { "Cache-Control": "public, s-maxage=3600" } });
  }

  const svg = gripPortraitSvg(grip);
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
