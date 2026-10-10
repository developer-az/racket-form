/**
 * Video → 3D swing reconstruction.
 *
 * Learned from (not copied):
 * - TennisTracker (MIT) — MediaPipe BlazePose 33, hip-mid root, torso scale,
 *   Savitzky–Golay, R3F playback
 * - PoseAnalysis (MIT) — upload a sports video, 3D pose replay
 * - MediaPipe Pose Landmarker (Apache-2.0) — world landmarks in meters
 *
 * Reviewed, not bundled:
 * - Tennis-MoCap (CC BY-SA 3.0) — real league BVH, share-alike + not these athletes
 *
 * Authored mannequin clips are not on the live path.
 */
export { BLAZE, BLAZE_COUNT, hitIsRightSide, type PoseFrame, type LandmarkXYZ } from "./landmarks";
export { reconstructClip, type ReconstructMeta, type ReconstructOpts } from "./reconstruct";
export { reconstructFromVideoFile, ensureLandmarker, type LandmarkerProgress } from "./landmarker";
export {
  getStudyClip,
  putStudyClip,
  removeStudyClip,
  studyKey,
  allStudyClips,
} from "./registry";
