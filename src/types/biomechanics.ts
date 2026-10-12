/** Scientific biomechanics types for elite tennis stroke analysis */

export type StrokeType =
  | "forehand"
  | "backhand"
  | "serve"
  | "slice"
  | "volley";

export type StrokePhase =
  | "ready"
  | "unitTurn"
  | "backswing"
  | "trophy"
  | "acceleration"
  | "contact"
  | "followThrough"
  | "recovery";

export type GripType =
  | "eastern"
  | "semiWestern"
  | "western"
  | "continental"
  | "twoHanded";

export interface PhaseKeyframe {
  phase: StrokePhase;
  /** Normalized 0–1 within the full stroke cycle */
  t: number;
  /** Duration of this phase in ms (mean ± from lab studies) */
  durationMs: number;
  /** Instantaneous racket head speed m/s */
  racketSpeedMs: number;
  /** Ball spin rpm estimate at/after contact; 0 otherwise */
  spinRpm: number;
  coachingCue: string;
}

export interface KineticChainTiming {
  /** Order of peak angular velocity contributions */
  sequence: string[];
  /** Lag between proximal and distal peaks (ms) */
  proximalDistalLagMs: number;
  /** Hip–shoulder separation at max stretch (degrees) — “X-factor” */
  xFactorDeg: number;
  /** Peak ground reaction force estimate (N) */
  peakGrfN: number;
}

export interface ConsistencyProfile {
  /** Coefficient of variation for contact height (%) */
  contactHeightCv: number;
  /** Timing variability across trials (ms SD) */
  timingSdMs: number;
  /** Racket path reproducibility 0–100 */
  pathReproducibility: number;
  /** Signature quirk visible in form */
  signatureQuirk: string;
}

export interface StrokeMetrics {
  peakRacketSpeedMs: number;
  contactHeightM: number;
  contactDepthM: number;
  avgSpinRpm: number;
  launchAngleDeg: number;
  swingPathDeg: number;
  impactDurationMs: number;
  grip: GripType;
  kineticChain: KineticChainTiming;
  consistency: ConsistencyProfile;
  /** Peer-reviewed / lab-derived notes */
  researchNotes: string[];
  sources: string[];
}

export interface StrokeProfile {
  type: StrokeType;
  label: string;
  handedness: "right" | "left";
  oneHanded: boolean;
  metrics: StrokeMetrics;
  keyframes: PhaseKeyframe[];
  /** Per-athlete technique parameters fed into the motion solver. */
  style?: MotionStyle;
  /** Published numbers for this athlete and stroke, each with provenance. */
  published?: PublishedStat[];
  /** Observable technique traits, tied to the phase where they show. */
  quirks?: Quirk[];
}

/**
 * Where a number comes from.
 *  measured — ball tracking, radar or high-speed video, with a citation
 *  reported — an official listing or credible secondary source (profile height, stringing)
 *  modeled  — our estimate; no published value exists
 */
export type Provenance = "measured" | "reported" | "modeled";

export interface Sourced<T = number> {
  value: T;
  status: Provenance;
  /** Short citation shown on hover. */
  source?: string;
  note?: string;
}

export interface PublishedStat {
  id: string;
  label: string;
  value: number;
  unit: string;
  status: Provenance;
  source?: string;
  /** Context, e.g. "Tour average 2,708 rpm" */
  note?: string;
}

export interface Quirk {
  text: string;
  /** Phase where the quirk is visible in the animation. */
  phase?: StrokePhase;
  source?: string;
}

/**
 * Technique parameters that change the solved motion. All optional; the
 * archetype default is used when absent.
 */
export interface MotionStyle {
  /** Groundstroke footwork at contact. */
  stance?: "open" | "semiOpen" | "neutral";
  /** Backswing size multiplier: 0.7 compact … 1.25 long. */
  takeback?: number;
  /** Groundstroke finish shape. */
  finish?: "wrap" | "wiper" | "reverse" | "extend" | "high";
  /** 0–1 extra leg load before the forward swing (pelvis drop), released as drive. */
  legLoad?: number;
  /** Serve: knee bend at the trophy, 0–1 (0.5 = archetype). */
  trophyLoad?: number;
}

export interface AthleteSpec {
  height: Sourced<number>;
  mass: Sourced<number>;
  /** Fingertip-to-fingertip arm span (m). */
  armSpan: Sourced<number>;
  racket: Sourced<string>;
  strings?: Sourced<string>;
  /** Grip per stroke, in plain words. */
  grips: Partial<Record<StrokeType, Sourced<string>>>;
  /** Extra facts that shape the motion (e.g. plays left, writes right). */
  notes?: Sourced<string>[];
}

export interface Anthropometrics {
  heightM: number;
  wingspanM: number;
  massKg: number;
  /** Segment length ratios relative to height */
  torsoRatio: number;
  upperArmRatio: number;
  forearmRatio: number;
  thighRatio: number;
  shankRatio: number;
}

export interface PlayerProfile {
  id: string;
  name: string;
  shortName: string;
  nationality: string;
  era: string;
  playingStyle: string;
  dominantHand: "right" | "left";
  backhandStyle: "oneHanded" | "twoHanded";
  color: string;
  accent: string;
  anthropometrics: Anthropometrics;
  spec: AthleteSpec;
  strokes: Record<StrokeType, StrokeProfile>;
  biography: string;
}
