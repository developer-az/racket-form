import type { PaddleCatalogMeta, PaddleProfile } from "@/types/pickleball";
import snapshot from "@/data/pickleball/paddles.snapshot.json";

type SnapshotFile = {
  meta: PaddleCatalogMeta;
  paddles: PaddleProfile[];
};

const data = snapshot as SnapshotFile;

/** Curated paddle catalog — Pickleball Effect lab specs + TW photos when matched. */
export function loadPaddles(): { paddles: PaddleProfile[]; meta: PaddleCatalogMeta } {
  const paddles = data.paddles.map((p) => ({ ...p }));
  return {
    paddles,
    meta: {
      ...data.meta,
      count: paddles.length,
    },
  };
}

export function getPaddleById(id: string): PaddleProfile | undefined {
  return loadPaddles().paddles.find((p) => p.id === id);
}
