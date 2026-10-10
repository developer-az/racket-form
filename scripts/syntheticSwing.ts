/**
 * Test-only MediaPipe-shaped landmark tracks.
 * Not a shipped clip. Used to prove reconstruct → FK without a video file.
 */
import { BLAZE_COUNT, type PoseFrame } from "../src/lib/pose/landmarks.ts";

function courtToMp(x: number, y: number, z: number) {
  return { x, y: -y, z: -z, visibility: 0.95 };
}

function emptyWorld() {
  return Array.from({ length: BLAZE_COUNT }, () => courtToMp(0, 1, 0));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function stance(world: ReturnType<typeof emptyWorld>, t: number, side: 1 | -1) {
  const sway = Math.sin(t * Math.PI) * 0.04 * side;
  world[23] = courtToMp(-0.1 + sway * 0.2, 0.95, 0.02);
  world[24] = courtToMp(0.1 + sway * 0.2, 0.95, 0.04);
  world[11] = courtToMp(-0.2, 1.46, -0.02);
  world[12] = courtToMp(0.2, 1.46, 0.0);
  world[0] = courtToMp(0.0, 1.72, -0.05);
  world[7] = courtToMp(-0.07, 1.7, -0.03);
  world[8] = courtToMp(0.07, 1.7, -0.03);
  world[25] = courtToMp(-0.12, 0.5, -0.02);
  world[26] = courtToMp(0.12, 0.5, 0.06);
  world[27] = courtToMp(-0.12, 0.03, -0.04);
  world[28] = courtToMp(0.12, 0.03, 0.08);
  world[13] = courtToMp(-0.28, 1.18, 0.02);
  world[15] = courtToMp(-0.3, 0.95, 0.04);
  world[17] = courtToMp(-0.33, 0.9, 0.05);
  world[19] = courtToMp(-0.32, 0.9, 0.02);
}

export function syntheticSwing(kind: "forehand" | "backhand" | "serve", frames = 48): PoseFrame[] {
  const out: PoseFrame[] = [];
  for (let i = 0; i < frames; i++) {
    const t = i / (frames - 1);
    const world = emptyWorld();
    if (kind === "serve") {
      stance(world, t, 1);
      const trophy = t < 0.4 ? t / 0.4 : 1;
      const strike = t < 0.4 ? 0 : (t - 0.4) / 0.6;
      const wy = t < 0.4 ? lerp(1.35, 1.82, trophy) : lerp(1.55, 2.18, strike);
      const wz = t < 0.4 ? lerp(0.12, 0.05, trophy) : lerp(0.05, -0.28, strike);
      const wx = lerp(0.22, 0.08, t);
      world[14] = courtToMp(0.28, lerp(1.2, 1.7, t), 0.04);
      world[16] = courtToMp(wx, wy, wz);
      world[18] = courtToMp(wx + 0.03, wy + 0.04, wz - 0.03);
      world[20] = courtToMp(wx + 0.02, wy + 0.05, wz - 0.05);
    } else {
      const side = kind === "forehand" ? 1 : -1;
      stance(world, t, side as 1 | -1);
      const back = t < 0.45 ? t / 0.45 : 1;
      const thru = t < 0.45 ? 0 : (t - 0.45) / 0.55;
      const wx = side * lerp(0.22, 0.48, t);
      const wy = t < 0.45 ? lerp(1.05, 1.18, back) : lerp(1.18, 1.32, thru);
      const wz = t < 0.45 ? lerp(0.15, 0.38, back) : lerp(0.38, -0.55, thru);
      const elbow = kind === "forehand" ? 14 : 13;
      const wrist = kind === "forehand" ? 16 : 15;
      const pinky = kind === "forehand" ? 18 : 17;
      const index = kind === "forehand" ? 20 : 19;
      world[elbow] = courtToMp(side * 0.32, 1.15, wz * 0.4);
      world[wrist] = courtToMp(wx, wy, wz);
      world[pinky] = courtToMp(wx + side * 0.04, wy - 0.02, wz + 0.01);
      world[index] = courtToMp(wx + side * 0.03, wy + 0.01, wz - 0.04);
    }
    out.push({ time: i / 24, world });
  }
  return out;
}
