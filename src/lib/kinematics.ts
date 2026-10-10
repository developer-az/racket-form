import type { PhaseKeyframe, StrokePhase, StrokeProfile } from "@/types/biomechanics";

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t));
}

export interface SampledPose {
  t: number;
  phase: StrokePhase;
  racketSpeedMs: number;
  spinRpm: number;
  coachingCue: string;
  /** Progress within current phase 0–1 */
  phaseProgress: number;
  keyframeIndex: number;
}

export function sampleStroke(stroke: StrokeProfile, t: number): SampledPose {
  const frames = stroke.keyframes;
  const x = clamp01(t);

  if (frames.length === 0) {
    throw new Error("Stroke has no keyframes");
  }
  if (x <= frames[0].t) {
    return {
      t: x,
      phase: frames[0].phase,
      racketSpeedMs: frames[0].racketSpeedMs,
      spinRpm: frames[0].spinRpm,
      coachingCue: frames[0].coachingCue,
      phaseProgress: 0,
      keyframeIndex: 0,
    };
  }
  if (x >= frames[frames.length - 1].t) {
    const last = frames[frames.length - 1];
    return {
      t: x,
      phase: last.phase,
      racketSpeedMs: last.racketSpeedMs,
      spinRpm: last.spinRpm,
      coachingCue: last.coachingCue,
      phaseProgress: 1,
      keyframeIndex: frames.length - 1,
    };
  }

  let i = 0;
  while (i < frames.length - 1 && frames[i + 1].t < x) i++;
  const a = frames[i];
  const b = frames[i + 1];
  const span = b.t - a.t || 1;
  const local = (x - a.t) / span;

  return {
    t: x,
    phase: local < 0.5 ? a.phase : b.phase,
    racketSpeedMs: lerp(a.racketSpeedMs, b.racketSpeedMs, local),
    spinRpm: local < 0.5 ? a.spinRpm : b.spinRpm,
    coachingCue: local < 0.5 ? a.coachingCue : b.coachingCue,
    phaseProgress: local,
    keyframeIndex: i,
  };
}

export function totalStrokeDurationMs(stroke: StrokeProfile): number {
  return stroke.keyframes.reduce((sum, k) => sum + k.durationMs, 0);
}

export function phaseAt(stroke: StrokeProfile, t: number): PhaseKeyframe {
  // Nearest keyframe — matches `sampleStroke().phase` so labels and cues agree
  const sampled = sampleStroke(stroke, t);
  const i = sampled.keyframeIndex + (sampled.phaseProgress >= 0.5 ? 1 : 0);
  return stroke.keyframes[Math.min(i, stroke.keyframes.length - 1)];
}

export const PHASE_LABELS: Record<StrokePhase, string> = {
  ready: "Ready",
  unitTurn: "Unit Turn",
  backswing: "Backswing",
  trophy: "Trophy Pose",
  acceleration: "Acceleration",
  contact: "Contact",
  followThrough: "Follow-Through",
  recovery: "Recovery",
};

/** Degrees → radians */
export function deg(d: number): number {
  return (d * Math.PI) / 180;
}
