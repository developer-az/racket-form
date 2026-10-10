/**
 * Scan reconstructed synthetic swings for knee pop, tip flip, unplanted feet.
 */
import { reconstructClip } from "../src/lib/pose/reconstruct.ts";
import { sampleClip } from "../src/lib/motion/clipSample.ts";
import { poseAngles, solveMotionClip } from "../src/lib/motion/solve.ts";
import { createMotionContinuity } from "../src/lib/motion/types.ts";
import { createSkeletonPose } from "../src/lib/motion/pose.ts";
import { syntheticSwing } from "./syntheticSwing.ts";

const anthro = {
  heightM: 1.85,
  wingspanM: 1.9,
  massKg: 80,
  torsoRatio: 0.3,
  upperArmRatio: 0.186,
  forearmRatio: 0.146,
  thighRatio: 0.245,
  shankRatio: 0.246,
};

const pose = createSkeletonPose();

function scan(
  clip: ReturnType<typeof reconstructClip>["clip"],
  handedness: "right" | "left",
  steps = 120,
) {
  const cont = createMotionContinuity();
  let maxKneeJump = 0;
  let maxTipJump = 0;
  let minAnkle = 99;
  let maxTipY = -99;
  let minTipY = 99;
  let prevKnee: number | null = null;
  let prevTip: { x: number; y: number; z: number } | null = null;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    solveMotionClip(sampleClip(clip, t), anthro, {
      handedness,
      authoredHand: clip.authoredHand,
      stroke: clip.stroke,
      continuity: cont,
      pose,
    });
    const a = poseAngles(pose);
    if (prevKnee != null) maxKneeJump = Math.max(maxKneeJump, Math.abs(a.leadKneeFlexion - prevKnee));
    prevKnee = a.leadKneeFlexion;
    const tip = pose.racketTip;
    minAnkle = Math.min(minAnkle, pose.leadAnkle.y, pose.trailAnkle.y);
    maxTipY = Math.max(maxTipY, tip.y);
    minTipY = Math.min(minTipY, tip.y);
    if (prevTip) maxTipJump = Math.max(maxTipJump, Math.hypot(tip.x - prevTip.x, tip.y - prevTip.y, tip.z - prevTip.z));
    prevTip = { x: tip.x, y: tip.y, z: tip.z };
  }

  const serveOk = clip.stroke !== "serve" || maxTipY > 1.9;
  const plantOk = minAnkle >= 0.029;
  const kneeOk = maxKneeJump < 22;
  const tipOk = maxTipJump < 0.55;
  const status = serveOk && plantOk && kneeOk && tipOk ? "ok" : "WARN";
  console.log(
    status.padEnd(4),
    clip.id.padEnd(22),
    `ankle=${minAnkle.toFixed(3)}`,
    `tipY[${minTipY.toFixed(2)}..${maxTipY.toFixed(2)}]`,
    `kneeΔ=${maxKneeJump.toFixed(1)}`,
    `tipΔ=${maxTipJump.toFixed(3)}`,
  );
}

for (const kind of ["forehand", "backhand", "serve"] as const) {
  const { clip } = reconstructClip(syntheticSwing(kind), {
    playerId: "check",
    stroke: kind,
    handedness: "right",
    oneHanded: kind === "backhand",
  });
  scan(clip, "right");
}
