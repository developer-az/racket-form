import type { StrokeType } from "@/types/biomechanics";
import type { MotionClip } from "@/lib/motion/types";
import { PLAYERS } from "@/data/players";
import forehand from "./study/forehand.json";
import backhand1h from "./study/backhand-1h.json";
import backhand2h from "./study/backhand-2h.json";
import serve from "./study/serve.json";
import slice from "./study/slice.json";
import volley from "./study/volley.json";

export type SeedMeta = {
  name: string;
  license: string;
  href: string;
};

const FOREHAND = forehand as MotionClip;
const BACKHAND_1H = backhand1h as MotionClip;
const BACKHAND_2H = backhand2h as MotionClip;
const SERVE = serve as MotionClip;
const SLICE = slice as MotionClip;
const VOLLEY = volley as MotionClip;

export const SEED_META: Record<StrokeType, SeedMeta> = {
  forehand: {
    name: "Drive con pelota — Dardo 86 7",
    license: "CC BY-SA 3.0",
    href: "https://commons.wikimedia.org/wiki/File:Drive_con_pelota.ogv",
  },
  backhand: {
    name: "Revés con pelota — Dardo 86 7",
    license: "CC BY-SA 3.0",
    href: "https://commons.wikimedia.org/wiki/File:Reves_una_mano_con_pelota.ogv",
  },
  serve: {
    name: "Cacioppo et al. 2014 serve — CC BY 4.0",
    license: "CC BY 4.0",
    href: "https://commons.wikimedia.org/wiki/File:Intention-understanding-over-T-a-neuroimaging-study-on-shared-representations-and-tennis-return-Movie1.ogv",
  },
  slice: {
    name: "Slice con pelota — Dardo 86 7",
    license: "CC BY-SA 3.0",
    href: "https://commons.wikimedia.org/wiki/File:Slice_con_pelota.ogv",
  },
  volley: {
    name: "Volea con pelota — Dardo 86 7",
    license: "CC BY-SA 3.0",
    href: "https://commons.wikimedia.org/wiki/File:Volea_con_pelota.ogv",
  },
};

function sourceClip(stroke: StrokeType, oneHanded: boolean): MotionClip {
  if (stroke === "backhand") return oneHanded ? BACKHAND_1H : BACKHAND_2H;
  if (stroke === "forehand") return FOREHAND;
  if (stroke === "serve") return SERVE;
  if (stroke === "slice") return SLICE;
  return VOLLEY;
}

export function cloneSeedClip(playerId: string, stroke: StrokeType, oneHanded: boolean): MotionClip {
  const src = sourceClip(stroke, oneHanded);
  return {
    ...src,
    id: `${playerId}/${stroke}`,
    playerId,
    stroke,
    oneHanded,
    root: src.root.slice(),
    quats: src.quats.slice(),
    world: src.world?.slice(),
    phases: src.phases.map((p) => ({ ...p })),
  };
}

export function allSeedTargets(): { playerId: string; stroke: StrokeType; oneHanded: boolean }[] {
  const out: { playerId: string; stroke: StrokeType; oneHanded: boolean }[] = [];
  for (const player of PLAYERS) {
    for (const stroke of Object.keys(player.strokes) as StrokeType[]) {
      out.push({ playerId: player.id, stroke, oneHanded: player.strokes[stroke].oneHanded });
    }
  }
  return out;
}
