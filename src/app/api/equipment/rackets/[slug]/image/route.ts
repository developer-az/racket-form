import { loadRackets } from "@/lib/equipment/rackets";
import { racketPortraitSvg } from "@/lib/equipment/media/portraits";
import { externalRacketImage } from "@/lib/equipment/media/externalImages";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const format = new URL(request.url).searchParams.get("format");

  const { rackets } = await loadRackets();
  const racket = rackets.find((r) => r.slug === slug);
  if (!racket) {
    return new Response("Not found", { status: 404 });
  }

  const external = externalRacketImage(slug);
  if (external && format !== "svg") {
    return Response.redirect(external, 302);
  }
  if (format !== "svg") {
    // No product photo on file: clients render a neutral well. The spec tile is opt-in.
    return new Response("No photo", { status: 404, headers: { "Cache-Control": "public, s-maxage=3600" } });
  }

  const svg = racketPortraitSvg(racket);
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
