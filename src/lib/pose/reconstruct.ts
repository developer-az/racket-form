import * as THREE from "three";
import type { StrokePhase, StrokeType } from "@/types/biomechanics";
import {
  FOOT_Y,
  HAND_LEN,
  MOTION_JOINTS,
  RACKET_LEN,
  type MotionClip,
  type MotionPhaseMark,
  type QuatTuple,
} from "@/lib/motion/types";
import { createSkeletonPose, type SkeletonPose } from "@/lib/motion/pose";
import { extractLocalQuats } from "@/lib/motion/solve";
import { packWorldPose } from "@/lib/motion/worldJoints";
import {
  BLAZE,
  BLAZE_COUNT,
  hitIsRightSide,
  hitWristIndex,
  usableLandmark,
  type LandmarkXYZ,
  type PoseFrame,
} from "./landmarks";
import { smoothSeries } from "./smooth";

const Y = new THREE.Vector3(0, 1, 0);
const REF_TORSO = 0.3 * 1.85;

export type ReconstructOpts = {
  playerId: string;
  stroke: StrokeType;
  /** Player the clip is geared to (mirroring at playback). */
  handedness: "left" | "right";
  oneHanded: boolean;
  /** Keep the supplied track — used when the swing is already trimmed. */
  skipIsolate?: boolean;
};

export type ReconstructMeta = {
  meanVisibility: number;
  hittingSide: "left" | "right";
  droppedFrames: number;
  isolatedFrom: number;
  isolatedTo: number;
};

function lm(frame: PoseFrame, i: number): LandmarkXYZ | undefined {
  return frame.world[i];
}

/** MediaPipe world → court frame: +X right, +Y up, −Z toward net. */
function toCourt(p: LandmarkXYZ, out = new THREE.Vector3()): THREE.Vector3 {
  return out.set(p.x, -p.y, -p.z);
}

function mid(a: THREE.Vector3, b: THREE.Vector3, out = new THREE.Vector3()): THREE.Vector3 {
  return out.copy(a).add(b).multiplyScalar(0.5);
}

function pick(frame: PoseFrame, i: number, fallback: THREE.Vector3, out: THREE.Vector3): THREE.Vector3 {
  const p = lm(frame, i);
  if (usableLandmark(p)) return toCourt(p!, out);
  return out.copy(fallback);
}

function rotateY(v: THREE.Vector3, c: THREE.Vector3, cos: number, sin: number) {
  const x = v.x - c.x;
  const z = v.z - c.z;
  v.x = c.x + x * cos + z * sin;
  v.z = c.z - x * sin + z * cos;
}

function yawForFacing(shoulderR: THREE.Vector3, hipR: THREE.Vector3, nose: THREE.Vector3, chest: THREE.Vector3): number {
  const across = shoulderR.lengthSq() > 0.002 ? shoulderR : hipR;
  const flat = new THREE.Vector3(across.x, 0, across.z);
  if (flat.lengthSq() < 1e-6) return 0;
  flat.normalize();
  // Rotate so "person-right" lands on +X → they face −Z.
  let yaw = Math.atan2(flat.z, flat.x);
  const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
  const look = new THREE.Vector3(nose.x - chest.x, 0, nose.z - chest.z);
  if (look.lengthSq() > 1e-5 && look.dot(forward) < 0) yaw += Math.PI;
  return yaw;
}

function alignQuatTrack(prev: QuatTuple | undefined, q: QuatTuple): QuatTuple {
  if (!prev) return q;
  if (prev[0] * q[0] + prev[1] * q[1] + prev[2] * q[2] + prev[3] * q[3] < 0) {
    return [-q[0], -q[1], -q[2], -q[3]];
  }
  return q;
}

function smoothFrames(frames: PoseFrame[]): PoseFrame[] {
  if (frames.length < 3) return frames;
  const out = frames.map((f) => ({
    time: f.time,
    world: f.world.map((p) => ({ ...p })),
    image: f.image,
  }));
  for (let i = 0; i < BLAZE_COUNT; i++) {
    const xs = out.map((f) => f.world[i]?.x ?? 0);
    const ys = out.map((f) => f.world[i]?.y ?? 0);
    const zs = out.map((f) => f.world[i]?.z ?? 0);
    const sx = smoothSeries(xs);
    const sy = smoothSeries(ys);
    const sz = smoothSeries(zs);
    for (let f = 0; f < out.length; f++) {
      if (!out[f].world[i]) out[f].world[i] = { x: sx[f], y: sy[f], z: sz[f], visibility: 0 };
      else {
        out[f].world[i].x = sx[f];
        out[f].world[i].y = sy[f];
        out[f].world[i].z = sz[f];
      }
    }
  }
  return out;
}

function wristSpeed(frames: PoseFrame[], idx: number): number[] {
  const speeds = new Array<number>(frames.length).fill(0);
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  for (let i = 1; i < frames.length; i++) {
    const pa = lm(frames[i - 1], idx);
    const pb = lm(frames[i], idx);
    if (!usableLandmark(pa) || !usableLandmark(pb)) continue;
    toCourt(pa!, a);
    toCourt(pb!, b);
    const dt = Math.max(1 / 60, frames[i].time - frames[i - 1].time);
    speeds[i] = a.distanceTo(b) / dt;
  }
  return speeds;
}

function isolateSwing(frames: PoseFrame[], stroke: StrokeType, hitRight: boolean): PoseFrame[] {
  if (frames.length < 8) return frames;
  const idx = hitWristIndex(hitRight);
  const speeds = wristSpeed(frames, idx);
  let peak = 0;
  let peakI = Math.floor(frames.length * 0.65);
  for (let i = 0; i < speeds.length; i++) {
    if (speeds[i] > peak) {
      peak = speeds[i];
      peakI = i;
    }
  }
  // Coaching clips often have several demos. Prefer the first real hit,
  // not a later flourish / high finish that wins on raw wrist speed.
  const thresh = peak * 0.72;
  for (let i = 0; i < speeds.length; i++) {
    if (speeds[i] >= thresh && frames[i].time > 0.2) {
      peakI = i;
      break;
    }
  }
  const span = frames[frames.length - 1].time - frames[0].time;
  if (span <= 2.4) return frames;
  const back = stroke === "serve" ? 1.55 : 1.15;
  const fwd = stroke === "serve" ? 0.55 : 0.55;
  const tPeak = frames[peakI].time;
  return frames.filter((f) => f.time >= tPeak - back && f.time <= tPeak + fwd);
}

function estimatePhases(
  frames: PoseFrame[],
  stroke: StrokeType,
  hitRight: boolean,
): MotionPhaseMark[] {
  const n = frames.length;
  if (n < 2) return [{ phase: "ready", t: 0 }];
  const idx = hitWristIndex(hitRight);
  const speeds = wristSpeed(frames, idx);
  let peakI = Math.floor(n * 0.68);
  let peak = -1;
  for (let i = 0; i < speeds.length; i++) {
    if (speeds[i] > peak) {
      peak = speeds[i];
      peakI = i;
    }
  }
  const tOf = (i: number) => (n <= 1 ? 0 : i / (n - 1));
  const contactT = tOf(peakI);

  if (stroke === "serve") {
    let trophyI = Math.max(0, peakI - 1);
    let bestY = -Infinity;
    const p = new THREE.Vector3();
    for (let i = 0; i < peakI; i++) {
      const w = lm(frames[i], idx);
      if (!usableLandmark(w)) continue;
      toCourt(w!, p);
      if (p.y > bestY) {
        bestY = p.y;
        trophyI = i;
      }
    }
    return [
      { phase: "ready", t: 0 },
      { phase: "trophy", t: tOf(trophyI) },
      { phase: "acceleration", t: Math.min(contactT, tOf(trophyI) + 0.12) },
      { phase: "contact", t: contactT },
      { phase: "followThrough", t: Math.min(1, contactT + 0.12) },
      { phase: "recovery", t: 0.94 },
    ];
  }

  let backI = Math.max(0, Math.floor(peakI * 0.45));
  let bestZ = -Infinity;
  const p = new THREE.Vector3();
  for (let i = 0; i < peakI; i++) {
    const w = lm(frames[i], idx);
    if (!usableLandmark(w)) continue;
    toCourt(w!, p);
    if (p.z > bestZ) {
      bestZ = p.z;
      backI = i;
    }
  }
  const phases: MotionPhaseMark[] = [
    { phase: "ready", t: 0 },
    { phase: "unitTurn", t: Math.min(0.2, tOf(backI) * 0.4) },
    { phase: "backswing", t: tOf(backI) },
    { phase: "acceleration", t: (tOf(backI) + contactT) * 0.5 },
    { phase: "contact", t: contactT },
    { phase: "followThrough", t: Math.min(1, contactT + 0.14) },
    { phase: "recovery", t: 0.94 },
  ];
  return phases;
}

/** One yaw from the ready stance — do not re-face every frame (that killed unit turn). */
function estimateLockedYaw(frames: PoseFrame[]): number {
  const n = Math.max(1, Math.min(12, Math.floor(frames.length * 0.28)));
  let sx = 0;
  let sz = 0;
  let count = 0;
  const shR = new THREE.Vector3();
  const shL = new THREE.Vector3();
  const hipR = new THREE.Vector3();
  const hipL = new THREE.Vector3();
  const nose = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const f = frames[i];
    const a = lm(f, BLAZE.rightShoulder);
    const b = lm(f, BLAZE.leftShoulder);
    if (!usableLandmark(a) || !usableLandmark(b)) continue;
    toCourt(a!, shR);
    toCourt(b!, shL);
    const hr = lm(f, BLAZE.rightHip);
    const hl = lm(f, BLAZE.leftHip);
    if (usableLandmark(hr) && usableLandmark(hl)) {
      toCourt(hr!, hipR);
      toCourt(hl!, hipL);
    } else {
      hipR.copy(shR);
      hipL.copy(shL);
    }
    const ns = lm(f, BLAZE.nose);
    if (usableLandmark(ns)) toCourt(ns!, nose);
    else nose.copy(shR).add(shL).multiplyScalar(0.5);
    const yaw = yawForFacing(shR.clone().sub(shL), hipR.clone().sub(hipL), nose, mid(shL, shR));
    sx += Math.sin(yaw);
    sz += Math.cos(yaw);
    count += 1;
  }
  if (!count) return 0;
  return Math.atan2(sx / count, sz / count);
}

function poseFromFrame(
  frame: PoseFrame,
  prev: SkeletonPose | null,
  hitRight: boolean,
  oneHanded: boolean,
  lockedYaw?: number,
): SkeletonPose {
  const pose = createSkeletonPose();
  const hipL = new THREE.Vector3();
  const hipR = new THREE.Vector3();
  const shL = new THREE.Vector3();
  const shR = new THREE.Vector3();
  const nose = new THREE.Vector3();

  pick(frame, BLAZE.leftHip, prev?.leadHip ?? new THREE.Vector3(-0.1, 0.95, 0), hipL);
  pick(frame, BLAZE.rightHip, prev?.trailHip ?? new THREE.Vector3(0.1, 0.95, 0), hipR);
  pick(frame, BLAZE.leftShoulder, prev?.nonHitShoulder ?? new THREE.Vector3(-0.18, 1.45, 0), shL);
  pick(frame, BLAZE.rightShoulder, prev?.hitShoulder ?? new THREE.Vector3(0.18, 1.45, 0), shR);
  pick(frame, BLAZE.nose, prev?.head ?? new THREE.Vector3(0, 1.7, 0), nose);

  const pelvis = mid(hipL, hipR);
  const chest = mid(shL, shR);
  const yaw =
    lockedYaw ?? yawForFacing(shR.clone().sub(shL), hipR.clone().sub(hipL), nose, chest);
  const cos = Math.cos(-yaw);
  const sin = Math.sin(-yaw);
  const origin = pelvis.clone();

  const pts = [hipL, hipR, shL, shR, nose, chest];
  for (const p of pts) rotateY(p, origin, cos, sin);

  const torso = Math.max(0.12, chest.distanceTo(origin));
  const scale = REF_TORSO / torso;
  for (const p of pts) {
    p.sub(origin).multiplyScalar(scale).add(origin);
  }

  const map = (i: number, fb: THREE.Vector3) => {
    const out = new THREE.Vector3();
    pick(frame, i, fb, out);
    rotateY(out, origin, cos, sin);
    out.sub(origin).multiplyScalar(scale).add(origin);
    return out;
  };

  const kneeL = map(BLAZE.leftKnee, new THREE.Vector3(hipL.x, hipL.y - 0.4, hipL.z));
  const kneeR = map(BLAZE.rightKnee, new THREE.Vector3(hipR.x, hipR.y - 0.4, hipR.z));
  const ankL = map(BLAZE.leftAnkle, new THREE.Vector3(kneeL.x, FOOT_Y, kneeL.z));
  const ankR = map(BLAZE.rightAnkle, new THREE.Vector3(kneeR.x, FOOT_Y, kneeR.z));
  const elbL = map(BLAZE.leftElbow, new THREE.Vector3(shL.x, shL.y - 0.28, shL.z));
  const elbR = map(BLAZE.rightElbow, new THREE.Vector3(shR.x, shR.y - 0.28, shR.z));
  const wrL = map(BLAZE.leftWrist, new THREE.Vector3(elbL.x, elbL.y - 0.24, elbL.z));
  const wrR = map(BLAZE.rightWrist, new THREE.Vector3(elbR.x, elbR.y - 0.24, elbR.z));
  const idxL = map(BLAZE.leftIndex, wrL.clone().add(new THREE.Vector3(-0.04, -0.02, -0.04)));
  const idxR = map(BLAZE.rightIndex, wrR.clone().add(new THREE.Vector3(0.04, -0.02, -0.04)));
  const pkL = map(BLAZE.leftPinky, wrL.clone().add(new THREE.Vector3(-0.05, -0.03, 0)));
  const pkR = map(BLAZE.rightPinky, wrR.clone().add(new THREE.Vector3(0.05, -0.03, 0)));

  const floor = Math.min(ankL.y, ankR.y);
  const lift = FOOT_Y - floor;
  const liftAll = (p: THREE.Vector3) => {
    p.y += lift;
  };
  for (const p of [pelvis, chest, nose, hipL, hipR, kneeL, kneeR, ankL, ankR, shL, shR, elbL, elbR, wrL, wrR, idxL, idxR, pkL, pkR]) {
    liftAll(p);
  }

  const leadIsLeft = hitRight;
  pose.pelvis.copy(pelvis);
  pose.chest.copy(chest);
  pose.head.copy(nose);
  pose.leadHip.copy(leadIsLeft ? hipL : hipR);
  pose.trailHip.copy(leadIsLeft ? hipR : hipL);
  pose.leadKnee.copy(leadIsLeft ? kneeL : kneeR);
  pose.trailKnee.copy(leadIsLeft ? kneeR : kneeL);
  pose.leadAnkle.copy(leadIsLeft ? ankL : ankR);
  pose.trailAnkle.copy(leadIsLeft ? ankR : ankL);
  pose.hitShoulder.copy(hitRight ? shR : shL);
  pose.nonHitShoulder.copy(hitRight ? shL : shR);
  pose.hitElbow.copy(hitRight ? elbR : elbL);
  pose.nonHitElbow.copy(hitRight ? elbL : elbR);
  pose.hitWrist.copy(hitRight ? wrR : wrL);
  pose.nonHitWrist.copy(hitRight ? wrL : wrR);

  const wrist = pose.hitWrist;
  const knuckle = hitRight ? mid(idxR, pkR) : mid(idxL, pkL);
  let shaft = wrist.clone().sub(pose.hitElbow);
  if (shaft.lengthSq() < 1e-5) shaft = knuckle.clone().sub(wrist);
  if (shaft.lengthSq() < 1e-5) shaft.set(0, 0.2, -0.4);
  shaft.normalize();
  if (prev) {
    const prevShaft = prev.racketTip.clone().sub(prev.hitHand);
    if (prevShaft.lengthSq() > 1e-6 && shaft.dot(prevShaft.normalize()) < -0.2) shaft.negate();
  }
  pose.hitHand.copy(wrist).addScaledVector(shaft, HAND_LEN);
  pose.racketTip.copy(pose.hitHand).addScaledVector(shaft, RACKET_LEN);

  if (!oneHanded) {
    const other = pose.nonHitWrist;
    if (other.distanceTo(wrist) > 0.42) {
      other.lerp(wrist, 0.35);
      pose.nonHitHand.copy(other).addScaledVector(shaft, HAND_LEN * 0.4);
    }
  }
  pose.nonHitHand.copy(pose.nonHitWrist).addScaledVector(
    pose.nonHitWrist.clone().sub(pose.nonHitElbow).normalize(),
    HAND_LEN,
  );

  const across = (hitRight ? pkR.clone().sub(idxR) : pkL.clone().sub(idxL));
  const face = new THREE.Vector3().crossVectors(shaft, across);
  if (face.lengthSq() < 1e-6) face.crossVectors(shaft, Y);
  if (face.lengthSq() < 1e-6) face.set(1, 0, 0);
  face.normalize();
  pose.racketFaceNormal.copy(face);

  const fwd = new THREE.Vector3(0, 0, -1);
  pose.leadFootFwd.copy(fwd);
  pose.trailFootFwd.copy(fwd);
  return pose;
}

function meanVisibility(frames: PoseFrame[]): number {
  let acc = 0;
  let n = 0;
  for (const f of frames) {
    for (const p of f.world) {
      if (p) {
        acc += p.visibility ?? 0;
        n += 1;
      }
    }
  }
  return n ? acc / n : 0;
}

function detectHittingSide(frames: PoseFrame[]): "left" | "right" {
  const r = wristSpeed(frames, BLAZE.rightWrist);
  const l = wristSpeed(frames, BLAZE.leftWrist);
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
  return sum(r) >= sum(l) ? "right" : "left";
}

/**
 * World-landmark sequence → local-quat clip.
 *
 * Pipeline (TennisTracker MIT + our armature):
 * 1. Savitzky–Golay on each landmark
 * 2. Isolate the swing around peak hitting-wrist speed
 * 3. One locked yaw (ready stance) so unit turn survives — per-frame facing was the jitter.
 * 4. Scale torso to a 1.85 m ref. Racket along the forearm (MediaPipe has no racket).
 * 5. Pack world joints for TennisTracker-style playback; quats kept as fallback.
 */
export function reconstructClip(
  raw: PoseFrame[],
  opts: ReconstructOpts,
): { clip: MotionClip; meta: ReconstructMeta } {
  const detected = detectHittingSide(raw);
  const expectedRight = hitIsRightSide(opts.handedness, opts.stroke);
  const hitRight = expectedRight;
  const smoothed = smoothFrames(raw.filter((f) => f.world.length >= 24));
  if (smoothed.length < 2) {
    throw new Error("No usable pose frames — try a closer, better-lit swing video.");
  }
  const isolated = opts.skipIsolate ? smoothed : isolateSwing(smoothed, opts.stroke, hitRight);
  const frames = isolated.length >= 4 ? isolated : smoothed;
  const lockedYaw = estimateLockedYaw(frames);

  const roots: number[] = [];
  const quats: number[] = [];
  const world: number[] = [];
  let prevPose: SkeletonPose | null = null;
  let prevQuats: Record<string, QuatTuple> | null = null;

  for (const frame of frames) {
    const pose = poseFromFrame(frame, prevPose, hitRight, opts.oneHanded, lockedYaw);
    const local = extractLocalQuats(pose);
    if (prevQuats) {
      for (const id of MOTION_JOINTS) {
        local[id] = alignQuatTrack(prevQuats[id], local[id]);
      }
    }
    roots.push(pose.pelvis.x, pose.pelvis.y, pose.pelvis.z);
    for (const id of MOTION_JOINTS) {
      const q = local[id];
      quats.push(q[0], q[1], q[2], q[3]);
    }
    packWorldPose(pose, world);
    prevPose = pose;
    prevQuats = local;
  }

  const clip: MotionClip = {
    id: `${opts.playerId}/${opts.stroke}`,
    playerId: opts.playerId,
    stroke: opts.stroke,
    oneHanded: opts.oneHanded,
    authoredHand: opts.handedness,
    frameCount: frames.length,
    root: roots,
    quats,
    world,
    phases: estimatePhases(frames, opts.stroke, hitRight),
  };

  return {
    clip,
    meta: {
      meanVisibility: meanVisibility(frames),
      hittingSide: detected,
      droppedFrames: raw.length - frames.length,
      isolatedFrom: frames[0]?.time ?? 0,
      isolatedTo: frames[frames.length - 1]?.time ?? 0,
    },
  };
}

export function phaseAt(marks: MotionPhaseMark[], t: number): StrokePhase {
  if (!marks.length) return "ready";
  let best = marks[0];
  for (const m of marks) {
    if (m.t <= t + 1e-6) best = m;
  }
  return best.phase;
}
