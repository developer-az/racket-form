import * as THREE from "three";
import type { Anthropometrics, StrokeProfile } from "@/types/biomechanics";
import { ARCHETYPES, archetypeFor, type MotionKey, type V3 } from "./archetypes";

/**
 * Samples a stroke's motion targets and solves them into a skeleton.
 *
 * Pipeline per frame:
 *   1. Map archetype keys onto this stroke's phase timings, styled by its metrics
 *   2. Cubic Hermite interpolation of every channel (periodic — the stroke loops)
 *   3. Pelvis / trunk from yaw, lean, tilt; legs by two-bone IK to planted feet
 *   4. Arms by two-bone IK to the hand targets with an elbow pole
 *   5. Racket owned by the gripping hand; off hand optionally on the throat/grip
 *   6. Left-handers are a sagittal mirror of the solved right-handed pose
 */

const REF_HEIGHT = 1.85;
/** ITF max is 0.737 m; tour frames are 0.685 m. */
export const RACKET_LENGTH = 0.685;
/** Grip centre sits ~6 cm above the butt cap. */
const GRIP_FROM_BUTT = 0.06;
/** String-bed centre from the gripping hand. */
export const HEAD_CENTER_FROM_HAND = RACKET_LENGTH - GRIP_FROM_BUTT - 0.16;
const ANKLE_HEIGHT = 0.075;

// ---------------------------------------------------------------------------
// Channel packing
// ---------------------------------------------------------------------------

const CH = {
  pelvis: 0,
  pelvisYaw: 3,
  trunkYaw: 4,
  lean: 5,
  tilt: 6,
  leftFoot: 7,
  rightFoot: 10,
  hand: 13,
  shaft: 16,
  face: 19,
  elbowPole: 22,
  offHand: 25,
  offPole: 28,
  offGrip: 31,
  offGripAt: 32,
} as const;
const N_CH = 33;

function pack(k: MotionKey): Float64Array {
  const a = new Float64Array(N_CH);
  const put3 = (at: number, v: V3) => {
    a[at] = v[0];
    a[at + 1] = v[1];
    a[at + 2] = v[2];
  };
  put3(CH.pelvis, k.pelvis);
  a[CH.pelvisYaw] = k.pelvisYaw;
  a[CH.trunkYaw] = k.trunkYaw;
  a[CH.lean] = k.lean;
  a[CH.tilt] = k.tilt;
  put3(CH.leftFoot, k.leftFoot);
  put3(CH.rightFoot, k.rightFoot);
  put3(CH.hand, k.hand);
  put3(CH.shaft, norm3(k.shaft));
  put3(CH.face, norm3(k.face));
  put3(CH.elbowPole, norm3(k.elbowPole));
  put3(CH.offHand, k.offHand);
  put3(CH.offPole, norm3(k.offPole));
  a[CH.offGrip] = k.offGrip;
  a[CH.offGripAt] = k.offGripAt;
  return a;
}

function norm3(v: V3): V3 {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

// ---------------------------------------------------------------------------
// Styling from published stroke metrics
// ---------------------------------------------------------------------------

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function lerp3(a: V3, b: V3, t: number): V3 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function add3(a: V3, d: V3): V3 {
  return [a[0] + d[0], a[1] + d[1], a[2] + d[2]];
}

/**
 * Per-athlete shaping. Kept deliberately small — the archetype carries the
 * stroke; metrics only move what they measure:
 *   contact height → hand height at contact (string-bed centre on the target)
 *   contact depth  → how far in front the hand meets the ball
 *   X-factor       → trunk–pelvis separation at the top of the backswing
 *   swing path + grip (FH) → loop height, slot depth, wiper vs wrap finish
 */
function styleKeys(keys: MotionKey[], stroke: StrokeProfile, scale: number): MotionKey[] {
  const m = stroke.metrics;
  const out = keys.map((k) => ({ ...k }));
  const isServe = stroke.type === "serve";

  const contactIdx = out.findIndex((k) => k.phase === "contact" && !k.u);
  if (contactIdx >= 0) {
    const c = out[contactIdx];
    const shaft = norm3(c.shaft);
    const headY = c.hand[1] + shaft[1] * HEAD_CENTER_FROM_HAND;
    const target = m.contactHeightM / scale;
    const dy = clamp(target - headY, isServe ? -0.3 : -0.28, isServe ? 0.12 : 0.3);
    const depth = isServe ? 0 : clamp((m.contactDepthM - 0.45) * 0.5, -0.1, 0.1);
    c.hand = add3(c.hand, [0, dy, depth]);
    for (const n of [contactIdx - 1, contactIdx + 1]) {
      const k = out[n];
      if (k && k.phase !== "ready" && k.phase !== "recovery") {
        k.hand = add3(k.hand, [0, dy * 0.45, depth * 0.5]);
      }
    }
  }

  const xFactor = clamp(m.kineticChain.xFactorDeg, 20, 60);
  for (const k of out) {
    if (k.phase === "backswing" && !k.u && stroke.type !== "serve") {
      const dir = Math.sign(k.trunkYaw) || 1;
      k.trunkYaw = k.pelvisYaw + dir * xFactor * 1.05;
    }
  }

  if (stroke.type === "forehand") {
    const grip = m.grip === "western" ? 0.55 : m.grip === "semiWestern" ? 0.2 : 0;
    const loop = clamp((m.swingPathDeg - 28) / 16 + grip, -0.4, 1.2);
    const wiper = clamp(loop, 0, 1);
    for (const k of out) {
      if (k.phase === "backswing" && !k.u) {
        k.hand = add3(k.hand, [-0.03 * loop, 0.08 * loop, 0.03 * loop]);
        k.shaft = lerp3(k.shaft, [0.05, 0.95, -0.3], clamp(loop, 0, 1) * 0.6);
      } else if (k.phase === "backswing" && k.u) {
        k.hand = add3(k.hand, [0, -0.07 * loop, 0]);
        k.shaft = lerp3(k.shaft, [0.05, -0.85, -0.5], clamp(loop, 0, 1) * 0.5);
      } else if (k.phase === "acceleration") {
        k.hand = add3(k.hand, [0, -0.05 * loop, 0]);
      } else if (k.phase === "contact") {
        // Steeper low-to-high path: face slightly more closed, tip below the wrist less
        k.face = lerp3(k.face, [-0.1, -0.2, 0.97], clamp(loop, 0, 1) * 0.5);
      } else if (k.phase === "followThrough") {
        // Windshield-wiper: racket finishes beside the non-hitting hip, tip up
        k.hand = lerp3(k.hand, [-0.4, 1.12, 0.32], wiper);
        k.shaft = lerp3(k.shaft, [-0.35, 0.65, -0.65], wiper);
        k.face = lerp3(k.face, [-0.85, -0.45, 0.2], wiper);
        k.elbowPole = lerp3(k.elbowPole, [0.4, -0.6, 0.6], wiper);
      }
    }
  }

  return out;
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export interface StrokeMotion {
  times: number[];
  values: Float64Array[];
  tangents: Float64Array[];
  contactT: number;
  /** Normalized time the serve toss leaves the hand (serve only). */
  tossT: number;
  scale: number;
}

const cache = new WeakMap<StrokeProfile, Map<number, StrokeMotion>>();

export function getStrokeMotion(stroke: StrokeProfile, heightM: number): StrokeMotion {
  let byHeight = cache.get(stroke);
  if (!byHeight) {
    byHeight = new Map();
    cache.set(stroke, byHeight);
  }
  const hit = byHeight.get(heightM);
  if (hit) return hit;
  const built = buildMotion(stroke, heightM);
  byHeight.set(heightM, built);
  return built;
}

function buildMotion(stroke: StrokeProfile, heightM: number): StrokeMotion {
  const scale = heightM / REF_HEIGHT;
  const frames = stroke.keyframes;
  const phaseT = (phase: string, u = 0): number | null => {
    const i = frames.findIndex((f) => f.phase === phase);
    if (i < 0) return null;
    const t0 = frames[i].t;
    const t1 = i + 1 < frames.length ? frames[i + 1].t : 1;
    return t0 + (t1 - t0) * u;
  };

  const styled = styleKeys(ARCHETYPES[archetypeFor(stroke)], stroke, scale);
  const timed: { t: number; v: Float64Array }[] = [];
  for (const k of styled) {
    const t = k.phase === "recovery" ? 1 : k.phase === "ready" ? 0 : phaseT(k.phase, k.u ?? 0);
    if (t == null) continue;
    timed.push({ t, v: pack(k) });
  }
  timed.sort((a, b) => a.t - b.t);
  if (timed[0].t > 0) timed.unshift({ t: 0, v: timed[timed.length - 1].v });
  if (timed[timed.length - 1].t < 1) timed.push({ t: 1, v: timed[0].v });

  const times = timed.map((k) => k.t);
  const values = timed.map((k) => k.v);
  const n = times.length;
  const tangents: Float64Array[] = [];
  for (let i = 0; i < n; i++) {
    // Periodic: index 0 and n-1 are the same instant of the loop
    const prevI = i === 0 ? n - 2 : i - 1;
    const nextI = i === n - 1 ? 1 : i + 1;
    const tPrev = i === 0 ? times[n - 2] - 1 : times[prevI];
    const tNext = i === n - 1 ? times[1] + 1 : times[nextI];
    const dt = Math.max(1e-4, tNext - tPrev);
    const tan = new Float64Array(N_CH);
    for (let c = 0; c < N_CH; c++) {
      // Monotone-ish: zero the tangent at local extrema so poses don't overshoot keys
      const a = values[prevI][c];
      const b = values[i][c];
      const d = values[nextI][c];
      tan[c] = (b - a) * (d - b) <= 0 ? 0 : (d - a) / dt;
    }
    tangents.push(tan);
  }

  return {
    times,
    values,
    tangents,
    contactT: phaseT("contact") ?? 0.6,
    tossT: phaseT("unitTurn", 0.55) ?? 0.25,
    scale,
  };
}

/** Interpolated channel vector for normalized time t (wraps). */
export function sampleMotion(motion: StrokeMotion, t: number, out: Float64Array = new Float64Array(N_CH)) {
  const x = ((t % 1) + 1) % 1;
  const { times, values, tangents } = motion;
  let i = 0;
  while (i < times.length - 2 && times[i + 1] <= x) i++;
  const t0 = times[i];
  const t1 = times[i + 1];
  const h = Math.max(1e-6, t1 - t0);
  const s = Math.max(0, Math.min(1, (x - t0) / h));
  const s2 = s * s;
  const s3 = s2 * s;
  const h00 = 2 * s3 - 3 * s2 + 1;
  const h10 = s3 - 2 * s2 + s;
  const h01 = -2 * s3 + 3 * s2;
  const h11 = s3 - s2;
  const a = values[i];
  const b = values[i + 1];
  const ma = tangents[i];
  const mb = tangents[i + 1];
  for (let c = 0; c < N_CH; c++) {
    out[c] = h00 * a[c] + h10 * h * ma[c] + h01 * b[c] + h11 * h * mb[c];
  }
  return out;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export interface SkeletonPose {
  pelvis: THREE.Vector3;
  chest: THREE.Vector3;
  head: THREE.Vector3;
  /** Non-hitting-side leg ("lead" for a forehand). */
  leadHip: THREE.Vector3;
  leadKnee: THREE.Vector3;
  leadAnkle: THREE.Vector3;
  trailHip: THREE.Vector3;
  trailKnee: THREE.Vector3;
  trailAnkle: THREE.Vector3;
  leadFootFwd: THREE.Vector3;
  trailFootFwd: THREE.Vector3;
  hitShoulder: THREE.Vector3;
  hitElbow: THREE.Vector3;
  hitWrist: THREE.Vector3;
  hitHand: THREE.Vector3;
  nonHitShoulder: THREE.Vector3;
  nonHitElbow: THREE.Vector3;
  nonHitWrist: THREE.Vector3;
  nonHitHand: THREE.Vector3;
  racketButt: THREE.Vector3;
  racketTip: THREE.Vector3;
  racketHeadCenter: THREE.Vector3;
  /** Unit shaft direction butt → tip. */
  racketShaft: THREE.Vector3;
  /** Unit string-bed normal on the hitting side, orthogonal to the shaft. */
  racketFaceNormal: THREE.Vector3;
  /** Measured from the solved skeleton (degrees). */
  measured: MeasuredAngles;
}

export interface MeasuredAngles {
  /** 0 = straight arm. */
  elbowFlexion: number;
  /** Front (net-side) knee, 0 = straight. */
  frontKneeFlexion: number;
  /** Shoulder-line rotation from parallel-to-baseline, signed (− = hitting side back). */
  trunkRotation: number;
  pelvisRotation: number;
  /** Trunk minus pelvis — the X-factor. */
  separation: number;
  /** Humerus elevation from the trunk's down axis (0 = arm at side). */
  armElevation: number;
}

export function createSkeletonPose(): SkeletonPose {
  const v = () => new THREE.Vector3();
  return {
    pelvis: v(),
    chest: v(),
    head: v(),
    leadHip: v(),
    leadKnee: v(),
    leadAnkle: v(),
    trailHip: v(),
    trailKnee: v(),
    trailAnkle: v(),
    leadFootFwd: new THREE.Vector3(0, 0, -1),
    trailFootFwd: new THREE.Vector3(0, 0, -1),
    hitShoulder: v(),
    hitElbow: v(),
    hitWrist: v(),
    hitHand: v(),
    nonHitShoulder: v(),
    nonHitElbow: v(),
    nonHitWrist: v(),
    nonHitHand: v(),
    racketButt: v(),
    racketTip: v(),
    racketHeadCenter: v(),
    racketShaft: new THREE.Vector3(0, 1, 0),
    racketFaceNormal: new THREE.Vector3(0, 0, -1),
    measured: {
      elbowFlexion: 0,
      frontKneeFlexion: 0,
      trunkRotation: 0,
      pelvisRotation: 0,
      separation: 0,
      armElevation: 0,
    },
  };
}

const _ch = new Float64Array(N_CH);
const _qPelvis = new THREE.Quaternion();
const _qTrunk = new THREE.Quaternion();
const _qTmp = new THREE.Quaternion();
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _c = new THREE.Vector3();
const _d = new THREE.Vector3();
const _pole = new THREE.Vector3();
const _hand = new THREE.Vector3();
const _off = new THREE.Vector3();
const _hd = new THREE.Vector3();
const _od = new THREE.Vector3();
const X = new THREE.Vector3(1, 0, 0);
const Y = new THREE.Vector3(0, 1, 0);
const Z = new THREE.Vector3(0, 0, 1);
const DEG = Math.PI / 180;

/** Authored [right, up, forward] → scene-local (x, y, z) with −z toward the net. */
function setLocal(out: THREE.Vector3, ch: Float64Array, at: number, scale = 1) {
  return out.set(ch[at] * scale, ch[at + 1] * scale, -ch[at + 2] * scale);
}

/**
 * Two-bone IK: places `mid` so |root−mid| = a and |mid−end| = b, bending toward `pole`.
 * If the target is out of reach, `end` is pulled in along the root→end line.
 */
function twoBone(
  root: THREE.Vector3,
  end: THREE.Vector3,
  a: number,
  b: number,
  pole: THREE.Vector3,
  mid: THREE.Vector3,
): void {
  _a.subVectors(end, root);
  let dist = _a.length();
  if (dist < 1e-6) {
    _a.set(0, -1, 0);
    dist = 1e-6;
  } else {
    _a.divideScalar(dist);
  }
  const maxR = (a + b) * 0.999;
  // Joint limit: elbow / knee flexion tops out near 145° in vivo
  const minR = Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(35 * DEG));
  const d = clamp(dist, minR, maxR);
  if (d !== dist) end.copy(root).addScaledVector(_a, d);
  // `end` may be the caller's target vector — callers re-derive dependents from it
  const cosA = (a * a + d * d - b * b) / (2 * a * d);
  const along = a * cosA;
  const rise = Math.sqrt(Math.max(0, a * a - along * along));
  _b.copy(pole).addScaledVector(_a, -pole.dot(_a));
  if (_b.lengthSq() < 1e-8) {
    _b.set(0, -1, 0).addScaledVector(_a, _a.y);
    if (_b.lengthSq() < 1e-8) _b.set(1, 0, 0);
  }
  _b.normalize();
  mid.copy(root).addScaledVector(_a, along).addScaledVector(_b, rise);
}

function angleDeg(a: THREE.Vector3, b: THREE.Vector3): number {
  const l = a.length() * b.length();
  if (l < 1e-9) return 0;
  return Math.acos(clamp(a.dot(b) / l, -1, 1)) / DEG;
}

function mirrorX(v: THREE.Vector3) {
  v.x = -v.x;
}

export function solveStrokePose(
  out: SkeletonPose,
  stroke: StrokeProfile,
  anthro: Anthropometrics,
  t: number,
): SkeletonPose {
  const motion = getStrokeMotion(stroke, anthro.heightM);
  const ch = sampleMotion(motion, t, _ch);
  return solveChannels(out, ch, anthro, motion.scale, stroke.handedness, !stroke.oneHanded);
}

function solveChannels(
  out: SkeletonPose,
  ch: Float64Array,
  anthro: Anthropometrics,
  s: number,
  handedness: "right" | "left",
  twoHanded: boolean,
): SkeletonPose {
  const H = anthro.heightM;
  const torsoLen = H * anthro.torsoRatio;
  const upperArm = H * anthro.upperArmRatio;
  const forearm = H * anthro.forearmRatio;
  const thigh = H * anthro.thighRatio;
  const shank = H * anthro.shankRatio;
  const handLen = 0.07 * s;
  const hipHalf = 0.09 * s;
  const shoulderHalf = 0.2 * s;

  const pelvisYaw = ch[CH.pelvisYaw] * DEG;
  const trunkYaw = ch[CH.trunkYaw] * DEG;

  // --- Pelvis + feet ---------------------------------------------------------
  setLocal(out.pelvis, ch, CH.pelvis, s);
  _qPelvis.setFromAxisAngle(Y, pelvisYaw);
  _c.copy(X).applyQuaternion(_qPelvis); // pelvis right axis

  // Feet: [right, forward, lift]; left foot = non-hitting ("lead") side for a righty
  out.leadAnkle.set(ch[CH.leftFoot] * s, ANKLE_HEIGHT * s + ch[CH.leftFoot + 2] * s, -ch[CH.leftFoot + 1] * s);
  out.trailAnkle.set(ch[CH.rightFoot] * s, ANKLE_HEIGHT * s + ch[CH.rightFoot + 2] * s, -ch[CH.rightFoot + 1] * s);

  // Lower the pelvis if a planted leg can't reach (keeps feet on the court)
  const legMax = (thigh + shank) * 0.995;
  for (const [ankle, side] of [
    [out.leadAnkle, -1],
    [out.trailAnkle, 1],
  ] as const) {
    const hx = out.pelvis.x + _c.x * hipHalf * side;
    const hz = out.pelvis.z + _c.z * hipHalf * side;
    const horiz = Math.hypot(hx - ankle.x, hz - ankle.z);
    const maxY = ankle.y + Math.sqrt(Math.max(0, legMax * legMax - horiz * horiz));
    if (out.pelvis.y > maxY) out.pelvis.y = maxY;
  }
  out.leadHip.copy(out.pelvis).addScaledVector(_c, -hipHalf);
  out.trailHip.copy(out.pelvis).addScaledVector(_c, hipHalf);

  // Toes follow the pelvis about halfway; knees bend over the toes, slightly out
  const footYaw = pelvisYaw * 0.5;
  out.leadFootFwd.set(0, 0, -1).applyAxisAngle(Y, footYaw + 8 * DEG);
  out.trailFootFwd.set(0, 0, -1).applyAxisAngle(Y, footYaw - 8 * DEG);
  _pole.copy(out.leadFootFwd).addScaledVector(_c, -0.25);
  twoBone(out.leadHip, out.leadAnkle, thigh, shank, _pole, out.leadKnee);
  _pole.copy(out.trailFootFwd).addScaledVector(_c, 0.25);
  twoBone(out.trailHip, out.trailAnkle, thigh, shank, _pole, out.trailKnee);

  // --- Trunk -----------------------------------------------------------------
  _qTrunk.setFromAxisAngle(Y, trunkYaw);
  _qTmp.setFromAxisAngle(X, -ch[CH.lean] * DEG);
  _qTrunk.multiply(_qTmp);
  _qTmp.setFromAxisAngle(Z, -ch[CH.tilt] * DEG);
  _qTrunk.multiply(_qTmp);

  _a.set(0, torsoLen, 0).applyQuaternion(_qTrunk);
  out.chest.copy(out.pelvis).add(_a);
  _b.set(0, 0.25 * s, -0.025 * s).applyQuaternion(_qTrunk);
  out.head.copy(out.chest).add(_b);
  _d.set(1, 0, 0).applyQuaternion(_qTrunk); // trunk right axis
  out.hitShoulder.copy(out.chest).addScaledVector(_d, shoulderHalf);
  out.nonHitShoulder.copy(out.chest).addScaledVector(_d, -shoulderHalf);
  _a.set(0, 0.02 * s, 0).applyQuaternion(_qTrunk);
  out.hitShoulder.add(_a);
  out.nonHitShoulder.add(_a);

  // --- Racket + hitting arm --------------------------------------------------
  setLocal(_hand, ch, CH.hand, s);
  setLocal(out.racketShaft, ch, CH.shaft).normalize();
  setLocal(out.racketFaceNormal, ch, CH.face);
  out.racketFaceNormal.addScaledVector(out.racketShaft, -out.racketFaceNormal.dot(out.racketShaft));
  if (out.racketFaceNormal.lengthSq() < 1e-8) out.racketFaceNormal.set(0, 0, -1);
  out.racketFaceNormal.normalize();

  // Hand segment points between the forearm line and the shaft (wrist set)
  _a.subVectors(_hand, out.hitShoulder).normalize();
  _hd.copy(_a).multiplyScalar(0.55).addScaledVector(out.racketShaft, 0.45).normalize();
  out.hitWrist.copy(_hand).addScaledVector(_hd, -handLen);
  setLocal(_pole, ch, CH.elbowPole);
  twoBone(out.hitShoulder, out.hitWrist, upperArm, forearm, _pole, out.hitElbow);
  out.hitHand.copy(out.hitWrist).addScaledVector(_hd, handLen);

  out.racketButt.copy(out.hitHand).addScaledVector(out.racketShaft, -GRIP_FROM_BUTT);
  out.racketTip.copy(out.racketButt).addScaledVector(out.racketShaft, RACKET_LENGTH);
  out.racketHeadCenter.copy(out.hitHand).addScaledVector(out.racketShaft, HEAD_CENTER_FROM_HAND);

  // --- Non-hitting arm -------------------------------------------------------
  setLocal(_off, ch, CH.offHand, s);
  const grip = clamp(ch[CH.offGrip], 0, 1);
  if (grip > 0) {
    _a.copy(out.hitHand).addScaledVector(out.racketShaft, ch[CH.offGripAt]);
    // Two-handers stack the top hand just above the bottom hand
    if (twoHanded && ch[CH.offGripAt] < 0.2) _a.addScaledVector(out.racketFaceNormal, 0.01);
    _off.lerp(_a, grip);
  }
  _od.subVectors(_off, out.nonHitShoulder).normalize();
  out.nonHitWrist.copy(_off).addScaledVector(_od, -handLen * 0.85);
  setLocal(_pole, ch, CH.offPole);
  twoBone(out.nonHitShoulder, out.nonHitWrist, upperArm, forearm, _pole, out.nonHitElbow);
  out.nonHitHand.copy(out.nonHitWrist).addScaledVector(_od, handLen * 0.85);

  // --- Measurements (before mirroring; angles are mirror-invariant) ---------
  const m = out.measured;
  _a.subVectors(out.hitShoulder, out.hitElbow);
  _b.subVectors(out.hitWrist, out.hitElbow);
  m.elbowFlexion = 180 - angleDeg(_a, _b);
  const front = out.leadAnkle.z <= out.trailAnkle.z ? "lead" : "trail";
  const hip = front === "lead" ? out.leadHip : out.trailHip;
  const knee = front === "lead" ? out.leadKnee : out.trailKnee;
  const ankle = front === "lead" ? out.leadAnkle : out.trailAnkle;
  _a.subVectors(hip, knee);
  _b.subVectors(ankle, knee);
  m.frontKneeFlexion = 180 - angleDeg(_a, _b);
  m.trunkRotation = ch[CH.trunkYaw];
  m.pelvisRotation = ch[CH.pelvisYaw];
  m.separation = ch[CH.trunkYaw] - ch[CH.pelvisYaw];
  _a.subVectors(out.hitElbow, out.hitShoulder);
  _b.set(0, -1, 0).applyQuaternion(_qTrunk);
  m.armElevation = angleDeg(_a, _b);

  if (handedness === "left") {
    for (const v of [
      out.pelvis,
      out.chest,
      out.head,
      out.leadHip,
      out.leadKnee,
      out.leadAnkle,
      out.trailHip,
      out.trailKnee,
      out.trailAnkle,
      out.leadFootFwd,
      out.trailFootFwd,
      out.hitShoulder,
      out.hitElbow,
      out.hitWrist,
      out.hitHand,
      out.nonHitShoulder,
      out.nonHitElbow,
      out.nonHitWrist,
      out.nonHitHand,
      out.racketButt,
      out.racketTip,
      out.racketHeadCenter,
      out.racketShaft,
      out.racketFaceNormal,
    ]) {
      mirrorX(v);
    }
  }

  return out;
}

/** Racket head centre at contact — where the ball is struck. */
export function contactPoint(stroke: StrokeProfile, anthro: Anthropometrics, target = new THREE.Vector3()) {
  const motion = getStrokeMotion(stroke, anthro.heightM);
  const pose = solveStrokePose(createSkeletonPose(), stroke, anthro, motion.contactT);
  return target.copy(pose.racketHeadCenter);
}

const _measurePose = createSkeletonPose();

/** Joint angles measured from the solved skeleton at time t (for readouts). */
export function measureStroke(stroke: StrokeProfile, anthro: Anthropometrics, t: number): MeasuredAngles {
  return { ...solveStrokePose(_measurePose, stroke, anthro, t).measured };
}
