import type { PaddleCatalogMeta, PaddleProfile } from "@/types/pickleball";
import snapshot from "@/data/pickleball/paddles.snapshot.json";
import { TOUR_CATALOG_META, TOUR_PADDLE_SEED } from "@/data/pickleball/tourCatalog.seed";

type SnapshotFile = {
  meta: PaddleCatalogMeta;
  paddles: PaddleProfile[];
};

const data = snapshot as SnapshotFile;

function withLabTier(p: PaddleProfile): PaddleProfile {
  return {
    ...p,
    catalogTier: p.catalogTier ?? (p.specsProvenance === "pickleball-effect-lab" ? "lab-measured" : "tour-seed"),
  };
}

/**
 * Merged paddle catalog: Pickleball Effect lab snapshot + local tour seed.
 * Lab / snapshot IDs always win when both sources define the same id.
 * No public tour-paddle API exists — the seed is the expandable local database.
 */
export function loadPaddles(): { paddles: PaddleProfile[]; meta: PaddleCatalogMeta } {
  const byId = new Map<string, PaddleProfile>();

  for (const p of TOUR_PADDLE_SEED) {
    byId.set(p.id, { ...p });
  }
  for (const p of data.paddles) {
    byId.set(p.id, withLabTier({ ...p }));
  }

  const paddles = [...byId.values()].sort((a, b) => {
    const tier = Number(b.catalogTier === "lab-measured") - Number(a.catalogTier === "lab-measured");
    if (tier !== 0) return tier;
    return `${a.brand} ${a.name}`.localeCompare(`${b.brand} ${b.name}`);
  });

  const labCount = paddles.filter((p) => p.catalogTier === "lab-measured").length;
  const tourSeedCount = paddles.length - labCount;

  return {
    paddles,
    meta: {
      source: `${data.meta.source} + ${TOUR_CATALOG_META.source}`,
      sheet: data.meta.sheet,
      updated: TOUR_CATALOG_META.updated,
      count: paddles.length,
      labCount,
      tourSeedCount,
      note: `${data.meta.note ?? ""} ${TOUR_CATALOG_META.note}`.trim(),
    },
  };
}

export function getPaddleById(id: string): PaddleProfile | undefined {
  return loadPaddles().paddles.find((p) => p.id === id);
}
