/** Scan shipped reconstructed study clips for plant / travel / serve height. */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { sampleClip } from "../src/lib/motion/clipSample.ts";
import { solveMotionClip } from "../src/lib/motion/solve.ts";
import { createMotionContinuity, type MotionClip } from "../src/lib/motion/types.ts";
import { createSkeletonPose } from "../src/lib/motion/pose.ts";

const dir = join(dirname(fileURLToPath(import.meta.url)), "../src/data/motion/study");
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

const jobs: { file: string; serveHigh?: boolean }[] = [
  { file: "forehand.json" },
  { file: "backhand-1h.json" },
  { file: "backhand-2h.json" },
  { file: "serve.json", serveHigh: true },
  { file: "slice.json" },
  { file: "volley.json" },
];

const pose = createSkeletonPose();
let failed = 0;
for (const job of jobs) {
  const clip = JSON.parse(readFileSync(join(dir, job.file), "utf8")) as MotionClip;
  const cont = createMotionContinuity();
  let minAnkle = 99;
  let minJoint = 99;
  let maxTipY = -99;
  let maxTipJump = 0;
  let flips = 0;
  let prevTip: { x: number; y: number; z: number } | null = null;
  let prevShaft: { x: number; y: number; z: number } | null = null;
  let ready = { x: 0, y: 0, z: 0 };
  let contact = { x: 0, y: 0, z: 0 };
  for (let i = 0; i <= 80; i++) {
    const t = i / 80;
    solveMotionClip(sampleClip(clip, t), anthro, {
      handedness: "right",
      authoredHand: clip.authoredHand,
      stroke: clip.stroke,
      continuity: cont,
      pose,
    });
    minAnkle = Math.min(minAnkle, pose.leadAnkle.y, pose.trailAnkle.y);
    minJoint = Math.min(minJoint, pose.pelvis.y, pose.leadKnee.y, pose.trailKnee.y);
    maxTipY = Math.max(maxTipY, pose.racketTip.y);
    const sx = pose.racketTip.x - pose.hitHand.x;
    const sy = pose.racketTip.y - pose.hitHand.y;
    const sz = pose.racketTip.z - pose.hitHand.z;
    const sl = Math.hypot(sx, sy, sz) || 1;
    if (prevTip) {
      maxTipJump = Math.max(
        maxTipJump,
        Math.hypot(pose.racketTip.x - prevTip.x, pose.racketTip.y - prevTip.y, pose.racketTip.z - prevTip.z),
      );
    }
    if (prevShaft) {
      const dot = (sx * prevShaft.x + sy * prevShaft.y + sz * prevShaft.z) / sl;
      if (dot < -0.25) flips += 1;
    }
    prevTip = { x: pose.racketTip.x, y: pose.racketTip.y, z: pose.racketTip.z };
    prevShaft = { x: sx / sl, y: sy / sl, z: sz / sl };
    if (i === 0) ready = pose.racketTip.clone();
    if (Math.abs(t - 0.7) < 0.02) contact = pose.racketTip.clone();
  }
  const travel = ready.distanceTo(contact);
  const ok =
    minAnkle >= 0.029 &&
    minJoint >= 0.02 &&
    flips === 0 &&
    travel > 0.12 &&
    (!job.serveHigh || maxTipY > 1.85) &&
    clip.frameCount >= 20 &&
    (clip.world?.length ?? 0) > 0;
  if (!ok) failed += 1;
  console.log(
    (ok ? "ok" : "FAIL").padEnd(4),
    job.file.padEnd(18),
    `n=${clip.frameCount}`,
    `travel=${travel.toFixed(2)}`,
    `maxY=${maxTipY.toFixed(2)}`,
    `ankle=${minAnkle.toFixed(3)}`,
    `tipΔ=${maxTipJump.toFixed(2)}`,
    `flips=${flips}`,
    `world=${clip.world?.length ? "yes" : "NO"}`,
  );
}
if (failed) {
  console.error(`${failed} shipped study clips failed`);
  process.exit(1);
}
console.log("study-clip-check ok");
