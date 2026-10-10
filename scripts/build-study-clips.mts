/**
 * Rebuild reconstructed study clips from extracted BlazePose tracks.
 * Videos stay out of the repo; only the processed pose clips ship.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { reconstructClip } from "../src/lib/pose/reconstruct.ts";
import { sampleClip } from "../src/lib/motion/clipSample.ts";
import { poseAngles, solveMotionClip } from "../src/lib/motion/solve.ts";
import { createMotionContinuity } from "../src/lib/motion/types.ts";
import { createSkeletonPose } from "../src/lib/motion/pose.ts";
import type { PoseFrame } from "../src/lib/pose/landmarks.ts";
import type { StrokeType } from "../src/types/biomechanics.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tracks = join("/tmp/study-videos");
const outDir = join(root, "src/data/motion/study");

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

type Job = {
  file: string;
  out: string;
  stroke: StrokeType;
  oneHanded: boolean;
  from: number;
  to: number;
  expect: { serveHigh?: boolean; tipX?: "pos" | "neg"; minTravel?: number };
};

const jobs: Job[] = [
  { file: "drive.frames.json", out: "forehand.json", stroke: "forehand", oneHanded: true, from: 0.15, to: 4.1, expect: {} },
  { file: "reves-1h.frames.json", out: "backhand-1h.json", stroke: "backhand", oneHanded: true, from: 0.15, to: 5.0, expect: {} },
  { file: "reves-2h.frames.json", out: "backhand-2h.json", stroke: "backhand", oneHanded: false, from: 0.15, to: 5.0, expect: {} },
  { file: "serve.frames.json", out: "serve.json", stroke: "serve", oneHanded: true, from: 2.5, to: 5.05, expect: { serveHigh: true } },
  { file: "slice.frames.json", out: "slice.json", stroke: "slice", oneHanded: true, from: 3.2, to: 7.2, expect: { minTravel: 0.08 } },
  { file: "volea.frames.json", out: "volley.json", stroke: "volley", oneHanded: true, from: 0.4, to: 5.6, expect: { minTravel: 0.12 } },
];

function scan(label: string, clip: ReturnType<typeof reconstructClip>["clip"], expect: Job["expect"]) {
  const pose = createSkeletonPose();
  const cont = createMotionContinuity();
  let maxTipY = -99;
  let minAnkle = 99;
  let contact = { x: 0, y: 0, z: 0 };
  let ready = { x: 0, y: 0, z: 0 };
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
  const a = poseAngles(pose);
  const moved = ready.distanceTo(contact) > (expect.minTravel ?? 0.18);
  const plant = minAnkle >= 0.029;
  const side =
    expect.tipX === "pos" ? contact.x > 0.02 : expect.tipX === "neg" ? contact.x < -0.02 : true;
  const serve = !expect.serveHigh || maxTipY > 1.85;
  const ok = plant && moved && side && serve;
  console.log(
    (ok ? "ok" : "WARN").padEnd(5),
    label.padEnd(16),
    `frames=${clip.frameCount}`,
    `tip@0.7=${contact.x.toFixed(2)},${contact.y.toFixed(2)},${contact.z.toFixed(2)}`,
    `travel=${ready.distanceTo(contact).toFixed(2)}`,
    `maxY=${maxTipY.toFixed(2)}`,
    `ankle=${minAnkle.toFixed(3)}`,
    `elbow=${a.elbowFlexion.toFixed(0)}`,
  );
  return ok;
}

mkdirSync(outDir, { recursive: true });
let failed = 0;
for (const job of jobs) {
  const raw = JSON.parse(readFileSync(join(tracks, job.file), "utf8")) as { frames: PoseFrame[] };
  if (!raw.frames?.length) {
    console.error(`no frames in ${job.file}`);
    failed += 1;
    continue;
  }
  const sliced = raw.frames.filter((f) => f.time >= job.from && f.time <= job.to);
  const { clip, meta } = reconstructClip(sliced.length >= 8 ? sliced : raw.frames, {
    playerId: "study",
    stroke: job.stroke,
    handedness: "right",
    oneHanded: job.oneHanded,
    skipIsolate: true,
  });
  const shipped = {
    ...clip,
    id: `study/${job.stroke}${job.stroke === "backhand" ? (job.oneHanded ? "-1h" : "-2h") : ""}`,
    playerId: "study",
  };
  writeFileSync(join(outDir, job.out), `${JSON.stringify(shipped)}\n`);
  console.log(
    `wrote ${job.out} vis=${(meta.meanVisibility * 100).toFixed(0)}% hit=${meta.hittingSide} isolated=${meta.isolatedFrom.toFixed(2)}-${meta.isolatedTo.toFixed(2)}`,
  );
  if (!scan(job.out, shipped, job.expect)) failed += 1;
}

if (failed) {
  console.error(`${failed} study clips failed quality scan`);
  process.exit(1);
}
console.log("study clips ok");
