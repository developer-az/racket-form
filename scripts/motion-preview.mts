/**
 * Offline motion check: renders orthographic filmstrips (behind / side / top)
 * of a stroke and reports arm-reach overruns.
 *
 *   npx tsx scripts/motion-preview.mts <player> <stroke> [out.svg]
 */
import fs from "node:fs";
import * as THREE from "three";
import { getPlayer } from "../src/data/players";
import { createSkeletonPose, getStrokeMotion, solveStrokePose } from "../src/lib/motion/solver";
import type { StrokeType } from "../src/types/biomechanics";

const [playerId = "federer", strokeType = "forehand", outPath = `/tmp/motion-${playerId}-${strokeType}.svg`] =
  process.argv.slice(2);
const player = getPlayer(playerId);
if (!player) throw new Error(`unknown player ${playerId}`);
const stroke = player.strokes[strokeType as StrokeType];
const motion = getStrokeMotion(stroke, player.anthropometrics.heightM);

const N = Number(process.env.N ?? 12);
const ts = Array.from({ length: N }, (_, i) => i / N);
// Always include the exact contact frame
ts.push(motion.contactT);
ts.sort((a, b) => a - b);

const cell = Number(process.env.CELL ?? 200);
const views = ["behind", "side", "top"] as const;
const W = ts.length * cell;
const Hh = views.length * cell + 30;
let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${Hh}" font-family="monospace" font-size="10"><rect width="100%" height="100%" fill="#f6f6f2"/>`;

function proj(v: THREE.Vector3, view: (typeof views)[number]): [number, number] {
  const k = cell / 3.0;
  if (view === "behind") return [cell / 2 + v.x * k, cell - 8 - v.y * k];
  if (view === "side") return [cell / 2 + v.z * k, cell - 8 - v.y * k]; // net to the left
  return [cell / 2 + v.x * k, cell / 2 + v.z * k + 10]; // net up
}

const pose = createSkeletonPose();
ts.forEach((t, col) => {
  solveStrokePose(pose, stroke, player.anthropometrics, t);
  const p = pose;
  views.forEach((view, row) => {
    const ox = col * cell;
    const oy = row * cell + 20;
    const line = (a: THREE.Vector3, b: THREE.Vector3, color: string, w = 3) => {
      const [x1, y1] = proj(a, view);
      const [x2, y2] = proj(b, view);
      svg += `<line x1="${ox + x1}" y1="${oy + y1}" x2="${ox + x2}" y2="${oy + y2}" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`;
    };
    svg += `<rect x="${ox}" y="${oy}" width="${cell}" height="${cell}" fill="none" stroke="#ddd"/>`;
    if (view !== "top") {
      const [gx, gy] = proj(new THREE.Vector3(-2, 0, -2), view);
      svg += `<line x1="${ox}" y1="${oy + gy}" x2="${ox + cell}" y2="${oy + gy}" stroke="#9a9" />`;
      void gx;
    }
    line(p.leadHip, p.leadKnee, "#357");
    line(p.leadKnee, p.leadAnkle, "#357");
    line(p.trailHip, p.trailKnee, "#579");
    line(p.trailKnee, p.trailAnkle, "#579");
    line(p.leadHip, p.trailHip, "#333");
    line(p.pelvis, p.chest, "#333", 5);
    line(p.hitShoulder, p.nonHitShoulder, "#333");
    line(p.hitShoulder, p.hitElbow, "#c33");
    line(p.hitElbow, p.hitWrist, "#c33");
    line(p.hitWrist, p.hitHand, "#c33", 2);
    line(p.nonHitShoulder, p.nonHitElbow, "#36c");
    line(p.nonHitElbow, p.nonHitWrist, "#36c");
    line(p.nonHitWrist, p.nonHitHand, "#36c", 2);
    line(p.racketButt, p.racketTip, "#111", 2);
    // face normal tick at the head centre
    const n = p.racketHeadCenter.clone().addScaledVector(p.racketFaceNormal, 0.25);
    line(p.racketHeadCenter, n, "#e90", 2);
    const [hx, hy] = proj(p.head, view);
    svg += `<circle cx="${ox + hx}" cy="${oy + hy}" r="6" fill="#333"/>`;
    if (row === 0) {
      const m = p.measured;
      svg += `<text x="${ox + 3}" y="${oy - 6}">t${t.toFixed(2)} el${m.elbowFlexion.toFixed(0)} kn${m.frontKneeFlexion.toFixed(0)}</text>`;
    }
  });
});
svg += "</svg>";
fs.writeFileSync(outPath, svg);

// Reach audit: authored hand vs solved hand
const audit: string[] = [];
for (let i = 0; i <= 100; i++) {
  const t = i / 100;
  solveStrokePose(pose, stroke, player.anthropometrics, t);
  const d = pose.hitHand.distanceTo(pose.hitShoulder);
  const reach = player.anthropometrics.heightM * (player.anthropometrics.upperArmRatio + player.anthropometrics.forearmRatio);
  if (d > reach + 0.08) audit.push(`t=${t.toFixed(2)} hand ${d.toFixed(2)} > reach`);
  if (pose.racketTip.y < 0.03) audit.push(`t=${t.toFixed(2)} racket tip in the court (${pose.racketTip.y.toFixed(2)})`);
}
console.log(outPath, `contact@${motion.contactT}`, "head", pose && "");
solveStrokePose(pose, stroke, player.anthropometrics, motion.contactT);
console.log(
  "contact head centre",
  pose.racketHeadCenter.toArray().map((x) => x.toFixed(2)).join(", "),
  "target height",
  stroke.metrics.contactHeightM,
);
if (audit.length) console.log(audit.join("\n"));
