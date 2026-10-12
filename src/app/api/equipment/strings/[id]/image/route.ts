import { STRINGS } from "@/data/equipment/strings";
import { stringPortraitSvg } from "@/lib/equipment/media/portraits";
import { externalStringImage } from "@/lib/equipment/media/externalImages";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const format = new URL(request.url).searchParams.get("format");

  const string = STRINGS.find((s) => s.id === id);
  if (!string) {
    return new Response("Not found", { status: 404 });
  }

  const external = externalStringImage(id);
  if (external && format !== "svg") {
    return Response.redirect(external, 302);
  }
  if (format !== "svg") {
    // No product photo on file: clients render a neutral well. The spec tile is opt-in.
    return new Response("No photo", { status: 404, headers: { "Cache-Control": "public, s-maxage=3600" } });
  }

  const svg = stringPortraitSvg(string);
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
