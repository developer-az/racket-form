import type { ShotStrategyCard } from "@/types/pickleball";

/**
 * Teaching-grade target difficulty — not PPA/MLP telemetry.
 * Ranked by how hard the ball is for a set kitchen player to handle.
 */
export type DefendZoneId = "feet" | "middle" | "hip" | "pocket" | "body";

export type DefendZone = {
  id: DefendZoneId;
  rank: number;
  difficulty: number;
  label: string;
  why: string;
  /** Court feet from left sideline / opponent baseline. */
  rects: { x: number; y: number; w: number; h: number }[];
};

export const DEFEND_ZONES: DefendZone[] = [
  {
    id: "feet",
    rank: 1,
    difficulty: 96,
    label: "Feet · below tape",
    why: "No leverage off the shoe tops — they lift, dump, or open the face into a put-away.",
    rects: [
      { x: 3.4, y: 13.7, w: 3.4, h: 1.7 },
      { x: 13.2, y: 13.7, w: 3.4, h: 1.7 },
    ],
  },
  {
    id: "middle",
    rank: 2,
    difficulty: 91,
    label: "Middle seam",
    why: "Both partners hesitate — late calls lose more points than weak technique.",
    rects: [{ x: 8.4, y: 14.2, w: 3.2, h: 3.6 }],
  },
  {
    id: "hip",
    rank: 3,
    difficulty: 87,
    label: "Hip-line speed-up",
    why: "Jam height: too high to lift, too low to punch cleanly. Chest-high balls get blocked.",
    rects: [
      { x: 4.1, y: 12.6, w: 2.2, h: 1.4 },
      { x: 13.7, y: 12.6, w: 2.2, h: 1.4 },
    ],
  },
  {
    id: "pocket",
    rank: 4,
    difficulty: 82,
    label: "Crosscourt stretch",
    why: "Pulls them off the line and opens the middle for the next ball.",
    rects: [{ x: 16.2, y: 15.2, w: 3.2, h: 2.8 }],
  },
  {
    id: "body",
    rank: 5,
    difficulty: 76,
    label: "Jammed body drive",
    why: "Takes time away when they are midcourt or late to the line — not a sideline hero ball.",
    rects: [{ x: 8.6, y: 8.2, w: 2.8, h: 4.2 }],
  },
];

export type FaceContact = {
  faceDeg: number;
  contactHeightIn: number;
  note: string;
};

/** Positive faceDeg = open (dink/reset). Negative = closed (speed-up/drive). */
export const SHOT_CONTACT: Record<NonNullable<ShotStrategyCard["diagram"]>, FaceContact> = {
  "dink-pockets": {
    faceDeg: 12,
    contactHeightIn: 26,
    note: "Open ~12° · lift from the shoulder, arc just over the 34\" tape",
  },
  "drop-targets": {
    faceDeg: 14,
    contactHeightIn: 22,
    note: "Open ~14° · contact out front, finish low-to-high without slapping",
  },
  "speed-up-lanes": {
    faceDeg: -8,
    contactHeightIn: 38,
    note: "Closed ~8° · only above net height, hip/torso not shoelaces",
  },
  "feet-hips": {
    faceDeg: 6,
    contactHeightIn: 24,
    note: "Slightly open · aim below tape so they must lift",
  },
  "serve-return": {
    faceDeg: 4,
    contactHeightIn: 28,
    note: "Compact · depth first, 3–4 ft inside the baseline",
  },
  "drive-lanes": {
    faceDeg: -4,
    contactHeightIn: 36,
    note: "Face ~square to 4° closed · drive the middle seam / body",
  },
  "reset-zone": {
    faceDeg: 18,
    contactHeightIn: 30,
    note: "Open ~18° · absorb, do not swing — die in the 7' kitchen",
  },
  "lob-overhead": {
    faceDeg: 20,
    contactHeightIn: 32,
    note: "Open for the lob; overhead finishes at the feet",
  },
  "erne-atp": {
    faceDeg: -6,
    contactHeightIn: 40,
    note: "Closed put-away · contact outside the 7' NVZ",
  },
  "hand-battle": {
    faceDeg: -2,
    contactHeightIn: 34,
    note: "Nearly square · 6–8\" punch, paddle recovers at chest",
  },
};

export const SHOT_HEAT: Partial<Record<NonNullable<ShotStrategyCard["diagram"]>, DefendZoneId[]>> = {
  "dink-pockets": ["pocket", "feet", "middle"],
  "drop-targets": ["feet", "middle"],
  "speed-up-lanes": ["hip", "middle"],
  "feet-hips": ["feet", "hip"],
  "serve-return": ["body", "feet"],
  "drive-lanes": ["body", "middle"],
  "reset-zone": ["middle"],
  "lob-overhead": ["feet"],
  "erne-atp": ["pocket"],
  "hand-battle": ["hip", "middle"],
};
