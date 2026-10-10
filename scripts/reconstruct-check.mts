/**
 * Reconstruct synthetic BlazePose tracks and scan plant / serve / side of hit.
 * These tracks are fixtures, not shipped motion.
 */
import { reconstructClip } from "../src/lib/pose/reconstruct.ts";
import { sampleClip } from "../src/lib/motion/clipSample.ts";
import { poseAngles, solveMotionClip } from "../src/lib/motion/solve.ts";
import { createMotionContinuity } from "../src/lib/motion/types.ts";
import { createSkeletonPose } from "../src/lib/motion/pose.ts";
import { putStudyClip } from "../src/lib/pose/registry.ts";
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
let failed = 0;

function scan(
  label: string,
  kind: "forehand" | "backhand" | "serve",
  handedness: "left" | "right",
  expect: { tipX?: "pos" | "neg"; serveHigh?: boolean },
) {
  const { clip } = reconstructClip(syntheticSwing(kind), {
    playerId: "check",
    stroke: kind,
    handedness,
    oneHanded: kind === "backhand",
  });
  putStudyClip(clip);

  const cont = createMotionContinuity();
  let maxKneeJump = 0;
  let prevKnee: number | null = null;
  let minAnkle = 99;
  let maxTipY = -99;
  let contactTip = { x: 0, y: 0, z: 0 };
  let readyTip = { x: 0, y: 0, z: 0 };

  for (let i = 0; i <= 80; i++) {
    const t = i / 80;
    solveMotionClip(sampleClip(clip, t), anthro, {
      handedness,
      authoredHand: clip.authoredHand,
      stroke: kind,
      continuity: cont,
      pose,
    });
    const a = poseAngles(pose);
    if (prevKnee != null) maxKneeJump = Math.max(maxKneeJump, Math.abs(a.leadKneeFlexion - prevKnee));
    prevKnee = a.leadKneeFlexion;
    minAnkle = Math.min(minAnkle, pose.leadAnkle.y, pose.trailAnkle.y);
    maxTipY = Math.max(maxTipY, pose.racketTip.y);
    if (i === 0) readyTip = pose.racketTip.clone();
    if (Math.abs(t - 0.7) < 0.02) contactTip = pose.racketTip.clone();
  }

  const plantOk = minAnkle >= 0.029;
  const kneeOk = maxKneeJump < 22;
  const moved = readyTip.distanceTo(contactTip) > 0.25;
  const sideOk =
    expect.tipX === "pos" ? contactTip.x > 0.05 : expect.tipX === "neg" ? contactTip.x < -0.05 : true;
  const serveOk = !expect.serveHigh || maxTipY > 1.95;
  const ok = plantOk && kneeOk && moved && sideOk && serveOk;
  if (!ok) failed += 1;
  console.log(
    (ok ? "ok" : "FAIL").padEnd(4),
    label.padEnd(22),
    `ankle=${minAnkle.toFixed(3)}`,
    `tip@0.7=${contactTip.x.toFixed(2)},${contactTip.y.toFixed(2)},${contactTip.z.toFixed(2)}`,
    `travel=${readyTip.distanceTo(contactTip).toFixed(2)}`,
    `kneeΔ=${maxKneeJump.toFixed(1)}`,
    expect.serveHigh ? `maxTipY=${maxTipY.toFixed(2)}` : "",
  );
}

scan("fh righty", "forehand", "right", { tipX: "pos" });
scan("bh righty", "backhand", "right", { tipX: "neg" });
scan("serve righty", "serve", "right", { serveHigh: true });

{
  const { clip } = reconstructClip(syntheticSwing("forehand"), {
    playerId: "check",
    stroke: "forehand",
    handedness: "right",
    oneHanded: false,
  });
  const cont = createMotionContinuity();
  solveMotionClip(sampleClip(clip, 0.7), anthro, {
    handedness: "left",
    authoredHand: clip.authoredHand,
    stroke: "forehand",
    continuity: cont,
    pose,
  });
  const leftyOk = pose.racketTip.x < -0.05 && pose.leadAnkle.y >= 0.029;
  if (!leftyOk) failed += 1;
  console.log(
    (leftyOk ? "ok" : "FAIL").padEnd(4),
    "fh retarget lefty".padEnd(22),
    `tip=${pose.racketTip.x.toFixed(2)},${pose.racketTip.y.toFixed(2)},${pose.racketTip.z.toFixed(2)}`,
  );
}

if (failed) {
  console.error(`${failed} reconstruct checks failed`);
  process.exit(1);
}
console.log("reconstruct-check ok");
