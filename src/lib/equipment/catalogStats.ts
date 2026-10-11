/**
 * Catalog-relative statistics: where a value sits among all frames, and the
 * distribution a range filter is drawn over. Nulls are excluded, not imputed.
 */

export type NumericKey = "weightG" | "swingweight" | "stiffnessRa" | "balanceMm" | "headSizeSqIn";

export interface Distribution {
  min: number;
  max: number;
  /** Sorted ascending, nulls removed */
  sorted: number[];
  /** Bin counts across [min, max] */
  bins: number[];
  binWidth: number;
}

export function distribution(values: (number | null | undefined)[], binCount = 24): Distribution {
  const sorted = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v)).sort((a, b) => a - b);
  const min = sorted[0] ?? 0;
  const max = sorted[sorted.length - 1] ?? 1;
  const span = Math.max(1e-9, max - min);
  const binWidth = span / binCount;
  const bins = new Array<number>(binCount).fill(0);
  for (const v of sorted) {
    bins[Math.min(binCount - 1, Math.floor((v - min) / binWidth))] += 1;
  }
  return { min, max, sorted, bins, binWidth };
}

/** Share of the catalog strictly below `v`, 0–100. */
export function percentile(d: Distribution, v: number | null | undefined): number | null {
  if (v == null || d.sorted.length === 0) return null;
  let lo = 0;
  let hi = d.sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (d.sorted[mid] < v) lo = mid + 1;
    else hi = mid;
  }
  return Math.round((lo / d.sorted.length) * 100);
}

export function median(d: Distribution): number {
  const n = d.sorted.length;
  if (n === 0) return 0;
  return n % 2 ? d.sorted[(n - 1) / 2] : (d.sorted[n / 2 - 1] + d.sorted[n / 2]) / 2;
}

/** Balance in points head-light (positive) or head-heavy (negative), 1 pt = 3.175 mm. */
export function balancePoints(balanceMm: number, lengthMm = 685): number {
  return Math.round(((lengthMm / 2 - balanceMm) / 3.175) * 10) / 10;
}

export function formatBalance(balanceMm: number | null | undefined): string {
  if (balanceMm == null) return "—";
  const pts = balancePoints(balanceMm);
  if (Math.abs(pts) < 0.5) return `${balanceMm} mm · even`;
  return `${balanceMm} mm · ${Math.abs(pts).toFixed(0)} pts ${pts > 0 ? "HL" : "HH"}`;
}

export function patternBand(pattern: string | null | undefined): "16x19" | "18x20" | "other" {
  if (!pattern) return "other";
  const p = pattern.toLowerCase().replace(/\s/g, "").replace("×", "x");
  if (p.startsWith("16x19")) return "16x19";
  if (p.startsWith("18x20")) return "18x20";
  return "other";
}

/**
 * Specs the snapshot fills with placeholders rather than measurements.
 * Swingweight: 395 of 481 non-null values are exactly 320 while 318 and 321 hold
 * 6 and 3 frames, so 320 is the ingest default (it is also listed on 255 g
 * frames, which is physically implausible). Stiffness: production frames span
 * roughly 55–77 RA; 50 and 99–100 are entry errors.
 * Unknown is more honest than a wrong number in a filter, sort or percentile.
 */
export const PLACEHOLDER_SWINGWEIGHT = 320;

export function cleanSpecs<T extends { swingweight: number | null; stiffnessRa: number | null }>(r: T): T {
  const swBad = r.swingweight === PLACEHOLDER_SWINGWEIGHT;
  const raBad = r.stiffnessRa != null && (r.stiffnessRa <= 50 || r.stiffnessRa >= 90);
  if (!swBad && !raBad) return r;
  return {
    ...r,
    swingweight: swBad ? null : r.swingweight,
    stiffnessRa: raBad ? null : r.stiffnessRa,
  };
}
