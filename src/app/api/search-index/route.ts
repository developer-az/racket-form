import { NextResponse } from "next/server";
import { loadRackets } from "@/lib/equipment/rackets";
import { STRINGS } from "@/data/equipment/strings";
import { GRIPS } from "@/data/equipment/grips";
import { PLAYERS } from "@/data/players";
import { externalRacketImage } from "@/lib/equipment/media/externalImages";

/** Slim index for the global search palette: names and a few specs, no prose. */
export async function GET() {
  const { rackets } = await loadRackets();
  return NextResponse.json(
    {
      athletes: PLAYERS.map((p) => ({
        id: p.id,
        name: p.name,
        nationality: p.nationality,
        dominantHand: p.dominantHand,
        backhandStyle: p.backhandStyle,
      })),
      rackets: rackets.map((r) => ({
        slug: r.slug,
        brand: r.brand,
        model: r.model,
        year: r.year,
        weightG: r.weightG,
        headSizeSqIn: r.headSizeSqIn,
        photo: externalRacketImage(r.slug) != null,
      })),
      strings: STRINGS.map((s) => ({ id: s.id, brand: s.brand, name: s.name, material: s.material })),
      grips: GRIPS.map((g) => ({ id: g.id, brand: g.brand, name: g.name, kind: g.kind })),
    },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
  );
}
