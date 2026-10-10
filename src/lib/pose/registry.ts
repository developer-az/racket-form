import type { StrokeType } from "@/types/biomechanics";
import type { MotionClip } from "@/lib/motion/types";

/** Live reconstructed clips. Nothing is bundled from author.ts. */
const live = new Map<string, MotionClip>();

export function studyKey(playerId: string, stroke: StrokeType | string): string {
  return `${playerId}/${stroke}`;
}

export function putStudyClip(clip: MotionClip): void {
  live.set(clip.id, clip);
}

export function removeStudyClip(id: string): void {
  live.delete(id);
}

export function getStudyClip(id: string): MotionClip | undefined {
  return live.get(id);
}

export function allStudyClips(): MotionClip[] {
  return [...live.values()];
}

export function clearStudyClips(): void {
  live.clear();
}
