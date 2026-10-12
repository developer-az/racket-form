import type { RacketProfile, StringProfile, GripProfile } from "@/types/equipment";
import { equipmentLabel, modelWithoutBrand } from "@/lib/equipment/labels";

/**
 * Fallback tiles for equipment with no product photo. They show what we actually
 * know (brand, model, measured specs) rather than drawing an imitation product.
 * Transparent background and mid-grey ink so they read on light and dark surfaces.
 */

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Greedy word wrap into at most `maxLines`, ellipsising the last line. */
function wrap(text: string, perLine: number, maxLines: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length <= perLine || !cur) {
      cur = next;
    } else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    const last = kept[maxLines - 1];
    kept[maxLines - 1] = last.length > perLine - 1 ? `${last.slice(0, perLine - 1)}…` : `${last}…`;
    return kept;
  }
  return lines.map((l) => (l.length > perLine ? `${l.slice(0, perLine - 1)}…` : l));
}

const INK = "#8a9099";
const MONO = "ui-monospace,SFMono-Regular,Menlo,monospace";
const SANS = "ui-sans-serif,system-ui,sans-serif";

function specTile(opts: {
  w: number;
  h: number;
  label: string;
  kind: string;
  brand: string;
  model: string;
  specs: string[];
}): string {
  const { w, h } = opts;
  const pad = 16;
  const modelLines = wrap(opts.model || opts.brand, Math.floor((w - pad * 2) / 7.4), 3);
  const lineH = 17;
  const blockH = 14 + modelLines.length * lineH + (opts.specs.length ? 22 : 0);
  let y = Math.round((h - blockH) / 2) + 10;

  const parts: string[] = [];
  parts.push(
    `<text x="${pad}" y="${y}" fill="${INK}" font-family="${MONO}" font-size="9" letter-spacing="1.2">${esc(opts.brand.toUpperCase().slice(0, 22))}</text>`,
  );
  y += 20;
  for (const l of modelLines) {
    parts.push(
      `<text x="${pad}" y="${y}" fill="${INK}" font-family="${SANS}" font-size="14" font-weight="600">${esc(l)}</text>`,
    );
    y += lineH;
  }
  if (opts.specs.length) {
    y += 6;
    parts.push(
      `<text x="${pad}" y="${y}" fill="${INK}" fill-opacity="0.8" font-family="${MONO}" font-size="9">${esc(opts.specs.join(" · "))}</text>`,
    );
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(opts.label)}">
  <rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="6" fill="${INK}" fill-opacity="0.06" stroke="${INK}" stroke-opacity="0.35"/>
  <text x="${pad}" y="22" fill="${INK}" fill-opacity="0.7" font-family="${MONO}" font-size="8" letter-spacing="1.2">${esc(opts.kind)}</text>
  <text x="${w - pad}" y="${h - 14}" text-anchor="end" fill="${INK}" fill-opacity="0.55" font-family="${MONO}" font-size="7.5" letter-spacing="1">NO PHOTO</text>
  ${parts.join("\n  ")}
</svg>`;
}

export function racketPortraitSvg(r: RacketProfile): string {
  const specs = [
    r.weightG != null ? `${r.weightG} g` : "",
    r.headSizeSqIn != null ? `${r.headSizeSqIn} in²` : "",
    r.stringPattern ? r.stringPattern.replace(/x/i, "×") : "",
  ].filter(Boolean);
  return specTile({
    w: 200,
    h: 260,
    label: equipmentLabel(r.brand, r.model),
    kind: r.year ? `RACKET · ${r.year}` : "RACKET",
    brand: r.brand,
    model: modelWithoutBrand(r.brand, r.model),
    specs,
  });
}

const MATERIAL_TAG: Record<StringProfile["material"], string> = {
  polyester: "POLY",
  "co-poly": "CO-POLY",
  multifilament: "MULTIFILAMENT",
  "synthetic-gut": "SYNTHETIC GUT",
  "natural-gut": "NATURAL GUT",
  hybrid: "HYBRID",
};

export function stringPortraitSvg(s: StringProfile, gaugeMm?: number): string {
  const gauge = gaugeMm ?? s.gaugesMm[0];
  return specTile({
    w: 200,
    h: 200,
    label: equipmentLabel(s.brand, s.name),
    kind: `STRING · ${MATERIAL_TAG[s.material]}`,
    brand: s.brand,
    model: modelWithoutBrand(s.brand, s.name),
    specs: [gauge != null ? `${gauge.toFixed(2)} mm` : "", s.shape].filter(Boolean),
  });
}

export function gripPortraitSvg(g: GripProfile): string {
  return specTile({
    w: 200,
    h: 200,
    label: equipmentLabel(g.brand, g.name),
    kind: g.kind === "overgrip" ? "OVERGRIP" : "REPLACEMENT GRIP",
    brand: g.brand,
    model: modelWithoutBrand(g.brand, g.name),
    specs: [`${g.thicknessMm.toFixed(2)} mm`, g.texture],
  });
}
