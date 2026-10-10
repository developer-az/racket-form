import { reconstructClip } from "../src/lib/pose/reconstruct.ts";
import { sampleClip } from "../src/lib/motion/clipSample.ts";
import { poseAngles, solveMotionClip } from "../src/lib/motion/solve.ts";
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

function scan(kind: "forehand" | "serve", handedness: "right" | "left") {
  const { clip } = reconstructClip(syntheticSwing(kind), {
    playerId: "check",
    stroke: kind,
    handedness,
    oneHanded: false,
  });
  let maxJump = 0;
  let prev: number | null = null;
  for (let i = 0; i <= 100; i++) {
    solveMotionClip(sampleClip(clip, i / 100), anthro, {
      handedness,
      authoredHand: clip.authoredHand,
      stroke: kind,
      pose,
    });
    const k = poseAngles(pose).leadKneeFlexion;
    if (prev != null) maxJump = Math.max(maxJump, Math.abs(k - prev));
    prev = k;
  }
  console.log(clip.id, handedness, "max knee jump", maxJump.toFixed(2), "deg");
}

scan("forehand", "right");
scan("forehand", "left");
scan("serve", "right");
