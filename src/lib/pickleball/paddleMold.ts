import type { PaddleProfile, PaddleTapePiece, PaddleTapeZone } from "@/types/pickleball";

export const PADDLE_TAPE_ZONES: Record<
  PaddleTapeZone,
  { label: string; hint: string }
> = {
  tip: {
    label: "Tip",
    hint: "More plow and pop; slower hands at the kitchen.",
  },
  "three-nine": {
    label: "3 / 9 o'clock",
    hint: "Twist stability on off-center blocks; mild hand-speed cost.",
  },
  throat: {
    label: "Throat",
    hint: "Solid feel without a huge swingweight jump.",
  },
  handle: {
    label: "Handle",
    hint: "Head-lightens the paddle — faster hands, less plow.",
  },
};

export const PADDLE_TAPE_MASS_G = 3;

const ZONE_DELTA: Record<
  PaddleTapeZone,
  { power: number; control: number; spin: number; pop: number; sweetSpot: number; handSpeed: number }
> = {
  tip: { power: 5, control: -4, spin: 0, pop: 4, sweetSpot: -2, handSpeed: -6 },
  "three-nine": { power: 1, control: 3, spin: 0, pop: 0, sweetSpot: 5, handSpeed: -2 },
  throat: { power: 2, control: 1, spin: 0, pop: 1, sweetSpot: 2, handSpeed: -2 },
  handle: { power: -3, control: 3, spin: 0, pop: -2, sweetSpot: 0, handSpeed: 6 },
};

export function createPaddleTapePiece(zone: PaddleTapeZone, massG = PADDLE_TAPE_MASS_G): PaddleTapePiece {
  return {
    id: `pt-${zone}-${massG}-${Math.random().toString(36).slice(2, 8)}`,
    zone,
    massG,
  };
}

function clampScore(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function baseHandSpeed(p: PaddleProfile): number {
  let hand = 72;
  if (p.weightOz <= 7.6) hand += 10;
  else if (p.weightOz >= 8.3) hand -= 8;
  const sw = p.swingweight;
  if (sw != null && sw <= 108) hand += 8;
  if (sw != null && sw >= 118) hand -= 8;
  if (p.shape === "standard" || p.shape === "widebody") hand += 4;
  if (p.shape === "elongated") hand -= 4;
  if (p.thicknessMm != null && p.thicknessMm <= 14) hand += 4;
  return clampScore(hand);
}

export type PaddleMoldEffect = {
  power: number;
  control: number;
  spin: number;
  pop: number;
  sweetSpot: number;
  handSpeed: number;
  weightOz: number;
  gripCircumferenceIn: number;
  addedMassG: number;
  notes: string[];
};

/**
 * Coaching-grade tape / overgrip deltas on top of the selected paddle’s scores.
 * Not lab percentiles — labeled as a teaching model in the UI.
 */
export function paddleMoldEffect(
  p: PaddleProfile,
  pieces: PaddleTapePiece[],
  overgrips: number,
): PaddleMoldEffect {
  let power = p.power;
  let control = p.control;
  let spin = p.spin;
  let pop = p.pop;
  let sweetSpot = p.sweetSpot;
  let handSpeed = baseHandSpeed(p);
  const notes: string[] = [];
  const byZone: Partial<Record<PaddleTapeZone, number>> = {};

  for (const piece of pieces) {
    byZone[piece.zone] = (byZone[piece.zone] ?? 0) + piece.massG;
  }

  for (const [zone, grams] of Object.entries(byZone) as [PaddleTapeZone, number][]) {
    const units = grams / PADDLE_TAPE_MASS_G;
    const d = ZONE_DELTA[zone];
    power += d.power * units;
    control += d.control * units;
    spin += d.spin * units;
    pop += d.pop * units;
    sweetSpot += d.sweetSpot * units;
    handSpeed += d.handSpeed * units;
    notes.push(`${grams}g at ${PADDLE_TAPE_ZONES[zone].label.toLowerCase()} — ${PADDLE_TAPE_ZONES[zone].hint}`);
  }

  const wraps = Math.max(0, Math.min(2, Math.round(overgrips)));
  if (wraps > 0) {
    control += 3 * wraps;
    pop -= 2 * wraps;
    handSpeed -= 2 * wraps;
    notes.push(
      `${wraps} overgrip${wraps > 1 ? "s" : ""} — quieter wrist, +${(0.06 * wraps).toFixed(2)}" circumference.`,
    );
  }

  const addedMassG = pieces.reduce((n, piece) => n + piece.massG, 0);

  return {
    power: clampScore(power),
    control: clampScore(control),
    spin: clampScore(spin),
    pop: clampScore(pop),
    sweetSpot: clampScore(sweetSpot),
    handSpeed: clampScore(handSpeed),
    weightOz: Math.round((p.weightOz + addedMassG / 28.35) * 100) / 100,
    gripCircumferenceIn: Math.round((p.gripCircumferenceIn + 0.06 * wraps) * 100) / 100,
    addedMassG,
    notes,
  };
}

export function stockRecipe(p: PaddleProfile): { label: string; value: string }[] {
  const weight =
    p.weightOz <= 7.7 ? "Light" : p.weightOz >= 8.2 ? "Heavy" : "Mid";
  return [
    { label: "Core", value: `${p.core}${p.thicknessMm != null ? ` · ${p.thicknessMm}mm` : ""}` },
    { label: "Face", value: `${p.face.replace("-", " ")} · ${p.texture}` },
    { label: "Weight", value: `${weight} · ${p.weightOz.toFixed(1)} oz` },
    {
      label: "Grip & edge",
      value: `${p.gripCircumferenceIn}" · ${p.edgeGuard.replace("-", " ")}`,
    },
  ];
}
