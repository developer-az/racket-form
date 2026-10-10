import type { GripProfile, RacketProfile, StringProfile } from "@/types/equipment";

/**
 * "Find my setup" — four questions → a complete, playable bag.
 *
 * Fitting rules follow common teaching-pro / ITF guidance rather than brand copy:
 *  - Frame mass and swingweight should match how fast the player can swing:
 *    heavier frames are more stable but cost racket-head speed for shorter swings.
 *  - Larger heads (100–105 sq in) forgive off-centre hits for developing players.
 *  - For sore or sensitive arms: lower frame stiffness (RA ≲ 65), softer strings
 *    (multifilament / gut / synthetic) and lower tension reduce shock at the hand.
 *  - Polyester suits long, fast swings that need spin and control; it is a poor
 *    default for beginners and sensitive arms.
 *  - Tension: lower → more depth/comfort, higher → more control (same string).
 */

export type Level = "new" | "developing" | "competitive" | "advanced";
export type Swing = "compact" | "moderate" | "full";
export type Want = "power" | "spin" | "control" | "comfort";
export type Arm = "fine" | "sensitive";

export interface FinderAnswers {
  level: Level;
  swing: Swing;
  want: Want;
  arm: Arm;
}

export interface FinderPick<T> {
  item: T;
  reasons: string[];
}

export interface SetupRecommendation {
  racket: FinderPick<RacketProfile>;
  alternatives: FinderPick<RacketProfile>[];
  string: FinderPick<StringProfile>;
  tensionLbs: number;
  gaugeMm: number;
  grip: FinderPick<GripProfile> | null;
}

const LEVEL_IDX: Record<Level, number> = { new: 0, developing: 1, competitive: 2, advanced: 3 };
const SWING_IDX: Record<Swing, number> = { compact: 0, moderate: 1, full: 2 };

/** Target unstrung mass (g) — level sets the band, swing length shifts it. */
function targetWeight(a: FinderAnswers): number {
  return 280 + LEVEL_IDX[a.level] * 9 + (SWING_IDX[a.swing] - 1) * 8;
}

function targetSwingweight(a: FinderAnswers): number {
  return 305 + LEVEL_IDX[a.level] * 5 + (SWING_IDX[a.swing] - 1) * 6;
}

function targetHead(a: FinderAnswers): number {
  return [104, 100, 99, 98][LEVEL_IDX[a.level]];
}

function scoreFor(item: { power: number; spin: number; control: number; comfort: number }, want: Want) {
  return item[want];
}

function scoreRacket(r: RacketProfile, a: FinderAnswers): number {
  let s = 0;
  const w = r.weightG ?? 300;
  s -= Math.abs(w - targetWeight(a)) * 0.9;
  if (r.swingweight != null) s -= Math.abs(r.swingweight - targetSwingweight(a)) * 0.45;
  const hs = r.headSizeSqIn ?? 100;
  s -= Math.abs(hs - targetHead(a)) * 1.6;
  s += scoreFor(r, a.want) * 0.9;
  // Everybody benefits from some forgiveness/comfort; arms that hurt need it most
  s += r.comfort * (a.arm === "sensitive" ? 0.6 : 0.1);
  if (a.arm === "sensitive" && r.stiffnessRa != null) s -= Math.max(0, r.stiffnessRa - 64) * 2.2;
  if (a.level === "new" || a.level === "developing") s += (r.power - 50) * 0.25;
  // Prefer current models (easier to buy, demo, and restring)
  s += Math.max(0, r.year - 2021) * 0.8;
  return s;
}

function racketReasons(r: RacketProfile, a: FinderAnswers): string[] {
  const out: string[] = [];
  const w = r.weightG;
  if (w != null) {
    out.push(
      w < 290
        ? `${w} g is light enough to swing fast without tiring.`
        : w < 305
          ? `${w} g balances stability with easy racket-head speed.`
          : `${w} g gives plow-through for your longer swing.`,
    );
  }
  const hs = r.headSizeSqIn;
  if (hs != null) {
    out.push(
      hs >= 102
        ? `${hs} sq in head is forgiving on off-centre hits.`
        : hs >= 99
          ? `${hs} sq in head keeps a generous sweet spot.`
          : `${hs} sq in head trades some forgiveness for precision.`,
    );
  }
  const wantLabel = { power: "power", spin: "spin", control: "control", comfort: "comfort" }[a.want];
  out.push(`Scores ${scoreFor(r, a.want)}/100 for ${wantLabel}, what you asked for.`);
  if (a.arm === "sensitive" && r.stiffnessRa != null) {
    out.push(
      r.stiffnessRa <= 64
        ? `Flexible frame (RA ${r.stiffnessRa}) sends less shock to the arm.`
        : `Stiffness RA ${r.stiffnessRa}; the soft string below offsets it.`,
    );
  }
  return out.slice(0, 3);
}

function stringFits(s: StringProfile, a: FinderAnswers): boolean {
  const poly = s.material === "polyester" || s.material === "co-poly";
  if (a.arm === "sensitive" || a.level === "new") return !poly;
  if (a.level === "developing" && a.swing !== "full") return !poly || s.comfort >= 60;
  return true;
}

function scoreString(s: StringProfile, a: FinderAnswers): number {
  const poly = s.material === "polyester" || s.material === "co-poly";
  let v = scoreFor(s, a.want) * 1.0 + s.comfort * (a.arm === "sensitive" ? 0.8 : 0.2);
  // Full swings with spin/control goals are what poly is built for
  if (poly && a.swing === "full" && (a.want === "spin" || a.want === "control")) v += 12;
  if (!poly && a.want === "power") v += 6;
  v += s.durability * (a.level === "advanced" ? 0.15 : 0.05);
  // Gut is superb but costly and moisture-sensitive — not a first restring
  if (s.material === "natural-gut" && (a.level === "new" || a.level === "developing")) v -= 18;
  return v;
}

function stringReasons(s: StringProfile, a: FinderAnswers, tension: number): string[] {
  const poly = s.material === "polyester" || s.material === "co-poly";
  const out: string[] = [];
  if (poly) out.push("Polyester bites the ball on long, fast swings for spin and control.");
  else if (s.material === "natural-gut") out.push("Natural gut is the most arm-friendly, lively bed there is.");
  else out.push("Soft multifilament-style feel: easy depth and kind to the arm.");
  const shift = tension - s.recommendedTensionLbs;
  out.push(
    shift < 0
      ? `${tension} lb, a little under its usual ${s.recommendedTensionLbs} lb, for comfort and depth.`
      : shift > 0
        ? `${tension} lb, a little over its usual ${s.recommendedTensionLbs} lb, to keep the ball in.`
        : `${tension} lb, right in its sweet range.`,
  );
  if (a.want === "spin" && s.spin >= 70) out.push(`Spin ${s.spin}/100 from its ${s.shape} profile.`);
  return out.slice(0, 3);
}

function pickTension(s: StringProfile, a: FinderAnswers): number {
  let t = s.recommendedTensionLbs;
  if (a.arm === "sensitive") t -= 2;
  if (a.want === "control") t += 2;
  if (a.want === "power" || a.want === "comfort") t -= 1;
  const [lo, hi] = s.tensionRangeLbs;
  return Math.round(Math.max(lo, Math.min(hi, t)));
}

function pickGrip(grips: GripProfile[], a: FinderAnswers): FinderPick<GripProfile> | null {
  const overgrips = grips.filter((g) => g.kind === "overgrip");
  if (overgrips.length === 0) return null;
  const best = [...overgrips].sort((x, y) => {
    const sx = x.tackiness * 0.5 + x.cushion * (a.arm === "sensitive" ? 0.7 : 0.3) + x.durability * 0.2;
    const sy = y.tackiness * 0.5 + y.cushion * (a.arm === "sensitive" ? 0.7 : 0.3) + y.durability * 0.2;
    return sy - sx;
  })[0];
  return {
    item: best,
    reasons: [
      a.arm === "sensitive"
        ? "Extra cushion damps vibration at the handle."
        : "Reliable tack so you can hold the racket loosely.",
      best.feel,
    ],
  };
}

export function recommendSetup(
  answers: FinderAnswers,
  catalog: { rackets: RacketProfile[]; strings: StringProfile[]; grips: GripProfile[] },
): SetupRecommendation | null {
  const ranked = catalog.rackets
    .map((r) => ({ r, s: scoreRacket(r, answers) }))
    .sort((x, y) => y.s - x.s);
  if (ranked.length === 0) return null;

  // Alternatives from other brands so the choice feels like a real comparison
  const top = ranked[0].r;
  const alts: RacketProfile[] = [];
  const brands = new Set([top.brand]);
  for (const { r } of ranked.slice(1)) {
    if (alts.length >= 2) break;
    if (brands.has(r.brand)) continue;
    brands.add(r.brand);
    alts.push(r);
  }

  const strings = catalog.strings.filter((s) => stringFits(s, answers));
  const pool = strings.length > 0 ? strings : catalog.strings;
  const string = [...pool].sort((x, y) => scoreString(y, answers) - scoreString(x, answers))[0];
  if (!string) return null;
  const tensionLbs = pickTension(string, answers);
  const gaugeMm = string.gaugesMm.includes(1.25) ? 1.25 : string.gaugesMm[0] ?? 1.25;

  return {
    racket: { item: top, reasons: racketReasons(top, answers) },
    alternatives: alts.map((r) => ({ item: r, reasons: racketReasons(r, answers) })),
    string: { item: string, reasons: stringReasons(string, answers, tensionLbs) },
    tensionLbs,
    gaugeMm,
    grip: pickGrip(catalog.grips, answers),
  };
}
