import type { StrokeType } from "@/types/biomechanics";
import type { MotionClip } from "@/lib/motion/types";
import { allStudyClips, getStudyClip } from "@/lib/pose/registry";

/** Reconstructed study clips only — no bundled authored mannequins. */
export function getMotionClip(id: string): MotionClip | undefined {
  return getStudyClip(id);
}

export function clipIdFor(playerId: string, stroke: StrokeType): string {
  return `${playerId}/${stroke}`;
}

export function requireMotionClip(playerId: string, stroke: StrokeType): MotionClip {
  const id = clipIdFor(playerId, stroke);
  const clip = getMotionClip(id);
  if (!clip) throw new Error(`No reconstructed swing for ${id}`);
  return clip;
}

export function allMotionClips(): MotionClip[] {
  return allStudyClips();
}
