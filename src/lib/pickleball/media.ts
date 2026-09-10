import type { PaddleProfile } from "@/types/pickleball";
import paddleImageCache from "@/data/pickleball/paddle-image-cache.json";
import { brandAccent } from "@/lib/equipment/media/brandColors";

type CacheEntry = { code?: string; title?: string; imageUrl: string };
type CacheBucket = Record<string, CacheEntry>;

const paddles = (paddleImageCache as { paddles: CacheBucket }).paddles ?? {};

export function externalPaddleImage(id: string): string | null {
  const entry = paddles[id];
  return entry?.imageUrl || null;
}

export function hasExternalPaddlePhoto(id: string): boolean {
  return Boolean(externalPaddleImage(id));
}

export function photoFirst(a: boolean, b: boolean): number {
  return Number(b) - Number(a);
}

export function paddleImageUrl(p: Pick<PaddleProfile, "id">): string {
  return `/api/equipment/paddles/${encodeURIComponent(p.id)}/image`;
}

export function withPaddleImages<T extends PaddleProfile>(list: T[]): T[] {
  return list.map((p) => ({
    ...p,
    imageUrl: p.imageUrl ?? externalPaddleImage(p.id) ?? paddleImageUrl(p),
  }));
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Shape-aware SVG portrait when no TW photo is matched. */
export function paddlePortraitSvg(p: PaddleProfile): string {
  const accent = brandAccent(p.brand);
  const shape = p.shape;
  const w = shape === "elongated" ? 72 : shape === "widebody" ? 96 : shape === "hybrid" ? 84 : 88;
  const h = shape === "elongated" ? 118 : shape === "widebody" ? 100 : shape === "hybrid" ? 110 : 108;
  const rx = shape === "widebody" ? 28 : 22;
  const x = (200 - w) / 2;
  const label = esc(`${p.brand} ${p.name}`.slice(0, 40));
  const brand = esc(p.brand.slice(0, 18));
  const model = esc(p.name.slice(0, 24));
  const specs = [
    p.thicknessMm != null ? `${p.thicknessMm}mm` : null,
    `${p.weightOz.toFixed(1)} oz`,
    p.swingweight != null ? `SW ${p.swingweight}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 260" width="200" height="260" role="img" aria-label="${label}">
  <defs>
    <linearGradient id="well" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f2f6f3"/>
      <stop offset="100%" stop-color="#e0e9e3"/>
    </linearGradient>
    <linearGradient id="face" x1="0.2" y1="0" x2="0.8" y2="1">
      <stop offset="0%" stop-color="#2a2f34"/>
      <stop offset="55%" stop-color="${accent}"/>
      <stop offset="100%" stop-color="#1a2220"/>
    </linearGradient>
  </defs>
  <rect width="200" height="260" fill="url(#well)"/>
  <rect x="${x.toFixed(1)}" y="28" width="${w}" height="${h}" rx="${rx}" fill="url(#face)" stroke="#1a2220" stroke-width="2"/>
  <rect x="${(x + 10).toFixed(1)}" y="40" width="${w - 20}" height="${h - 36}" rx="${Math.max(10, rx - 8)}" fill="rgba(255,255,255,0.08)"/>
  <rect x="90" y="${28 + h - 4}" width="20" height="54" rx="4" fill="#2a1c14"/>
  <rect x="86" y="${28 + h + 42}" width="28" height="18" rx="4" fill="#4a3224"/>
  <text x="100" y="220" text-anchor="middle" fill="#1a2220" font-family="system-ui,sans-serif" font-size="11" font-weight="700">${brand}</text>
  <text x="100" y="236" text-anchor="middle" fill="#3a4540" font-family="system-ui,sans-serif" font-size="10">${model}</text>
  <text x="100" y="250" text-anchor="middle" fill="#6a756f" font-family="ui-monospace,monospace" font-size="8">${esc(specs)}</text>
</svg>`;
}
