import * as THREE from "three";
import type { Anthropometrics, StrokeType } from "../../types/biomechanics";
import { savitzkyGolay } from "../pose/smooth";
import { FOOT_Y, HAND_LEN, RACKET_LEN, REF_HEIGHT, type Vec3Tuple } from "./types";
import type { SkeletonPose } from "./pose";

/**
 * World-space joints packed on the clip (TennisTracker-style).
 * Playback lerps these directly — no Euler/quat retarget.
 */
export const WORLD_JOINTS = [
  "pelvis",
  "chest",
  "head",
  "leadHip",
  "leadKnee",
  "leadAnkle",
  "trailHip",
  "trailKnee",
  "trailAnkle",
  "hitShoulder",
  "hitElbow",
  "hitWrist",
  "hitHand",
  "racketTip",
  "nonHitShoulder",
  "nonHitElbow",
  "nonHitWrist",
  "nonHitHand",
  "racketFaceNormal",
] as const;

export type WorldJointId = (typeof WORLD_JOINTS)[number];

export type WorldSample = Record<WorldJointId, Vec3Tuple>;

const POS_KEYS = WORLD_JOINTS.filter((id) => id !== "racketFaceNormal") as Exclude<
  WorldJointId,
  "racketFaceNormal"
>[];

export function emptyWorldSample(): WorldSample {
  const out = {} as WorldSample;
  for (const id of WORLD_JOINTS) out[id] = [0, 0, 0];
  return out;
}

export function packWorldPose(pose: SkeletonPose, out: number[]): void {
  for (const id of WORLD_JOINTS) {
    const v = pose[id] as THREE.Vector3;
    out.push(v.x, v.y, v.z);
  }
}

export function readWorldJoint(packed: number[], frame: number, jointIndex: number): Vec3Tuple {
  const o = (frame * WORLD_JOINTS.length + jointIndex) * 3;
  return [packed[o] ?? 0, packed[o + 1] ?? 0, packed[o + 2] ?? 0];
}

export function lerpWorldSample(a: WorldSample, b: WorldSample, t: number, out: WorldSample): WorldSample {
  for (const id of WORLD_JOINTS) {
    const pa = a[id];
    const pb = b[id];
    out[id] = [
      pa[0] + (pb[0] - pa[0]) * t,
      pa[1] + (pb[1] - pa[1]) * t,
      pa[2] + (pb[2] - pa[2]) * t,
    ];
  }
  return out;
}

function write(pose: SkeletonPose, id: WorldJointId, v: Vec3Tuple) {
  (pose[id] as THREE.Vector3).set(v[0], v[1], v[2]);
}

/** Copy packed world joints onto the armature. */
export function applyWorldSample(sample: WorldSample, pose: SkeletonPose): SkeletonPose {
  for (const id of WORLD_JOINTS) write(pose, id, sample[id]);
  return pose;
}

export function mirrorWorldSample(sample: WorldSample): WorldSample {
  const out = emptyWorldSample();
  for (const id of WORLD_JOINTS) {
    const v = sample[id];
    out[id] = [-v[0], v[1], v[2]];
  }
  return out;
}

function stabilizeStance(pose: SkeletonPose, heightM: number) {
  const floor = Math.min(pose.leadAnkle.y, pose.trailAnkle.y);
  const lift = FOOT_Y - floor;
  for (const id of POS_KEYS) pose[id].y += lift;
  pose.leadAnkle.y = Math.max(pose.leadAnkle.y, FOOT_Y);
  pose.trailAnkle.y = Math.max(pose.trailAnkle.y, FOOT_Y);

  const minPelvis = 0.78 * (heightM / REF_HEIGHT);
  if (pose.pelvis.y < minPelvis) {
    const extra = minPelvis - pose.pelvis.y;
    for (const id of POS_KEYS) {
      if (id === "leadAnkle" || id === "trailAnkle") continue;
      pose[id].y += extra;
    }
  }

  const repairLeg = (hip: THREE.Vector3, knee: THREE.Vector3, ankle: THREE.Vector3) => {
    ankle.y = Math.max(ankle.y, FOOT_Y);
    if (knee.y >= ankle.y + 0.12 && hip.y >= knee.y + 0.12) return;
    const mid = hip.clone().lerp(ankle, 0.52);
    mid.y = Math.max(mid.y, ankle.y + 0.18);
    mid.z += 0.04;
    knee.copy(mid);
  };
  repairLeg(pose.leadHip, pose.leadKnee, pose.leadAnkle);
  repairLeg(pose.trailHip, pose.trailKnee, pose.trailAnkle);
}

function setLen(from: THREE.Vector3, to: THREE.Vector3, len: number, fallback: THREE.Vector3) {
  const dir = to.clone().sub(from);
  if (dir.lengthSq() < 1e-6) dir.copy(fallback);
  else dir.normalize();
  to.copy(from).addScaledVector(dir, len);
}

function repairArm(shoulder: THREE.Vector3, elbow: THREE.Vector3, wrist: THREE.Vector3, upper: number, fore: number) {
  if (shoulder.distanceTo(wrist) < 0.22) {
    const away = wrist.clone().sub(shoulder);
    if (away.lengthSq() < 1e-6) away.set(0, -0.12, -0.28);
    wrist.copy(shoulder).addScaledVector(away.normalize(), 0.3);
  }
  const mid = shoulder.clone().lerp(wrist, upper / Math.max(0.12, upper + fore));
  if (elbow.distanceTo(shoulder) < 0.08 || elbow.distanceTo(wrist) < 0.08 || elbow.y < wrist.y - 0.35) {
    mid.y = Math.max(mid.y, Math.min(shoulder.y, wrist.y) - 0.04);
    elbow.copy(mid);
  }
}

/** Front-view MediaPipe Z is camera depth — squash it so the swing stays in the picture plane. */
function flattenSwingDepth(pose: SkeletonPose) {
  const z0 = pose.chest.z;
  const damp = (p: THREE.Vector3, amount: number) => {
    p.z = p.z * (1 - amount) + z0 * amount;
  };
  damp(pose.hitShoulder, 0.25);
  damp(pose.nonHitShoulder, 0.25);
  damp(pose.hitElbow, 0.45);
  damp(pose.nonHitElbow, 0.45);
  damp(pose.hitWrist, 0.55);
  damp(pose.nonHitWrist, 0.55);
  damp(pose.hitHand, 0.55);
  damp(pose.nonHitHand, 0.55);
  damp(pose.racketTip, 0.6);
}

function shapeRacket(pose: SkeletonPose, stroke: StrokeType) {
  const shaft = pose.hitWrist.clone().sub(pose.hitElbow);
  if (shaft.lengthSq() < 1e-5) shaft.copy(pose.racketTip).sub(pose.hitWrist);
  if (shaft.lengthSq() < 1e-5) shaft.set(0, 0.35, -0.2);
  shaft.normalize();

  const overhead =
    stroke === "serve" &&
    (pose.hitWrist.y > pose.chest.y + 0.04 || pose.nonHitWrist.y > pose.head.y - 0.18);

  if (stroke === "serve") {
    if (overhead || pose.hitWrist.y > pose.head.y - 0.22) {
      shaft.lerp(new THREE.Vector3(0, 1, -0.12), 0.5);
    } else if (shaft.y < -0.18) {
      shaft.y = -0.18;
    }
  } else if (shaft.y < -0.1) {
    shaft.y = -0.1;
  }
  if (shaft.lengthSq() < 1e-8) shaft.set(0, 0.4, -0.2);
  shaft.normalize();

  pose.hitHand.copy(pose.hitWrist).addScaledVector(shaft, HAND_LEN);
  pose.racketTip.copy(pose.hitHand).addScaledVector(shaft, RACKET_LEN);

  const minTip = stroke === "serve" && !overhead ? 0.28 : 0.4;
  if (pose.racketTip.y < minTip) {
    pose.racketTip.y = minTip;
    const lifted = pose.racketTip.clone().sub(pose.hitHand);
    if (lifted.lengthSq() > 1e-8) {
      lifted.normalize();
      pose.racketTip.copy(pose.hitHand).addScaledVector(lifted, RACKET_LEN);
      if (pose.racketTip.y < minTip) pose.racketTip.y = minTip;
    }
  }
}

/** Savitzky–Golay each packed world channel so playback does not chatter. */
export function smoothPackedWorld(world: number[], frameCount: number): number[] {
  const stride = WORLD_JOINTS.length * 3;
  if (frameCount < 5 || world.length < stride * 2) return world;
  const out = world.slice();
  for (let c = 0; c < stride; c++) {
    const series = new Array<number>(frameCount);
    for (let f = 0; f < frameCount; f++) series[f] = world[f * stride + c] ?? 0;
    const smoothed = savitzkyGolay(series);
    for (let f = 0; f < frameCount; f++) out[f * stride + c] = smoothed[f];
  }
  return out;
}

/**
 * Keep reconstructed directions; fit athlete bone lengths.
 * Whole-body floor snap — no per-leg IK (that collapsed the plant).
 * Front-view depth is flattened so the swing reads in the picture plane.
 */
export function retargetWorldPose(
  pose: SkeletonPose,
  anthro: Anthropometrics,
  stroke: StrokeType = "forehand",
): SkeletonPose {
  const s = anthro.heightM / REF_HEIGHT;
  const origin = pose.pelvis.clone();
  for (const id of POS_KEYS) {
    const p = pose[id];
    p.sub(origin).multiplyScalar(s).add(origin);
  }

  flattenSwingDepth(pose);

  const thigh = anthro.thighRatio * anthro.heightM;
  const shank = anthro.shankRatio * anthro.heightM;
  const upper = anthro.upperArmRatio * anthro.heightM;
  const fore = anthro.forearmRatio * anthro.heightM;
  const hand = HAND_LEN * (anthro.heightM / REF_HEIGHT);
  const torso = anthro.torsoRatio * anthro.heightM;
  const neck = 0.13 * anthro.heightM;
  const down = new THREE.Vector3(0, -1, 0);
  const up = new THREE.Vector3(0, 1, 0);

  setLen(pose.pelvis, pose.chest, torso, up);
  setLen(pose.chest, pose.head, neck, up);
  setLen(pose.leadHip, pose.leadKnee, thigh, down);
  setLen(pose.leadKnee, pose.leadAnkle, shank, down);
  setLen(pose.trailHip, pose.trailKnee, thigh, down);
  setLen(pose.trailKnee, pose.trailAnkle, shank, down);

  const minSpan = 0.3 * (anthro.heightM / REF_HEIGHT);
  const acrossSh = pose.hitShoulder.clone().sub(pose.nonHitShoulder);
  if (acrossSh.length() < minSpan) {
    const dir = acrossSh.lengthSq() < 1e-6 ? new THREE.Vector3(1, 0, 0) : acrossSh.normalize();
    pose.hitShoulder.copy(pose.chest).addScaledVector(dir, minSpan * 0.5);
    pose.nonHitShoulder.copy(pose.chest).addScaledVector(dir, -minSpan * 0.5);
  }

  repairArm(pose.hitShoulder, pose.hitElbow, pose.hitWrist, upper, fore);
  repairArm(pose.nonHitShoulder, pose.nonHitElbow, pose.nonHitWrist, upper, fore);
  setLen(pose.hitShoulder, pose.hitElbow, upper, down);
  setLen(pose.hitElbow, pose.hitWrist, fore, down);
  setLen(pose.nonHitShoulder, pose.nonHitElbow, upper, down);
  setLen(pose.nonHitElbow, pose.nonHitWrist, fore, down);

  shapeRacket(pose, stroke);

  const other = pose.nonHitWrist.clone().sub(pose.nonHitElbow);
  if (other.lengthSq() > 1e-8) {
    pose.nonHitHand.copy(pose.nonHitWrist).addScaledVector(other.normalize(), hand);
  }

  stabilizeStance(pose, anthro.heightM);

  const across = pose.trailHip.clone().sub(pose.leadHip);
  across.y = 0;
  const fwd = new THREE.Vector3(-across.z, 0, across.x);
  if (fwd.lengthSq() < 1e-8) fwd.set(0, 0, -1);
  else fwd.normalize();
  if (fwd.z > 0) fwd.negate();
  pose.leadFootFwd.copy(fwd);
  pose.trailFootFwd.copy(fwd);

  const face = pose.racketFaceNormal;
  const shaft = pose.racketTip.clone().sub(pose.hitHand);
  if (shaft.lengthSq() > 1e-8) shaft.normalize();
  else shaft.set(0, 1, 0);
  face.addScaledVector(shaft, -face.dot(shaft));
  if (face.lengthSq() < 1e-8) face.crossVectors(shaft, new THREE.Vector3(0, 1, 0));
  if (face.lengthSq() < 1e-8) face.set(1, 0, 0);
  face.normalize();

  return pose;
}
