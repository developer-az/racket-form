import type { RacketProfile } from "@/types/equipment";
import { externalRacketImage, hasExternalPhoto } from "@/lib/equipment/media/externalImages";
import { racketImageUrl } from "@/lib/equipment/media/urls";

export type FeaturedRacket = {
  slug: string;
  brand: string;
  model: string;
  year: number;
  style: string;
  summary: string;
  imageUrl: string;
  power: number;
  spin: number;
  control: number;
};

/** Prefer rackets with a real TW/product photo (not SVG-only fallback). */
export function pickRandomFeaturedRacket(rackets: RacketProfile[]): FeaturedRacket | null {
  const withPhotos = rackets.filter((r) => hasExternalPhoto("racket", r.slug));
  const pool = withPhotos.length > 0 ? withPhotos : rackets;
  if (pool.length === 0) return null;

  const pick = pool[Math.floor(Math.random() * pool.length)]!;
  const photo = externalRacketImage(pick.slug) ?? racketImageUrl(pick);

  return {
    slug: pick.slug,
    brand: pick.brand,
    model: pick.model,
    year: pick.year,
    style: pick.style,
    summary: pick.summary,
    imageUrl: photo,
    power: pick.power,
    spin: pick.spin,
    control: pick.control,
  };
}
