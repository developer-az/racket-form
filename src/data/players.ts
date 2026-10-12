import type { PlayerProfile, StrokeProfile, StrokeType } from "@/types/biomechanics";
import { ATHLETES, anthropometricsFromHeight } from "./athletes";
import {
  alcarazForehand,
  alcarazVolley,
  cloneStroke,
  djokovicBackhand,
  djokovicForehand,
  federerForehand,
  federerOneHandedBackhand,
  federerSlice,
  nadalBackhand,
  nadalForehand,
  serenaServe,
  sinnerForehand,
  type StrokeLibrary,
} from "./strokes";

function fillStrokes(partial: Partial<StrokeLibrary>, defaults: StrokeLibrary): StrokeLibrary {
  return {
    forehand: partial.forehand ?? defaults.forehand,
    backhand: partial.backhand ?? defaults.backhand,
    serve: partial.serve ?? defaults.serve,
    slice: partial.slice ?? defaults.slice,
    volley: partial.volley ?? defaults.volley,
  };
}

const federerDefaults: StrokeLibrary = {
  forehand: federerForehand,
  backhand: federerOneHandedBackhand,
  serve: cloneStroke(serenaServe, {
    label: "First Serve (Sliced/Flat)",
    metrics: {
      peakRacketSpeedMs: 48.0,
      contactHeightM: 2.85,
      avgSpinRpm: 2800,
      consistency: {
        contactHeightCv: 2.5,
        timingSdMs: 11,
        pathReproducibility: 94,
        signatureQuirk: "Effortless trophy-to-pronation timing with pinpoint accuracy to T",
      },
      kineticChain: {
        sequence: ["legs", "trunk", "shoulder", "elbow", "wrist", "racket"],
        proximalDistalLagMs: 30,
        xFactorDeg: 52,
        peakGrfN: 1950,
      },
      researchNotes: [
        "Peak serve speeds historically mid–120s mph; racket speed near 45–50 m/s.",
        "High placement efficiency (first-serve points won) over raw max speed.",
      ],
      sources: serenaServe.metrics.sources,
      contactDepthM: 0.08,
      launchAngleDeg: -4.0,
      swingPathDeg: 8,
      impactDurationMs: 3.6,
      grip: "continental",
    },
  }),
  slice: federerSlice,
  volley: cloneStroke(alcarazVolley, {
    metrics: {
      peakRacketSpeedMs: 13.5,
      consistency: {
        contactHeightCv: 5.0,
        timingSdMs: 7,
        pathReproducibility: 95,
        signatureQuirk: "Soft hands with continental face control, classic serve-and-volley DNA",
      },
      researchNotes: alcarazVolley.metrics.researchNotes,
      sources: alcarazVolley.metrics.sources,
      kineticChain: alcarazVolley.metrics.kineticChain,
      contactHeightM: 1.3,
      contactDepthM: 0.5,
      avgSpinRpm: 350,
      launchAngleDeg: 1.5,
      swingPathDeg: 4,
      impactDurationMs: 3.4,
      grip: "continental",
    },
  }),
};

const nadalDefaults: StrokeLibrary = fillStrokes(
  {
    forehand: nadalForehand,
    backhand: nadalBackhand,
    serve: cloneStroke(serenaServe, {
      handedness: "left",
      label: "Lefty Serve",
      metrics: {
        peakRacketSpeedMs: 44.0,
        avgSpinRpm: 3200,
        consistency: {
          contactHeightCv: 3.2,
          timingSdMs: 15,
          pathReproducibility: 90,
          signatureQuirk: "Lefty slice wide on ad court, kicks opponents off the court",
        },
        researchNotes: [
          "Left-handed serve geometry creates unique wide angles on ad side.",
          "Kick second serve with high RPM for clay-court margin.",
        ],
        sources: serenaServe.metrics.sources,
        kineticChain: {
          sequence: ["legs", "trunk", "shoulder", "elbow", "wrist", "racket"],
          proximalDistalLagMs: 30,
          xFactorDeg: 50,
          peakGrfN: 1850,
        },
        contactHeightM: 2.7,
        contactDepthM: 0.1,
        launchAngleDeg: -2.5,
        swingPathDeg: 12,
        impactDurationMs: 3.9,
        grip: "continental",
      },
    }),
    slice: cloneStroke(federerSlice, {
      handedness: "left",
      metrics: {
        peakRacketSpeedMs: 17.0,
        avgSpinRpm: -1600,
        consistency: {
          contactHeightCv: 5.5,
          timingSdMs: 14,
          pathReproducibility: 88,
          signatureQuirk: "Used as change-up; less signature than the heavy topspin FH",
        },
        researchNotes: federerSlice.metrics.researchNotes,
        sources: federerSlice.metrics.sources,
        kineticChain: federerSlice.metrics.kineticChain,
        contactHeightM: 0.95,
        contactDepthM: 0.35,
        launchAngleDeg: 5.0,
        swingPathDeg: -22,
        impactDurationMs: 5.2,
        grip: "continental",
      },
    }),
    volley: cloneStroke(federerDefaults.volley, { handedness: "left", label: "Forehand Volley (Lefty)" }),
  },
  {
    ...federerDefaults,
    forehand: nadalForehand,
  },
);

const djokovicDefaults: StrokeLibrary = fillStrokes(
  {
    forehand: djokovicForehand,
    backhand: djokovicBackhand,
    serve: cloneStroke(serenaServe, {
      label: "First Serve",
      metrics: {
        peakRacketSpeedMs: 46.5,
        avgSpinRpm: 2600,
        consistency: {
          contactHeightCv: 2.8,
          timingSdMs: 12,
          pathReproducibility: 93,
          signatureQuirk: "Precise placement down the T under pressure, timing over max velocity",
        },
        researchNotes: [
          "Serve used as setup for +1 FH; accuracy prioritized in clutch moments.",
        ],
        sources: serenaServe.metrics.sources,
        kineticChain: {
          ...serenaServe.metrics.kineticChain,
          peakGrfN: 1900,
        },
        contactHeightM: 2.78,
        contactDepthM: 0.09,
        launchAngleDeg: -3.8,
        swingPathDeg: 6,
        impactDurationMs: 3.7,
        grip: "continental",
      },
    }),
    slice: cloneStroke(federerSlice, {
      label: "Backhand Slice",
      metrics: {
        ...federerSlice.metrics,
        peakRacketSpeedMs: 17.8,
        consistency: {
          contactHeightCv: 4.0,
          timingSdMs: 10,
          pathReproducibility: 94,
          signatureQuirk: "Neutralizing slice used to change rhythm and stay in the point",
        },
      },
    }),
  },
  federerDefaults,
);

const serenaDefaults: StrokeLibrary = fillStrokes(
  {
    forehand: cloneStroke(federerForehand, {
      label: "Power Forehand",
      metrics: {
        peakRacketSpeedMs: 30.5,
        avgSpinRpm: 2500,
        contactHeightM: 1.2,
        consistency: {
          contactHeightCv: 4.6,
          timingSdMs: 13,
          pathReproducibility: 91,
          signatureQuirk: "Early unit turn into open-stance power FH with fearless court position",
        },
        researchNotes: [
          "Among highest WTA FH ball speeds historically.",
          "Open stance + strong leg drive transfers mass into racket.",
        ],
        sources: federerForehand.metrics.sources,
        kineticChain: {
          sequence: ["legs", "hips", "trunk", "shoulder", "elbow", "wrist", "racket"],
          proximalDistalLagMs: 34,
          xFactorDeg: 46,
          peakGrfN: 1600,
        },
        contactDepthM: 0.42,
        launchAngleDeg: 7.5,
        swingPathDeg: 26,
        impactDurationMs: 4.0,
        grip: "semiWestern",
      },
    }),
    backhand: cloneStroke(djokovicBackhand, {
      label: "Two-Handed Backhand",
      metrics: {
        ...djokovicBackhand.metrics,
        peakRacketSpeedMs: 25.8,
        avgSpinRpm: 1700,
        contactDepthM: 0.55,
        consistency: {
          contactHeightCv: 4.0,
          timingSdMs: 12,
          pathReproducibility: 92,
          signatureQuirk: "Aggressive BH flat drive taken early to seize time",
        },
      },
    }),
    serve: serenaServe,
    volley: cloneStroke(alcarazVolley, {
      metrics: {
        ...alcarazVolley.metrics,
        peakRacketSpeedMs: 15.0,
        consistency: {
          contactHeightCv: 5.5,
          timingSdMs: 9,
          pathReproducibility: 90,
          signatureQuirk: "Aggressive first volley after serve, punch through the court",
        },
      },
    }),
  },
  federerDefaults,
);

const alcarazDefaults: StrokeLibrary = fillStrokes(
  {
    forehand: alcarazForehand,
    backhand: cloneStroke(djokovicBackhand, {
      metrics: {
        ...djokovicBackhand.metrics,
        peakRacketSpeedMs: 26.0,
        avgSpinRpm: 2005,
        consistency: {
          contactHeightCv: 4.4,
          timingSdMs: 12,
          pathReproducibility: 91,
          signatureQuirk: "Can flatten or shape BH; rising-ball aggression",
        },
      },
    }),
    serve: cloneStroke(serenaServe, {
      metrics: {
        peakRacketSpeedMs: 47.0,
        avgSpinRpm: 2700,
        contactHeightM: 2.8,
        consistency: {
          contactHeightCv: 3.0,
          timingSdMs: 13,
          pathReproducibility: 91,
          signatureQuirk: "Athletic leg drive with modern trophy, power into the court",
        },
        researchNotes: serenaServe.metrics.researchNotes,
        sources: serenaServe.metrics.sources,
        kineticChain: {
          sequence: ["legs", "trunk", "shoulder", "elbow", "wrist", "racket"],
          proximalDistalLagMs: 28,
          xFactorDeg: 54,
          peakGrfN: 2000,
        },
        contactDepthM: 0.1,
        launchAngleDeg: -3.2,
        swingPathDeg: 7,
        impactDurationMs: 3.7,
        grip: "continental",
      },
    }),
    volley: alcarazVolley,
    slice: cloneStroke(federerSlice, {
      metrics: {
        ...federerSlice.metrics,
        consistency: {
          contactHeightCv: 5.0,
          timingSdMs: 12,
          pathReproducibility: 90,
          signatureQuirk: "Slice used to set up drop-shot / attack patterns",
        },
      },
    }),
  },
  federerDefaults,
);

/** Compact early-contact mold, flatter drive than Alcaraz, still modern RPM. */
const sinnerDefaults: StrokeLibrary = fillStrokes(
  {
    forehand: sinnerForehand,
    backhand: cloneStroke(djokovicBackhand, {
      metrics: {
        ...djokovicBackhand.metrics,
        peakRacketSpeedMs: 26.5,
        avgSpinRpm: 2235,
        consistency: {
          contactHeightCv: 4.0,
          timingSdMs: 11,
          pathReproducibility: 93,
          signatureQuirk: "Two-hand wall, redirects pace early",
        },
      },
    }),
    serve: cloneStroke(serenaServe, {
      metrics: {
        peakRacketSpeedMs: 48.5,
        avgSpinRpm: 2500,
        contactHeightM: 2.88,
        consistency: {
          contactHeightCv: 2.8,
          timingSdMs: 12,
          pathReproducibility: 92,
          signatureQuirk: "High trophy, clean slot, first-serve priority",
        },
        researchNotes: serenaServe.metrics.researchNotes,
        sources: serenaServe.metrics.sources,
        kineticChain: {
          sequence: ["legs", "trunk", "shoulder", "elbow", "wrist", "racket"],
          proximalDistalLagMs: 26,
          xFactorDeg: 56,
          peakGrfN: 1950,
        },
        contactDepthM: 0.1,
        launchAngleDeg: -3.5,
        swingPathDeg: 6,
        impactDurationMs: 3.6,
        grip: "continental",
      },
    }),
    volley: alcarazVolley,
    slice: cloneStroke(federerSlice, {
      metrics: {
        ...federerSlice.metrics,
        consistency: {
          contactHeightCv: 4.8,
          timingSdMs: 11,
          pathReproducibility: 91,
          signatureQuirk: "Slice to change height and recover the center",
        },
      },
    }),
  },
  federerDefaults,
);

/** Segment lengths from each athlete's own listed height and mass. */
const ANTHRO = Object.fromEntries(
  Object.entries(ATHLETES).map(([id, a]) => [id, anthropometricsFromHeight(a.spec.height.value, a.spec.mass.value)]),
) as Record<keyof typeof ATHLETES, ReturnType<typeof anthropometricsFromHeight>>;

/**
 * Serve impact height ≈ 1.47 × standing height: racket
 * centre at full reach plus a small jump, as solved by our skeleton. Modeled.
 */
const SERVE_IMPACT_PER_HEIGHT = 1.47;

/**
 * Attach the athlete's style / published numbers / quirks to each stroke and
 * keep the keyframe spin and speed readouts consistent with the metrics.
 */
function withAthlete(id: string, lib: StrokeLibrary): StrokeLibrary {
  const athlete = ATHLETES[id];
  const out = {} as StrokeLibrary;
  for (const type of Object.keys(lib) as StrokeType[]) {
    const base = lib[type];
    const extra = athlete?.strokes[type] ?? {};
    const metrics = { ...base.metrics };
    if (type === "serve") {
      metrics.contactHeightM =
        Math.round(athlete.spec.height.value * SERVE_IMPACT_PER_HEIGHT * 100) / 100;
    }
    const measuredSpin = extra.published?.find((p) => p.id === "fhSpin" || p.id === "bhSpin");
    if (measuredSpin) metrics.avgSpinRpm = measuredSpin.value;
    const stroke: StrokeProfile = {
      ...base,
      metrics,
      style: extra.style ?? base.style,
      published: extra.published ?? [],
      quirks: extra.quirks ?? [],
      keyframes: base.keyframes.map((k) => ({
        ...k,
        spinRpm: k.phase === "contact" || k.phase === "followThrough" ? metrics.avgSpinRpm : 0,
        racketSpeedMs: k.phase === "contact" ? metrics.peakRacketSpeedMs : k.racketSpeedMs,
      })),
    };
    out[type] = stroke;
  }
  return out;
}

export const PLAYERS: PlayerProfile[] = [
  {
    id: "federer",
    name: "Roger Federer",
    shortName: "Federer",
    nationality: "Switzerland",
    era: "2003–2022",
    playingStyle: "All-court classic, efficiency, timing, disguise",
    dominantHand: "right",
    backhandStyle: "oneHanded",
    color: "#1B4F72",
    accent: "#F4D03F",
    anthropometrics: ANTHRO.federer,
    spec: ATHLETES.federer.spec,
    strokes: withAthlete("federer", federerDefaults),
    biography:
      "Model of kinetic-chain efficiency. Lab and match analyses show high racket-path reproducibility with moderate spin and elite timing windows, form that looks effortless because proximal segments do the work.",
  },
  {
    id: "nadal",
    name: "Rafael Nadal",
    shortName: "Nadal",
    nationality: "Spain",
    era: "2001–2024",
    playingStyle: "Lefty baseliner, extreme topspin, grit, geometry",
    dominantHand: "left",
    backhandStyle: "twoHanded",
    color: "#1D8348",
    accent: "#E74C3C",
    anthropometrics: ANTHRO.nadal,
    spec: ATHLETES.nadal.spec,
    strokes: withAthlete("nadal", nadalDefaults),
    biography:
      "Defined the modern heavy-topspin forehand: strong semi-western grip at the butt cap, steep swing plane and a reverse finish over the hitting shoulder. About 3,200 rpm on average in high-speed video, roughly 20% more than Federer.",
  },
  {
    id: "djokovic",
    name: "Novak Djokovic",
    shortName: "Djokovic",
    nationality: "Serbia",
    era: "2003–present",
    playingStyle: "Defensive-aggressive, flexibility, balance, BH wall",
    dominantHand: "right",
    backhandStyle: "twoHanded",
    color: "#5D6D7E",
    accent: "#5DADE2",
    anthropometrics: ANTHRO.djokovic,
    spec: ATHLETES.djokovic.spec,
    strokes: withAthlete("djokovic", djokovicDefaults),
    biography:
      "Exceptional hip and thoracic ROM expand the viable contact zone. Two-handed backhand kinematics prioritize early preparation and head stability, consistency encoded in joint timing, not just talent.",
  },
  {
    id: "serena",
    name: "Serena Williams",
    shortName: "Serena",
    nationality: "USA",
    era: "1995–2022",
    playingStyle: "First-strike power, serve + FH dominance",
    dominantHand: "right",
    backhandStyle: "twoHanded",
    color: "#6C3483",
    accent: "#F5B041",
    anthropometrics: ANTHRO.serena,
    spec: ATHLETES.serena.spec,
    strokes: withAthlete("serena", serenaDefaults),
    biography:
      "Serve kinetic chain is a textbook of proximal-to-distal sequencing: leg drive, trunk rotation, shoulder internal rotation, and wrist. Power with repeatable contact height under championship pressure.",
  },
  {
    id: "alcaraz",
    name: "Carlos Alcaraz",
    shortName: "Alcaraz",
    nationality: "Spain",
    era: "2021–present",
    playingStyle: "Modern explosive all-courter, RPM, drop shot, athleticism",
    dominantHand: "right",
    backhandStyle: "twoHanded",
    color: "#0E6655",
    accent: "#F39C12",
    anthropometrics: ANTHRO.alcaraz,
    spec: ATHLETES.alcaraz.spec,
    strokes: withAthlete("alcaraz", alcarazDefaults),
    biography:
      "Combines Nadal-like spin geometry with Federer-like all-court creativity. Biomechanically: high peak GRF, short proximal-distal lag, and disguise, same unit turn for FH drive or drop shot.",
  },
  {
    id: "sinner",
    name: "Jannik Sinner",
    shortName: "Sinner",
    nationality: "Italy",
    era: "2019–present",
    playingStyle: "Flat-to-heavy first strike, clean takeback, early contact, Speed Pro mold",
    dominantHand: "right",
    backhandStyle: "twoHanded",
    color: "#1A5276",
    accent: "#E74C3C",
    anthropometrics: ANTHRO.sinner,
    spec: ATHLETES.sinner.spec,
    strokes: withAthlete("sinner", sinnerDefaults),
    biography:
      "Compact unit turn, early contact, and a linear drive through the ball. Less windshield-wiper than clay archetypes, more of a Speed-frame mold with height and clean timing.",
  },
];

export function getPlayer(id: string): PlayerProfile | undefined {
  return PLAYERS.find((p) => p.id === id);
}

export function getStroke(playerId: string, stroke: StrokeType) {
  const player = getPlayer(playerId);
  return player?.strokes[stroke];
}

export const STROKE_LABELS: Record<StrokeType, string> = {
  forehand: "Forehand",
  backhand: "Backhand",
  serve: "Serve",
  slice: "Slice",
  volley: "Volley",
};
