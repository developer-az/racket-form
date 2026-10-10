import { reconstructClip } from "../src/lib/pose/reconstruct.ts";
import { sampleClip } from "../src/lib/motion/clipSample.ts";
import { solveMotionClip } from "../src/lib/motion/solve.ts";
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

function run(label: string, kind: "forehand" | "backhand" | "serve", t: number) {
  const { clip } = reconstructClip(syntheticSwing(kind), {
    playerId: "check",
    stroke: kind,
    handedness: "right",
    oneHanded: kind === "backhand",
  });
  solveMotionClip(sampleClip(clip, t), anthro, {
    handedness: "right",
    authoredHand: clip.authoredHand,
    stroke: kind,
    pose,
  });
  const tip = pose.racketTip;
  console.log(
    label.padEnd(16),
    [tip.x, tip.y, tip.z].map((n) => n.toFixed(2)).join(","),
    "wrist",
    pose.hitWrist.y.toFixed(2),
    "head",
    pose.head.y.toFixed(2),
  );
}

run("fh ready", "forehand", 0);
run("fh contact", "forehand", 0.68);
run("bh contact", "backhand", 0.68);
run("serve trophy", "serve", 0.3);
run("serve contact", "serve", 0.7);
