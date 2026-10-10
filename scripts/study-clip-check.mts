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
  let maxTipY = -99;
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
    maxTipY = Math.max(maxTipY, pose.racketTip.y);
    if (i === 0) ready = pose.racketTip.clone();
    if (Math.abs(t - 0.7) < 0.02) contact = pose.racketTip.clone();
  }
  const travel = ready.distanceTo(contact);
  const ok = minAnkle >= 0.029 && travel > 0.12 && (!job.serveHigh || maxTipY > 1.85) && clip.frameCount >= 20;
  if (!ok) failed += 1;
  console.log(
    (ok ? "ok" : "FAIL").padEnd(4),
    job.file.padEnd(18),
    `n=${clip.frameCount}`,
    `travel=${travel.toFixed(2)}`,
    `maxY=${maxTipY.toFixed(2)}`,
    `ankle=${minAnkle.toFixed(3)}`,
  );
}
if (failed) {
  console.error(`${failed} shipped study clips failed`);
  process.exit(1);
}
console.log("study-clip-check ok");
