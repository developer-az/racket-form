import * as THREE from "three";
import type { Anthropometrics } from "../../types/biomechanics";
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
    for (const id of POS_KEYS) pose[id].y += extra;
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

function setLen(from: THREE.Vector3, to: THREE.Vector3, len: number) {
  const dir = to.clone().sub(from);
  if (dir.lengthSq() < 1e-8) return;
  to.copy(from).addScaledVector(dir.normalize(), len);
}

/**
 * Keep reconstructed directions; fit athlete bone lengths.
 * Whole-body floor snap — no per-leg IK (that collapsed the plant).
 */
export function retargetWorldPose(pose: SkeletonPose, anthro: Anthropometrics): SkeletonPose {
  const s = anthro.heightM / REF_HEIGHT;
  const origin = pose.pelvis.clone();
  for (const id of POS_KEYS) {
    const p = pose[id];
    p.sub(origin).multiplyScalar(s).add(origin);
  }

  const thigh = anthro.thighRatio * anthro.heightM;
  const shank = anthro.shankRatio * anthro.heightM;
  const upper = anthro.upperArmRatio * anthro.heightM;
  const fore = anthro.forearmRatio * anthro.heightM;
  const hand = HAND_LEN * (anthro.heightM / REF_HEIGHT);
  const torso = anthro.torsoRatio * anthro.heightM;
  const neck = 0.13 * anthro.heightM;

  setLen(pose.pelvis, pose.chest, torso);
  setLen(pose.chest, pose.head, neck);
  setLen(pose.leadHip, pose.leadKnee, thigh);
  setLen(pose.leadKnee, pose.leadAnkle, shank);
  setLen(pose.trailHip, pose.trailKnee, thigh);
  setLen(pose.trailKnee, pose.trailAnkle, shank);
  setLen(pose.hitShoulder, pose.hitElbow, upper);
  setLen(pose.hitElbow, pose.hitWrist, fore);
  setLen(pose.nonHitShoulder, pose.nonHitElbow, upper);
  setLen(pose.nonHitElbow, pose.nonHitWrist, fore);

  const shaft = pose.hitWrist.clone().sub(pose.hitElbow);
  if (shaft.lengthSq() < 1e-6) shaft.copy(pose.racketTip).sub(pose.hitWrist);
  if (shaft.lengthSq() < 1e-6) shaft.set(0, 0.2, -0.4);
  shaft.normalize();
  pose.hitHand.copy(pose.hitWrist).addScaledVector(shaft, hand);
  pose.racketTip.copy(pose.hitHand).addScaledVector(shaft, RACKET_LEN);

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
  face.addScaledVector(shaft, -face.dot(shaft));
  if (face.lengthSq() < 1e-8) face.crossVectors(shaft, new THREE.Vector3(0, 1, 0));
  if (face.lengthSq() < 1e-8) face.set(1, 0, 0);
  face.normalize();

  return pose;
}
