import type { StrokePhase, StrokeProfile } from "@/types/biomechanics";

/**
 * Target-driven stroke motion.
 *
 * Each archetype is a short list of body + racket targets authored in a
 * court-fixed frame for a 1.85 m right-handed player:
 *   [right, up, forward]  — metres, forward = toward the net, origin on the
 *   court under the midpoint of the stance.
 *
 * Why targets instead of joint angles: coaching describes groundstrokes and
 * serves by where the hand and racket head travel (loop, slot, contact out
 * front, finish) and how far the pelvis and trunk rotate. Authoring those
 * directly and solving the arms with two-bone IK keeps every pose on-model;
 * elbow / knee / trunk readouts are then measured from the solved skeleton,
 * so the numbers on screen always match what is drawn.
 *
 * Rotation sign: yaw is about +up; negative turns the hitting shoulder back
 * (forehand unit turn), positive turns it toward the net (backhand turn).
 * Typical tour ranges used below (Elliott 2006; Reid et al. 2013; Kovacs &
 * Ellenbecker 2011): FH/BH shoulder turn 90–110°, pelvis 45–60°, X-factor
 * 30–50°; serve trophy knee flexion 60–70°, trunk tilt 25–35°.
 */

export type V3 = readonly [number, number, number];

export interface MotionKey {
  phase: StrokePhase;
  /** Fraction of the way from this phase's keyframe toward the next one. */
  u?: number;
  pelvis: V3;
  pelvisYaw: number;
  trunkYaw: number;
  /** Forward trunk lean (deg); negative arches back. */
  lean: number;
  /** Lateral tilt (deg); positive raises the non-hitting shoulder. */
  tilt: number;
  /** [right, forward, lift] for each foot. */
  leftFoot: V3;
  rightFoot: V3;
  /** Gripping hand (palm) position. */
  hand: V3;
  /** Racket shaft direction, butt → tip. */
  shaft: V3;
  /** String-bed normal on the hitting side. */
  face: V3;
  /** Direction the hitting elbow bends toward. */
  elbowPole: V3;
  offHand: V3;
  offPole: V3;
  /** 0 = off hand free at `offHand`, 1 = on the racket at `offGripAt`. */
  offGrip: number;
  /** Distance along the shaft from the gripping hand (throat ≈ 0.3, 2HBH ≈ 0.1). */
  offGripAt: number;
}

export type MotionArchetype = "forehand" | "backhand1h" | "backhand2h" | "serve" | "slice" | "volley";

const READY: MotionKey = {
  phase: "ready",
  pelvis: [0, 0.9, 0],
  pelvisYaw: 0,
  trunkYaw: 0,
  lean: 10,
  tilt: 0,
  leftFoot: [-0.24, 0, 0],
  rightFoot: [0.24, 0, 0],
  hand: [0.12, 0.98, 0.36],
  shaft: [-0.15, 0.55, 0.82],
  face: [0.98, 0, 0.18],
  elbowPole: [0.6, -0.8, 0.1],
  offHand: [-0.05, 1.1, 0.45],
  offPole: [-0.6, -0.8, 0.1],
  offGrip: 1,
  offGripAt: 0.3,
};

function key(phase: StrokePhase, patch: Partial<MotionKey>, u?: number): MotionKey {
  return { ...READY, ...patch, phase, u };
}

const FOREHAND: MotionKey[] = [
  key("ready", {}),
  key("unitTurn", {
    pelvis: [0.07, 0.88, -0.03],
    pelvisYaw: -45,
    trunkYaw: -85,
    lean: 8,
    leftFoot: [-0.2, 0.16, 0],
    rightFoot: [0.36, -0.08, 0],
    hand: [0.4, 1.1, 0.08],
    shaft: [0.3, 0.85, 0.4],
    face: [0.55, -0.45, 0.55],
    elbowPole: [0.4, -0.9, -0.3],
    offHand: [0.3, 1.3, 0.38],
    offPole: [0, -1, 0.3],
    offGrip: 0.65,
  }),
  // Top of the loop — hand at shoulder height on the hitting side, tip up, face closed
  key("backswing", {
    pelvis: [0.12, 0.86, -0.06],
    pelvisYaw: -55,
    trunkYaw: -100,
    lean: 6,
    tilt: -3,
    leftFoot: [-0.2, 0.16, 0],
    rightFoot: [0.36, -0.08, 0],
    hand: [0.45, 1.28, -0.4],
    shaft: [0.15, 0.8, -0.55],
    face: [0.95, -0.1, 0.13],
    elbowPole: [0.5, -0.8, -0.3],
    offHand: [0.42, 1.36, 0.25],
    offPole: [0, -1, 0],
    offGrip: 0,
  }),
  // Slot / "pat the dog" — racket drops below the hand, face toward the court
  key(
    "backswing",
    {
      pelvis: [0.1, 0.84, -0.05],
      pelvisYaw: -45,
      trunkYaw: -86,
      lean: 7,
      tilt: -4,
      leftFoot: [-0.2, 0.16, 0],
      rightFoot: [0.36, -0.08, 0],
      hand: [0.5, 0.96, -0.38],
      shaft: [0.1, -0.6, -0.8],
      face: [0.3, -0.75, 0.55],
      elbowPole: [0.6, -0.6, -0.4],
      offHand: [0.3, 1.32, 0.38],
      offPole: [0, -1, 0],
      offGrip: 0,
    },
    0.55,
  ),
  // Forward swing: hips open first, racket lags behind the hand
  key("acceleration", {
    pelvis: [0.06, 0.87, 0],
    pelvisYaw: -18,
    trunkYaw: -50,
    lean: 8,
    tilt: -4,
    leftFoot: [-0.2, 0.16, 0],
    rightFoot: [0.36, -0.08, 0],
    hand: [0.55, 0.9, -0.08],
    shaft: [0.3, -0.25, -0.92],
    face: [0.95, -0.1, 0.28],
    elbowPole: [0.5, -0.8, -0.2],
    offHand: [0.1, 1.3, 0.38],
    offPole: [0, -1, 0],
    offGrip: 0,
  }),
  // Contact out front, face square, racket roughly parallel to the net
  key("contact", {
    pelvis: [0.02, 0.92, 0.08],
    pelvisYaw: 20,
    trunkYaw: 5,
    lean: 6,
    tilt: -2,
    leftFoot: [-0.2, 0.16, 0],
    rightFoot: [0.36, -0.08, 0.02],
    hand: [0.6, 0.98, 0.56],
    shaft: [0.97, -0.12, 0.1],
    face: [-0.1, -0.08, 0.99],
    elbowPole: [0.4, -0.9, 0],
    offHand: [-0.2, 1.25, 0.25],
    offPole: [-0.3, -1, 0],
    offGrip: 0,
  }),
  // Wrap finish over the non-hitting shoulder
  key("followThrough", {
    pelvis: [-0.02, 0.92, 0.1],
    pelvisYaw: 45,
    trunkYaw: 80,
    lean: 6,
    tilt: 2,
    leftFoot: [-0.2, 0.16, 0],
    rightFoot: [0.3, -0.02, 0.05],
    hand: [-0.32, 1.45, 0.22],
    shaft: [-0.3, 0.15, -0.94],
    face: [-0.9, -0.3, 0.24],
    elbowPole: [0.1, 0.2, 1],
    offHand: [-0.3, 1.2, 0.05],
    offPole: [-0.5, -1, 0],
    offGrip: 0,
  }),
  key("recovery", {}),
];

const BACKHAND_2H: MotionKey[] = [
  key("ready", {}),
  key("unitTurn", {
    pelvis: [-0.06, 0.88, 0.03],
    pelvisYaw: 45,
    trunkYaw: 85,
    lean: 8,
    leftFoot: [-0.32, -0.08, 0],
    rightFoot: [0.08, 0.22, 0],
    hand: [-0.32, 1.08, 0.08],
    shaft: [-0.3, 0.8, 0.5],
    face: [-0.6, -0.5, 0.45],
    elbowPole: [-0.3, -1, 0.2],
    offPole: [-0.6, -1, 0],
    offGrip: 1,
    offGripAt: 0.12,
  }),
  key("backswing", {
    pelvis: [-0.1, 0.86, 0],
    pelvisYaw: 55,
    trunkYaw: 102,
    lean: 6,
    tilt: 3,
    leftFoot: [-0.32, -0.08, 0],
    rightFoot: [0.08, 0.22, 0],
    hand: [-0.38, 1.12, -0.2],
    shaft: [-0.2, 0.8, -0.55],
    face: [-0.95, -0.1, 0.2],
    elbowPole: [-0.2, -1, 0],
    offPole: [-0.6, -1, -0.2],
    offGrip: 1,
    offGripAt: 0.12,
  }),
  key(
    "backswing",
    {
      pelvis: [-0.09, 0.84, 0],
      pelvisYaw: 48,
      trunkYaw: 90,
      lean: 7,
      tilt: 4,
      leftFoot: [-0.32, -0.08, 0],
      rightFoot: [0.08, 0.22, 0],
      hand: [-0.4, 0.92, -0.2],
      shaft: [-0.1, -0.55, -0.83],
      face: [-0.7, -0.6, 0.35],
      elbowPole: [-0.2, -1, 0],
      offPole: [-0.6, -1, -0.2],
      offGrip: 1,
      offGripAt: 0.12,
    },
    0.55,
  ),
  key("acceleration", {
    pelvis: [-0.05, 0.87, 0.04],
    pelvisYaw: 22,
    trunkYaw: 50,
    lean: 8,
    tilt: 3,
    leftFoot: [-0.32, -0.08, 0],
    rightFoot: [0.08, 0.22, 0],
    hand: [-0.36, 0.92, 0.04],
    shaft: [-0.3, -0.25, -0.92],
    face: [-0.95, -0.1, 0.28],
    elbowPole: [-0.1, -1, 0],
    offPole: [-0.6, -1, 0],
    offGrip: 1,
    offGripAt: 0.12,
  }),
  key("contact", {
    pelvis: [0, 0.92, 0.1],
    pelvisYaw: -2,
    trunkYaw: 12,
    lean: 6,
    tilt: 1,
    leftFoot: [-0.32, -0.08, 0.02],
    rightFoot: [0.08, 0.22, 0],
    hand: [-0.16, 1.0, 0.42],
    shaft: [-0.97, -0.12, 0.1],
    face: [0.1, -0.08, 0.99],
    elbowPole: [0, -1, 0],
    offPole: [-0.6, -1, 0],
    offGrip: 1,
    offGripAt: 0.12,
  }),
  key("followThrough", {
    pelvis: [0.02, 0.92, 0.1],
    pelvisYaw: -40,
    trunkYaw: -75,
    lean: 6,
    tilt: -2,
    leftFoot: [-0.3, -0.04, 0.05],
    rightFoot: [0.08, 0.22, 0],
    hand: [0.3, 1.5, 0.2],
    shaft: [0.3, 0.15, -0.94],
    face: [0.9, -0.3, 0.24],
    elbowPole: [0.2, -0.3, 1],
    offPole: [0, -0.5, 1],
    offGrip: 1,
    offGripAt: 0.12,
  }),
  key("recovery", {}),
];

const BACKHAND_1H: MotionKey[] = [
  key("ready", {}),
  key("unitTurn", {
    pelvis: [-0.05, 0.88, 0.03],
    pelvisYaw: 48,
    trunkYaw: 92,
    lean: 8,
    leftFoot: [-0.3, -0.08, 0],
    rightFoot: [0.06, 0.26, 0],
    hand: [-0.24, 1.08, 0.1],
    shaft: [-0.3, 0.75, 0.55],
    face: [-0.6, -0.5, 0.35],
    elbowPole: [-0.2, -1, 0.2],
    offGrip: 1,
    offGripAt: 0.3,
    offPole: [-0.6, -1, 0],
  }),
  // Off hand cradles the throat; shoulders turned past the hips (back to the net)
  key("backswing", {
    pelvis: [-0.08, 0.86, 0],
    pelvisYaw: 55,
    trunkYaw: 108,
    lean: 6,
    tilt: 4,
    leftFoot: [-0.3, -0.08, 0],
    rightFoot: [0.06, 0.26, 0],
    hand: [-0.26, 1.12, -0.16],
    shaft: [-0.1, 0.75, -0.65],
    face: [-0.98, 0, 0.15],
    elbowPole: [-0.1, -1, 0.2],
    offGrip: 1,
    offGripAt: 0.3,
    offPole: [-0.6, -1, -0.3],
  }),
  key(
    "backswing",
    {
      pelvis: [-0.07, 0.84, 0],
      pelvisYaw: 50,
      trunkYaw: 100,
      lean: 7,
      tilt: 4,
      leftFoot: [-0.3, -0.08, 0],
      rightFoot: [0.06, 0.26, 0],
      hand: [-0.3, 0.92, -0.18],
      shaft: [-0.05, -0.55, -0.83],
      face: [-0.95, -0.25, 0.2],
      elbowPole: [-0.1, -1, 0.1],
      offHand: [-0.45, 1.1, -0.3],
      offGrip: 0.6,
      offGripAt: 0.3,
      offPole: [-0.6, -1, -0.3],
    },
    0.55,
  ),
  key("acceleration", {
    pelvis: [-0.04, 0.87, 0.06],
    pelvisYaw: 40,
    trunkYaw: 80,
    lean: 8,
    tilt: 3,
    leftFoot: [-0.3, -0.08, 0],
    rightFoot: [0.06, 0.26, 0],
    hand: [-0.2, 0.94, 0.12],
    shaft: [-0.2, -0.2, -0.96],
    face: [-0.97, -0.1, 0.22],
    elbowPole: [0, -1, 0],
    offHand: [-0.55, 1.15, -0.3],
    offGrip: 0,
    offPole: [-0.6, -1, -0.3],
  }),
  // Straight-arm contact well in front; chest stays sideways
  key("contact", {
    pelvis: [0, 0.92, 0.12],
    pelvisYaw: 42,
    trunkYaw: 78,
    lean: 6,
    tilt: 2,
    leftFoot: [-0.3, -0.08, 0.02],
    rightFoot: [0.06, 0.26, 0],
    hand: [0.08, 0.95, 0.85],
    shaft: [-0.97, -0.1, 0.2],
    face: [0.2, -0.08, 0.98],
    elbowPole: [0, -1, 0],
    offHand: [-0.6, 1.2, -0.35],
    offGrip: 0,
    offPole: [0, -1, 0],
  }),
  // Arms spread like wings — racket high toward the target, off arm back
  key("followThrough", {
    pelvis: [0.02, 0.93, 0.12],
    pelvisYaw: 35,
    trunkYaw: 62,
    lean: 4,
    tilt: 0,
    leftFoot: [-0.3, -0.06, 0.04],
    rightFoot: [0.06, 0.26, 0],
    hand: [0.38, 1.72, 0.38],
    shaft: [0.45, 0.85, -0.27],
    face: [-0.3, 0.3, 0.9],
    elbowPole: [0.3, -0.5, -1],
    offHand: [-0.62, 1.38, -0.42],
    offGrip: 0,
    offPole: [0, -1, 0],
  }),
  key("recovery", {}),
];

const SLICE: MotionKey[] = [
  key("ready", {}),
  key("unitTurn", {
    pelvis: [-0.05, 0.88, 0.03],
    pelvisYaw: 45,
    trunkYaw: 90,
    lean: 8,
    leftFoot: [-0.3, -0.08, 0],
    rightFoot: [0.06, 0.26, 0],
    hand: [-0.26, 1.4, -0.02],
    shaft: [-0.1, 0.65, -0.75],
    face: [0, 0.75, 0.65],
    elbowPole: [-0.2, -1, 0],
    offGrip: 1,
    offGripAt: 0.3,
    offPole: [-0.6, -1, 0],
  }),
  // High prep above the non-hitting shoulder, face open
  key("backswing", {
    pelvis: [-0.08, 0.86, 0],
    pelvisYaw: 52,
    trunkYaw: 100,
    lean: 6,
    tilt: 2,
    leftFoot: [-0.3, -0.08, 0],
    rightFoot: [0.06, 0.26, 0],
    hand: [-0.28, 1.48, -0.18],
    shaft: [-0.25, 0.45, -0.86],
    face: [0.1, 0.88, 0.47],
    elbowPole: [-0.3, -1, 0],
    offGrip: 1,
    offGripAt: 0.3,
    offPole: [-0.6, -1, -0.3],
  }),
  // High-to-low carve
  key("acceleration", {
    pelvis: [-0.04, 0.86, 0.06],
    pelvisYaw: 46,
    trunkYaw: 88,
    lean: 8,
    tilt: 2,
    leftFoot: [-0.3, -0.08, 0],
    rightFoot: [0.06, 0.26, 0],
    hand: [-0.2, 1.14, 0.48],
    shaft: [-0.6, 0.15, -0.78],
    face: [0.25, 0.85, 0.33],
    elbowPole: [-0.1, -1, 0],
    offHand: [-0.5, 1.15, -0.3],
    offGrip: 0,
    offPole: [-0.6, -1, -0.3],
  }),
  key("contact", {
    pelvis: [0, 0.88, 0.12],
    pelvisYaw: 42,
    trunkYaw: 80,
    lean: 8,
    tilt: 2,
    leftFoot: [-0.3, -0.08, 0.02],
    rightFoot: [0.06, 0.26, 0],
    hand: [0.06, 0.98, 0.82],
    shaft: [-0.95, 0.05, 0.3],
    face: [0.3, 0.4, 0.87],
    elbowPole: [0, -1, 0],
    offHand: [-0.6, 1.2, -0.38],
    offGrip: 0,
    offPole: [0, -1, 0],
  }),
  // Extend through toward the target, face stays open
  key("followThrough", {
    pelvis: [0.02, 0.9, 0.14],
    pelvisYaw: 38,
    trunkYaw: 70,
    lean: 6,
    tilt: 0,
    leftFoot: [-0.3, -0.06, 0.03],
    rightFoot: [0.06, 0.26, 0],
    hand: [0.3, 1.2, 0.86],
    shaft: [-0.6, 0.3, 0.74],
    face: [0.2, 0.95, -0.22],
    elbowPole: [0.2, -1, 0],
    offHand: [-0.62, 1.3, -0.42],
    offGrip: 0,
    offPole: [0, -1, 0],
  }),
  key("recovery", {}),
];

const VOLLEY: MotionKey[] = [
  key("ready", { hand: [0.1, 1.12, 0.4], shaft: [-0.1, 0.75, 0.65], face: [0.99, 0, 0.15] }),
  // Short shoulder turn — racket stays in front, head above the wrist
  key("unitTurn", {
    pelvis: [0.03, 0.88, 0],
    pelvisYaw: -20,
    trunkYaw: -45,
    lean: 10,
    leftFoot: [-0.24, 0.02, 0],
    rightFoot: [0.28, -0.02, 0],
    hand: [0.38, 1.24, 0.22],
    shaft: [0.3, 0.9, -0.3],
    face: [-0.1, 0.3, 0.95],
    elbowPole: [0.4, -1, -0.2],
    offHand: [0.15, 1.22, 0.5],
    offGrip: 0.4,
    offPole: [0, -1, 0.3],
  }),
  key("acceleration", {
    pelvis: [0.02, 0.86, 0.06],
    pelvisYaw: -14,
    trunkYaw: -30,
    lean: 12,
    leftFoot: [-0.24, 0.2, 0.04],
    rightFoot: [0.28, -0.02, 0],
    hand: [0.42, 1.2, 0.38],
    shaft: [0.6, 0.75, -0.2],
    face: [-0.15, 0.3, 0.94],
    elbowPole: [0.4, -1, -0.2],
    offHand: [0.0, 1.25, 0.45],
    offGrip: 0,
    offPole: [0, -1, 0.3],
  }),
  // Punch: block in front with a firm wrist, step with the opposite foot
  key("contact", {
    pelvis: [0, 0.84, 0.14],
    pelvisYaw: -8,
    trunkYaw: -18,
    lean: 14,
    leftFoot: [-0.24, 0.38, 0],
    rightFoot: [0.28, -0.02, 0],
    hand: [0.36, 1.14, 0.62],
    shaft: [0.65, 0.7, 0.1],
    face: [-0.35, 0.25, 0.9],
    elbowPole: [0.4, -1, 0],
    offHand: [-0.2, 1.25, 0.35],
    offGrip: 0,
    offPole: [-0.4, -1, 0],
  }),
  key("followThrough", {
    pelvis: [0, 0.85, 0.16],
    pelvisYaw: -5,
    trunkYaw: -12,
    lean: 14,
    leftFoot: [-0.24, 0.38, 0],
    rightFoot: [0.28, -0.02, 0],
    hand: [0.3, 1.08, 0.74],
    shaft: [0.6, 0.75, 0.15],
    face: [-0.3, 0.25, 0.92],
    elbowPole: [0.4, -1, 0],
    offHand: [-0.22, 1.22, 0.35],
    offGrip: 0,
    offPole: [-0.4, -1, 0],
  }),
  key("recovery", { hand: [0.1, 1.12, 0.4], shaft: [-0.1, 0.75, 0.65], face: [0.99, 0, 0.15] }),
];

/** Platform serve: sideways stance, trophy, racket drop, upward extension, land inside. */
const SERVE_READY: Partial<MotionKey> = {
  pelvis: [0.04, 0.95, 0],
  pelvisYaw: -75,
  trunkYaw: -80,
  lean: 2,
  leftFoot: [-0.04, 0.16, 0],
  rightFoot: [0.2, -0.24, 0],
  hand: [0.36, 1.1, 0.02],
  shaft: [0.2, 0.35, 0.9],
  face: [0.97, 0, -0.2],
  elbowPole: [0.2, -1, -0.3],
  offHand: [0.3, 1.15, 0.2],
  offGrip: 0.9,
  offGripAt: 0.3,
  offPole: [0, -1, 0.3],
};

const SERVE: MotionKey[] = [
  key("ready", SERVE_READY),
  // Arms separate together: racket swings down past the leg, tossing arm rises
  key("unitTurn", {
    ...SERVE_READY,
    pelvis: [0.06, 0.93, -0.02],
    pelvisYaw: -85,
    trunkYaw: -100,
    lean: -4,
    tilt: 8,
    hand: [0.22, 0.88, -0.32],
    shaft: [0.1, -0.7, -0.7],
    face: [0.95, 0, 0.14],
    elbowPole: [0.3, -0.2, -1],
    offHand: [0.2, 1.5, 0.28],
    offGrip: 0,
  }),
  // Trophy: knees loaded, shoulder-over-shoulder tilt, toss arm reaching up
  key("trophy", {
    ...SERVE_READY,
    pelvis: [0.02, 0.85, 0.1],
    pelvisYaw: -95,
    trunkYaw: -112,
    lean: -8,
    tilt: 18,
    hand: [0.12, 1.7, -0.38],
    shaft: [0.25, 0.95, -0.15],
    face: [0.95, -0.22, 0.2],
    elbowPole: [0.2, -0.3, -1],
    offHand: [0.2, 2.18, 0.3],
    offGrip: 0,
    offPole: [0, -0.4, -1],
  }),
  // Racket drop: legs drive, elbow up, racket head falls down the back
  key("backswing", {
    ...SERVE_READY,
    pelvis: [0.02, 0.92, 0.12],
    pelvisYaw: -80,
    trunkYaw: -95,
    lean: -6,
    tilt: 22,
    hand: [0.06, 1.55, -0.26],
    shaft: [0.05, -0.95, -0.3],
    face: [0.95, -0.1, 0.3],
    elbowPole: [0.2, 1, -0.3],
    offHand: [0.1, 1.55, 0.2],
    offGrip: 0,
    offPole: [0, -1, 0],
  }),
  // Upward swing — racket edge-on, tip trailing
  key("acceleration", {
    ...SERVE_READY,
    pelvis: [0.02, 1.02, 0.08],
    pelvisYaw: -60,
    trunkYaw: -62,
    lean: -2,
    tilt: 26,
    leftFoot: [-0.04, 0.16, 0.05],
    rightFoot: [0.12, -0.12, 0.04],
    hand: [0.18, 2.0, -0.05],
    shaft: [0.2, 0.3, -0.93],
    face: [0.98, 0, 0.21],
    elbowPole: [0.4, 0.2, -1],
    offHand: [0.0, 1.45, 0.25],
    offGrip: 0,
    offPole: [0, -1, 0],
  }),
  // Full reach contact, airborne, face toward the box
  key("contact", {
    ...SERVE_READY,
    pelvis: [0.04, 1.12, 0.16],
    pelvisYaw: -32,
    trunkYaw: -24,
    lean: 6,
    tilt: 12,
    leftFoot: [-0.04, 0.24, 0.14],
    rightFoot: [0.08, -0.08, 0.16],
    hand: [0.26, 2.36, 0.24],
    shaft: [0.05, 0.95, 0.3],
    face: [0, -0.3, 0.95],
    elbowPole: [0.6, 0, -1],
    offHand: [0.0, 1.45, 0.25],
    offGrip: 0,
    offPole: [0, -1, 0],
  }),
  // Land on the front foot inside the baseline; racket finishes across the body
  key("followThrough", {
    ...SERVE_READY,
    pelvis: [-0.02, 0.86, 0.5],
    pelvisYaw: 15,
    trunkYaw: 35,
    lean: 26,
    tilt: 0,
    leftFoot: [-0.06, 0.62, 0],
    rightFoot: [0.28, 0.06, 0.22],
    hand: [-0.36, 0.95, 0.5],
    shaft: [-0.4, -0.3, -0.87],
    face: [-0.9, 0.2, 0.35],
    elbowPole: [0.3, -0.5, 1],
    offHand: [-0.35, 1.15, 0.45],
    offGrip: 0,
    offPole: [-0.5, -1, 0],
  }),
  key("recovery", SERVE_READY),
];

export const ARCHETYPES: Record<MotionArchetype, MotionKey[]> = {
  forehand: FOREHAND,
  backhand1h: BACKHAND_1H,
  backhand2h: BACKHAND_2H,
  serve: SERVE,
  slice: SLICE,
  volley: VOLLEY,
};

export function archetypeFor(stroke: StrokeProfile): MotionArchetype {
  switch (stroke.type) {
    case "forehand":
      return "forehand";
    case "backhand":
      return stroke.oneHanded ? "backhand1h" : "backhand2h";
    case "serve":
      return "serve";
    case "slice":
      return "slice";
    case "volley":
      return "volley";
  }
}
