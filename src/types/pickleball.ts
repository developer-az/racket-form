/** Pickleball hub tabs — URL `?tab=` values. */
export type PickleballTab = "paddle-tech" | "play-correctly" | "shot-strategy";

export type PaddleShape = "standard" | "elongated" | "hybrid" | "widebody";
export type PaddleCore = "polymer" | "nomex" | "aluminum" | "foam";
export type PaddleFace = "raw-carbon" | "fiberglass" | "composite" | "graphite";
export type FaceTexture = "grit" | "raw" | "smooth" | "thermoformed";
export type PlayBias = "control" | "power" | "all-court" | "spin";
export type PaddleSpecsProvenance = "pickleball-effect-lab" | "coaching-estimate" | "manufacturer-catalog";

/** How the paddle entered the local catalog. */
export type PaddleCatalogTier = "lab-measured" | "tour-seed";

export type PaddleMeasured = {
  source: "pickleball-effect";
  powerMph: number | null;
  popMph: number | null;
  spinRpm: number | null;
  powerPercentile: number | null;
  popPercentile: number | null;
  swingPercentile: number | null;
  twistPercentile: number | null;
  firepowerPercentile: number | null;
  gritType: string | null;
  paddleType: string | null;
  buildStyle: string | null;
};

export type PaddleProfile = {
  id: string;
  brand: string;
  name: string;
  shape: PaddleShape;
  core: PaddleCore;
  face: PaddleFace;
  texture: FaceTexture;
  /** Static weight in ounces (measured or catalog). */
  weightOz: number;
  /** Core / paddle thickness in mm when known. */
  thicknessMm?: number | null;
  /** Rotational swingweight (lab kg·cm²-style index from Pickleball Effect). */
  swingweight?: number | null;
  /** Twist weight / stability index when measured. */
  twistWeight?: number | null;
  /** Balance point from butt in mm when measured. */
  balanceMm?: number | null;
  /** Balance: head-heavy (+), even (0), handle-heavy (−) coaching scale. */
  balance: number;
  gripCircumferenceIn: number;
  gripLengthIn?: number | null;
  edgeGuard: "thin" | "standard" | "thick" | "foam-injected";
  /** Coaching compare scores 0–100 (percentile maps when lab-backed). */
  power: number;
  control: number;
  spin: number;
  pop: number;
  sweetSpot: number;
  bias: PlayBias;
  feel: string;
  uniqueTrait: string;
  bestFor: string;
  notes: string;
  year?: number | null;
  approval?: string | null;
  measured?: PaddleMeasured | null;
  specsProvenance?: PaddleSpecsProvenance;
  imageProvenance?: "tennis-warehouse-cdn" | null;
  imageUrl?: string;
  /** lab-measured = Pickleball Effect snapshot; tour-seed = curated local catalog. */
  catalogTier?: PaddleCatalogTier;
  /** Short note on why this paddle matters on tour / in serious play. */
  tourPresence?: string | null;
  /** Optional hand-authored coaching tips — overrides generated tips when set. */
  tips?: string[];
  /** Optional hand-authored pro-use block — overrides generated pro patterns when set. */
  proUse?: PaddleProUse;
};

export type PaddleProUse = {
  headline: string;
  howTheyWin: string[];
  fastHands: string;
  dominate: string;
};

export type PaddleTapeZone = "tip" | "three-nine" | "throat" | "handle";

export type PaddleTapePiece = {
  id: string;
  zone: PaddleTapeZone;
  massG: number;
};

export type PaddleCatalogMeta = {
  source: string;
  updated: string;
  count: number;
  note?: string;
  sheet?: string;
  labCount?: number;
  tourSeedCount?: number;
};

export type DoublesLesson = {
  id: string;
  step: string;
  title: string;
  blurb: string;
  points: string[];
  /** Optional diagram key rendered by PlayCorrectlyPanel. */
  diagram?:
    | "court-roles"
    | "nvz"
    | "serve-receive"
    | "stack-basic"
    | "transition-unit"
    | "kitchen-battle"
    | "third-shot-choice"
    | "stay-back-vs-up"
    | "hand-battle";
};

export type ShotStrategyCard = {
  id: string;
  title: string;
  when: string;
  how: string[];
  avoid: string;
  /** Coaching scores for interactive compare (0–100). */
  patience: number;
  /** Ball speed / aggression at contact (soft reset low → speed-up high). */
  pace: number;
  /** How much target precision matters vs simply sending the ball. */
  placement: number;
  risk: number;
  partnerDependence: number;
  /** Optional court diagram overlay. */
  diagram?:
    | "dink-pockets"
    | "drop-targets"
    | "speed-up-lanes"
    | "feet-hips"
    | "serve-return"
    | "drive-lanes"
    | "reset-zone"
    | "lob-overhead"
    | "erne-atp"
    | "hand-battle";
};

export type TechLever = {
  id: string;
  label: string;
  options: { id: string; label: string; controlDelta: number; powerDelta: number; note: string }[];
};
