import type { StrokeType } from "@/types/biomechanics";

/**
 * BlazePose 33-landmark indices (MediaPipe Pose Landmarker).
 * TennisTracker (MIT) and PoseAnalysis (MIT) use this same topology.
 */
export const BLAZE = {
  nose: 0,
  leftEyeInner: 1,
  leftEye: 2,
  leftEyeOuter: 3,
  rightEyeInner: 4,
  rightEye: 5,
  rightEyeOuter: 6,
  leftEar: 7,
  rightEar: 8,
  mouthLeft: 9,
  mouthRight: 10,
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftPinky: 17,
  rightPinky: 18,
  leftIndex: 19,
  rightIndex: 20,
  leftThumb: 21,
  rightThumb: 22,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
  leftHeel: 29,
  rightHeel: 30,
  leftFootIndex: 31,
  rightFootIndex: 32,
} as const;

export const BLAZE_COUNT = 33;

export type LandmarkXYZ = {
  x: number;
  y: number;
  z: number;
  visibility?: number;
};

export type PoseFrame = {
  /** Seconds from video start. */
  time: number;
  world: LandmarkXYZ[];
  image?: LandmarkXYZ[];
};

export function usableLandmark(lm: LandmarkXYZ | undefined, minVis = 0.22): boolean {
  if (!lm) return false;
  if ((lm.visibility ?? 1) < minVis) return false;
  return Math.abs(lm.x) + Math.abs(lm.y) + Math.abs(lm.z) > 1e-5;
}

/** Dominant hitting arm is the opposite side on backhand / slice. */
export function hitIsRightSide(
  handedness: "left" | "right",
  stroke: StrokeType,
): boolean {
  const backhandWing = stroke === "backhand" || stroke === "slice";
  return (handedness === "right") !== backhandWing;
}

export function hitWristIndex(hitRight: boolean): number {
  return hitRight ? BLAZE.rightWrist : BLAZE.leftWrist;
}
