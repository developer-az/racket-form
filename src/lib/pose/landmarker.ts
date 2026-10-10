import type { StrokeType } from "@/types/biomechanics";
import { reconstructClip, type ReconstructMeta } from "./reconstruct";
import { BLAZE_COUNT, type LandmarkXYZ, type PoseFrame } from "./landmarks";
import type { MotionClip } from "@/lib/motion/types";

const MODEL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
const WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.0/wasm";

const MAX_SECONDS = 24;
const TARGET_FPS = 20;
const MAX_FRAMES = 160;

export type LandmarkerProgress = {
  stage: "model" | "decode" | "pose" | "reconstruct";
  progress: number;
  detail: string;
};

type PoseLandmarkerHandle = {
  detect: (video: HTMLVideoElement) => {
    worldLandmarks: LandmarkXYZ[][];
    landmarks: LandmarkXYZ[][];
  };
  close?: () => void;
};

let landmarkerPromise: Promise<PoseLandmarkerHandle> | null = null;

async function createLandmarker(): Promise<PoseLandmarkerHandle> {
  const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision");
  const fileset = await FilesetResolver.forVisionTasks(WASM);
  return PoseLandmarker.createFromOptions(fileset, {
    // CPU avoids stealing the Three.js WebGL context on shared GPUs.
    baseOptions: { modelAssetPath: MODEL, delegate: "CPU" },
    runningMode: "IMAGE",
    numPoses: 1,
    minPoseDetectionConfidence: 0.4,
    minPosePresenceConfidence: 0.4,
    minTrackingConfidence: 0.4,
  });
}

export async function ensureLandmarker(
  onProgress?: (p: LandmarkerProgress) => void,
): Promise<PoseLandmarkerHandle> {
  onProgress?.({ stage: "model", progress: 0.05, detail: "Loading Pose Landmarker…" });
  if (!landmarkerPromise) {
    landmarkerPromise = createLandmarker().catch((err) => {
      landmarkerPromise = null;
      throw err;
    });
  }
  const lm = await landmarkerPromise;
  onProgress?.({ stage: "model", progress: 0.18, detail: "Pose model ready" });
  return lm;
}

function copyLm(src: LandmarkXYZ[] | undefined): LandmarkXYZ[] {
  const out: LandmarkXYZ[] = [];
  const n = src?.length ?? 0;
  for (let i = 0; i < BLAZE_COUNT; i++) {
    const p = i < n ? src![i] : undefined;
    out.push({
      x: p?.x ?? 0,
      y: p?.y ?? 0,
      z: p?.z ?? 0,
      visibility: p?.visibility ?? 0,
    });
  }
  return out;
}

function seek(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const onSeeked = () => {
      cleanup();
      resolve();
    };
    const onErr = () => {
      cleanup();
      reject(new Error("Video seek failed"));
    };
    const cleanup = () => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onErr);
    };
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onErr);
    const t = Math.min(Math.max(0, time), Math.max(0, video.duration - 0.001));
    if (Math.abs(video.currentTime - t) < 0.001 && video.readyState >= 2) {
      cleanup();
      resolve();
      return;
    }
    video.currentTime = t;
  });
}

async function framesBySeek(
  video: HTMLVideoElement,
  landmarker: PoseLandmarkerHandle,
  onProgress?: (p: LandmarkerProgress) => void,
): Promise<PoseFrame[]> {
  const duration = Math.min(video.duration || 0, MAX_SECONDS);
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error("Could not read video duration.");
  }
  const step = Math.max(1 / TARGET_FPS, duration / MAX_FRAMES);
  const frames: PoseFrame[] = [];
  for (let t = 0; t < duration - 0.001; t += step) {
    await seek(video, t);
    const result = landmarker.detect(video);
    await new Promise((r) => setTimeout(r, 0));
    const world = result.worldLandmarks[0];
    if (world?.length) {
      frames.push({
        time: t,
        world: copyLm(world),
        image: copyLm(result.landmarks[0]),
      });
    }
    onProgress?.({
      stage: "pose",
      progress: 0.2 + 0.7 * (t / duration),
      detail: `Pose ${frames.length} frames`,
    });
  }
  return frames;
}

async function decodeVideo(file: File, onProgress?: (p: LandmarkerProgress) => void): Promise<HTMLVideoElement> {
  onProgress?.({ stage: "decode", progress: 0.12, detail: "Opening video…" });
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.src = url;
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.crossOrigin = "anonymous";
  await new Promise<void>((resolve, reject) => {
    const ok = () => {
      cleanup();
      resolve();
    };
    const fail = () => {
      cleanup();
      reject(new Error("Could not decode that video."));
    };
    const cleanup = () => {
      video.removeEventListener("loadeddata", ok);
      video.removeEventListener("error", fail);
    };
    video.addEventListener("loadeddata", ok);
    video.addEventListener("error", fail);
    video.load();
  });
  (video as HTMLVideoElement & { _objectUrl?: string })._objectUrl = url;
  return video;
}

export async function reconstructFromVideoFile(
  file: File,
  opts: {
    playerId: string;
    stroke: StrokeType;
    handedness: "left" | "right";
    oneHanded: boolean;
  },
  onProgress?: (p: LandmarkerProgress) => void,
): Promise<{ clip: MotionClip; meta: ReconstructMeta; durationSec: number }> {
  if (!file.type.startsWith("video/") && !/\.(mp4|webm|mov|m4v)$/i.test(file.name)) {
    throw new Error("Choose a video file (mp4, webm, mov).");
  }
  if (file.size > 90 * 1024 * 1024) {
    throw new Error("Video is over 90 MB — trim it to a single swing.");
  }

  const landmarker = await ensureLandmarker(onProgress);
  const video = await decodeVideo(file, onProgress);
  const url = (video as HTMLVideoElement & { _objectUrl?: string })._objectUrl;
  try {
    const frames = await framesBySeek(video, landmarker, onProgress);
    if (frames.length < 4) {
      throw new Error("No person detected. Fill the frame with one swing, brighter light.");
    }
    onProgress?.({ stage: "reconstruct", progress: 0.92, detail: "Building player clip…" });
    const { clip, meta } = reconstructClip(frames, opts);
    onProgress?.({ stage: "reconstruct", progress: 1, detail: "Swing reconstructed" });
    return { clip, meta, durationSec: video.duration || meta.isolatedTo };
  } finally {
    video.pause();
    video.removeAttribute("src");
    video.load();
    if (url) URL.revokeObjectURL(url);
  }
}
