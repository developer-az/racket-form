import type { PhaseKeyframe, StrokeProfile, StrokeType } from "@/types/biomechanics";

/**
 * Phase timeline for a stroke. Body and racket motion come from the archetype
 * targets in `src/lib/motion/archetypes.ts`, mapped onto these phase timings.
 */
function kf(
  phase: PhaseKeyframe["phase"],
  t: number,
  durationMs: number,
  racketSpeedMs: number,
  spinRpm: number,
  coachingCue: string,
): PhaseKeyframe {
  return { phase, t, durationMs, racketSpeedMs, spinRpm, coachingCue };
}

/**
 * Federer FH — unit turn → loop → lag → kinetic chain → contact out front → high finish.
 */
export const federerForehand: StrokeProfile = {
  type: "forehand",
  label: "Forehand Drive",
  handedness: "right",
  oneHanded: true,
  metrics: {
    peakRacketSpeedMs: 28.4,
    contactHeightM: 1.12,
    contactDepthM: 0.45,
    avgSpinRpm: 2700,
    launchAngleDeg: 8.5,
    swingPathDeg: 28,
    impactDurationMs: 4.2,
    grip: "eastern",
    kineticChain: {
      sequence: ["legs", "hips", "trunk", "shoulder", "elbow", "wrist", "racket"],
      proximalDistalLagMs: 38,
      xFactorDeg: 42,
      peakGrfN: 1450,
    },
    consistency: {
      contactHeightCv: 4.1,
      timingSdMs: 12,
      pathReproducibility: 94,
      signatureQuirk: "Late wrist lag with early hip clearance — creates whip without forced forearm",
    },
    researchNotes: [
      "Peak racket speed ~28 m/s at contact aligns with elite FH lab means (Elliott et al.).",
      "Lower spin than Nadal; flatter launch for penetrating depth on hard courts.",
      "X-factor ~40–45° with minimal wasted vertical force — efficiency over raw RPM.",
      "Wrist stays laid back (extended) until late acceleration, then flexes through contact (lag → snap).",
    ],
    sources: [
      "Elliott, B. (2006). Biomechanics and tennis. Br J Sports Med.",
      "Reid, M. et al. (2013). Effect of posture on FH kinematics. J Sports Sci.",
      "ITF Biomechanics of Advanced Tennis (2003).",
    ],
  },
  keyframes: [
    kf("ready", 0, 180, 2.1, 0, "Athletic base, racket head above wrists in front of the body"),
    kf(
      "unitTurn",
      0.12,
      220,
      4.5,
      0,
      "Unit turn: hips coil first — athletic load on the trail leg, not a sit",),
    kf(
      "backswing",
      0.28,
      260,
      6.2,
      0,
      "Loop backswing on the FH wing — tip up, wrist fully laid back (loaded)",),
    kf(
      "acceleration",
      0.48,
      140,
      22.8,
      0,
      "Proximal-to-distal: hips open while shoulders and wrist stay lagged",),
    kf(
      "contact",
      0.62,
      40,
      28.4,
      2700,
      "Contact out in front on the FH side — wrist releases through the ball",),
    kf(
      "followThrough",
      0.82,
      280,
      14.0,
      2700,
      "High finish over the opposite shoulder — face stays closed on the path",),
    kf(
      "recovery",
      1,
      200,
      3.0,
      0,
      "Split-step ready for next ball",),
  ],
};

/** Nadal FH — lefty mirror of heavy topspin pattern (western, steep path, wipe) */
export const nadalForehand: StrokeProfile = {
  type: "forehand",
  label: "Forehand (Heavy Topspin)",
  handedness: "left",
  oneHanded: true,
  metrics: {
    peakRacketSpeedMs: 31.2,
    contactHeightM: 1.28,
    contactDepthM: 0.35,
    avgSpinRpm: 3800,
    launchAngleDeg: 14.2,
    swingPathDeg: 48,
    impactDurationMs: 4.8,
    grip: "western",
    kineticChain: {
      sequence: ["legs", "hips", "trunk", "shoulder", "forearm", "wrist", "racket"],
      proximalDistalLagMs: 32,
      xFactorDeg: 48,
      peakGrfN: 1680,
    },
    consistency: {
      contactHeightCv: 5.8,
      timingSdMs: 15,
      pathReproducibility: 91,
      signatureQuirk: "Extreme low-to-high path with windshield-wiper forearm pronation after contact",
    },
    researchNotes: [
      "Match-tracked FH spin commonly 3200–4000+ rpm — among highest on tour.",
      "Western grip raises contact height and steepens swing plane vs eastern grips.",
      "Prep tip climbs beside the skull via elevation (~85–95°) with elbow tucked (~55–70° abd) — compact, not wing-flared.",
      "Greater vertical racket velocity component (~40–50% of resultant) vs Federer.",
      "Wrist lag is exaggerated: deep extension in the slot, then ulnar-deviation wipe after contact.",
    ],
    sources: [
      "Choppin et al. / Hawk-Eye spin analyses (ATP).",
      "Elliott & Reid — grip effects on swing plane.",
      "ITF Advanced Coaching — topspin mechanics.",
      "Reid et al. — FH shoulder kinematics (prep abd typically mid-range, not horizontal).",
    ],
  },
  keyframes: [
    kf("ready", 0, 180, 2.0, 0, "Wide base — western grip, tip already lively above the wrists"),
    kf(
      "unitTurn",
      0.1,
      200,
      4.0,
      0,
      "Unit turn — tip rising beside the head, elbow tucked (tour ~55–70° abd)",),
    kf(
      "backswing",
      0.26,
      280,
      5.5,
      0,
      "Racket tip at the head — western height with a compact elbow, full wrist lag",),
    kf(
      "acceleration",
      0.48,
      150,
      24.5,
      0,
      "Explosive uncoil — hips fire while shoulders and wrist stay lagged",),
    kf(
      "contact",
      0.6,
      45,
      31.2,
      3800,
      "Steep ascending brush — high contact, face closed for RPM",),
    kf(
      "followThrough",
      0.8,
      300,
      16.0,
      3800,
      "Windshield-wiper finish — face stays closed through the wipe",),
    kf(
      "recovery",
      1,
      220,
      3.2,
      0,
      "Recover behind baseline",),
  ],
};

/**
 * Alcaraz FH — explosive righty: deep athletic load, high loop (not head-wrap),
 * steep brush, disguise-ready unit turn. Distinct from Nadal wipe and Sinner compact.
 */
export const alcarazForehand: StrokeProfile = {
  type: "forehand",
  label: "Forehand (Explosive)",
  handedness: "right",
  oneHanded: true,
  metrics: {
    peakRacketSpeedMs: 30.8,
    contactHeightM: 1.22,
    contactDepthM: 0.38,
    avgSpinRpm: 3400,
    launchAngleDeg: 12.0,
    swingPathDeg: 42,
    impactDurationMs: 4.5,
    grip: "semiWestern",
    kineticChain: {
      sequence: ["legs", "hips", "trunk", "shoulder", "forearm", "wrist", "racket"],
      proximalDistalLagMs: 30,
      xFactorDeg: 50,
      peakGrfN: 1750,
    },
    consistency: {
      contactHeightCv: 5.2,
      timingSdMs: 14,
      pathReproducibility: 89,
      signatureQuirk: "Drop-shot disguise from same unit turn as heavy FH — elite deception",
    },
    researchNotes: [
      "Modern semi-western with extreme athleticism and shared unit-turn disguise.",
      "High RPM + net clearance; loop is high but tip does not wrap the skull like Nadal.",
      "Prep stays compact laterally (~58–68° abd) — tip height from elev/flex, not flared wings.",
      "Leg drive / GRF among the highest on tour for a FH mold.",
    ],
    sources: [
      "ATP / Hawk-Eye spin composites — modern heavy FH.",
      "ITF Advanced Coaching — semi-western progressions.",
      "Reid et al. — FH shoulder kinematics (prep abd mid-range).",
    ],
  },
  keyframes: [
    kf(
      "ready",
      0,
      160,
      2.2,
      0,
      "Wide athletic base — coiled to explode or disguise",),
    kf(
      "unitTurn",
      0.11,
      200,
      4.2,
      0,
      "Shared unit turn — compact coil, same shape for drop or drive",),
    kf(
      "backswing",
      0.27,
      250,
      5.8,
      0,
      "High athletic loop — tip up, elbow compact (~62°), legs spring-loaded",),
    kf(
      "acceleration",
      0.47,
      140,
      25.0,
      0,
      "Legs fire hard — trunk still separated; racket drops into the slot",),
    kf(
      "contact",
      0.61,
      42,
      30.8,
      3400,
      "Contact out front with a steep brush — RPM without full western wipe",),
    kf(
      "followThrough",
      0.81,
      280,
      15.0,
      3400,
      "High finish — face closed on the path; less wipe than western",),
    kf(
      "recovery",
      1,
      200,
      3.0,
      0,
      "Split-step — already looking for the next ball",),
  ],
};

/**
 * Sinner FH — compact early-contact drive: shorter takeback, flatter path,
 * less lag/wipe than Alcaraz or Nadal. Timing and depth over extreme RPM.
 */
export const sinnerForehand: StrokeProfile = {
  type: "forehand",
  label: "Forehand (First-strike)",
  handedness: "right",
  oneHanded: true,
  metrics: {
    peakRacketSpeedMs: 31.2,
    contactHeightM: 1.18,
    contactDepthM: 0.42,
    avgSpinRpm: 3100,
    launchAngleDeg: 10.5,
    swingPathDeg: 34,
    impactDurationMs: 4.3,
    grip: "semiWestern",
    kineticChain: {
      sequence: ["legs", "hips", "trunk", "shoulder", "forearm", "wrist", "racket"],
      proximalDistalLagMs: 28,
      xFactorDeg: 48,
      peakGrfN: 1680,
    },
    consistency: {
      contactHeightCv: 4.6,
      timingSdMs: 12,
      pathReproducibility: 92,
      signatureQuirk: "Early contact + linear drive — Speed Pro takeback, less extreme wiper",
    },
    researchNotes: [
      "Semi-western with a compact loop; prioritizes timing and depth.",
      "Flatter leave than clay-spin archetypes while still clearing the tape.",
      "Takeback stays shorter and lower than Alcaraz/Nadal — tip near hand/shoulder height (~30–40° elev), never wraps the head.",
      "Contrasts Djokovic’s upright tip-above-hands prep: Sinner flips from a side/low slot with early lag release.",
    ],
    sources: [
      "ATP shot-quality tracking — early-contact FH patterns.",
      "ITF Coaching — compact drive progressions.",
      "Tour FH takeback contrasts — upright (Djokovic) vs compact/side (Sinner).",
    ],
  },
  keyframes: [
    kf(
      "ready",
      0,
      150,
      2.0,
      0,
      "Compact base — quiet tip, early unit turn ready",),
    kf(
      "unitTurn",
      0.12,
      180,
      4.0,
      0,
      "Early unit turn — low tip beside the hip, compact coil",),
    kf(
      "backswing",
      0.28,
      200,
      5.2,
      0,
      "Compact side takeback — tip near hand height, ready to flip/lag",),
    kf(
      "acceleration",
      0.46,
      120,
      24.0,
      0,
      "Linear drive — hips and racket accelerate together, less lag hang",),
    kf(
      "contact",
      0.58,
      38,
      31.2,
      3100,
      "Early contact out in front — flatter path, drive through the ball",),
    kf(
      "followThrough",
      0.8,
      260,
      13.5,
      3100,
      "Through-the-shot finish — face closed, modest ulnar",),
    kf(
      "recovery",
      1,
      180,
      2.8,
      0,
      "Recover to center — already on balance for the next ball",),
  ],
};

/**
 * Djokovic FH — upright tip-above-hands takeback, hands more inside, longer
 * loop with a gravity drop into the slot. Contrasts Sinner’s low/side compact flip.
 * Semi-western; research lag ~40–45 ms proximal–distal; prep abd ~55–65°.
 */
export const djokovicForehand: StrokeProfile = {
  type: "forehand",
  label: "Forehand (Flexible)",
  handedness: "right",
  oneHanded: true,
  metrics: {
    peakRacketSpeedMs: 27.5,
    contactHeightM: 1.15,
    contactDepthM: 0.38,
    avgSpinRpm: 2900,
    launchAngleDeg: 9.0,
    swingPathDeg: 30,
    impactDurationMs: 4.3,
    grip: "semiWestern",
    kineticChain: {
      sequence: ["legs", "hips", "trunk", "shoulder", "elbow", "wrist", "racket"],
      proximalDistalLagMs: 42,
      xFactorDeg: 44,
      peakGrfN: 1500,
    },
    consistency: {
      contactHeightCv: 3.9,
      timingSdMs: 11,
      pathReproducibility: 95,
      signatureQuirk: "Upright tip-above-hands prep + gravity drop — late contact without breakdown",
    },
    researchNotes: [
      "Semi-western grip; elite on-the-rise FH timing and balance.",
      "Takeback: tip points more upright above the hands; hands stay inside (~55–65° abd) vs wide western flares.",
      "Longer loop with a gravity drop into the slot — contrasts Sinner’s shorter/lower side takeback.",
      "Proximal–distal lag ~40–45 ms supports the upright tip hang before the drop.",
    ],
    sources: [
      "Elliott, B. (2006). Biomechanics and tennis. Br J Sports Med.",
      "Reid, M. et al. — FH posture and shoulder kinematics.",
      "Tour FH takeback contrasts — upright (Djokovic) vs compact/side (Sinner).",
    ],
  },
  keyframes: [
    kf(
      "ready",
      0,
      170,
      2.0,
      0,
      "Balanced athletic base — tip quiet, ready for a long upright load",),
    kf(
      "unitTurn",
      0.11,
      230,
      4.2,
      0,
      "Unit turn — tip rising upright above the hands, elbows tucked inside",),
    kf(
      "backswing",
      0.3,
      280,
      5.8,
      0,
      "Upright takeback — tip above the hands, ready for the gravity drop",),
    kf(
      "acceleration",
      0.5,
      150,
      22.0,
      0,
      "Gravity drop into the slot — hips open while tip and wrist stay lagged",),
    kf(
      "contact",
      0.63,
      42,
      27.5,
      2900,
      "Contact out front — flexible timing, face closed for controlled RPM",),
    kf(
      "followThrough",
      0.82,
      280,
      13.5,
      2900,
      "High finish over the opposite shoulder — balance already set for recovery",),
    kf(
      "recovery",
      1,
      200,
      2.8,
      0,
      "Recover — elite balance back to the middle",),
  ],
};

/**
 * Djokovic 2HBH — true backhand wing (negative abduction = across body).
 * Not a mirrored forehand. Hands stay stacked on the grip; tip loops on the
 * BH wing → contact beside the front hip → finish over the opposite shoulder.
 */
export const djokovicBackhand: StrokeProfile = {
  type: "backhand",
  label: "Two-Handed Backhand",
  handedness: "right",
  oneHanded: false,
  metrics: {
    peakRacketSpeedMs: 26.8,
    contactHeightM: 1.05,
    contactDepthM: 0.5,
    avgSpinRpm: 2400,
    launchAngleDeg: 7.8,
    swingPathDeg: 22,
    impactDurationMs: 4.0,
    grip: "twoHanded",
    kineticChain: {
      sequence: ["legs", "hips", "trunk", "bothShoulders", "arms", "racket"],
      proximalDistalLagMs: 35,
      xFactorDeg: 38,
      peakGrfN: 1380,
    },
    consistency: {
      contactHeightCv: 3.6,
      timingSdMs: 10,
      pathReproducibility: 96,
      signatureQuirk: "Extreme thoracic rotation with rock-solid head stability through contact",
    },
    researchNotes: [
      "Among highest BH rally win % historically — kinematics favor early unit turn onto the backhand wing.",
      "Two-handed grip increases effective mass at impact; slightly lower peak speed than 1HBH.",
      "Contact zone is beside/front of the lead hip — not the forehand slot out to the side.",
      "Both arms drive together; hands stay stacked on the grip through the entire stroke.",
    ],
    sources: [
      "Reid & Elliott — two-handed BH biomechanics.",
      "ATP shot quality tracking — BH depth/speed composites.",
    ],
  },
  keyframes: [
    kf(
      "ready",
      0,
      160,
      2.0,
      0,
      "Hands stacked on the throat — compact ready on the backhand grip",),
    kf(
      "unitTurn",
      0.12,
      220,
      3.8,
      0,
      "Full unit turn onto the BH wing — athletic load, both hands coil together",),
    kf(
      "backswing",
      0.28,
      240,
      5.0,
      0,
      "Compact BH take-back — tip up on the BH wing, both arms ER-loaded",),
    kf(
      "acceleration",
      0.48,
      140,
      21.0,
      0,
      "Hips open first — tip drops into the front slot; both arms drive together",),
    kf(
      "contact",
      0.62,
      42,
      26.8,
      2400,
      "Contact beside the front hip on the BH side — both hands firm, face closed",),
    kf(
      "followThrough",
      0.82,
      260,
      12.5,
      2400,
      "Extension through the ball — hands finish high over the right shoulder",),
    kf(
      "recovery",
      1,
      200,
      2.8,
      0,
      "Recover to center — hands still together on the grip",),
  ],
};

/** Federer 1HBH — long lever, free off-arm, statue finish */
export const federerOneHandedBackhand: StrokeProfile = {
  type: "backhand",
  label: "One-Handed Backhand",
  handedness: "right",
  oneHanded: true,
  metrics: {
    peakRacketSpeedMs: 24.5,
    contactHeightM: 1.08,
    contactDepthM: 0.55,
    avgSpinRpm: 2100,
    launchAngleDeg: 6.5,
    swingPathDeg: 18,
    impactDurationMs: 4.1,
    grip: "eastern",
    kineticChain: {
      sequence: ["legs", "hips", "trunk", "shoulder", "elbow", "racket"],
      proximalDistalLagMs: 42,
      xFactorDeg: 40,
      peakGrfN: 1250,
    },
    consistency: {
      contactHeightCv: 4.8,
      timingSdMs: 13,
      pathReproducibility: 93,
      signatureQuirk: "Long lever 1HBH with delayed forearm pronation for shape",
    },
    researchNotes: [
      "Classic eastern 1HBH — contact slightly further in front than 2HBH.",
      "Non-hitting arm pulls back for balance/X-factor; hitting arm is a long lever.",
      "Finish is high and extended (statue pose), not a two-hand wrap.",
      "Face stays near vertical / slightly closed through contact for topspin drive.",
    ],
    sources: [
      "Elliott — one-handed BH biomechanics.",
      "ITF Advanced Coaching — 1HBH progressions.",
    ],
  },
  keyframes: [
    kf(
      "ready",
      0,
      160,
      2.0,
      0,
      "Eastern BH grip, athletic base — tip quiet in front",),
    kf(
      "unitTurn",
      0.12,
      230,
      3.5,
      0,
      "Unit turn to the BH side — off arm begins to pull back",),
    kf(
      "backswing",
      0.28,
      240,
      4.8,
      0,
      "High take-back on the BH wing — hitting arm long, off arm counter-balances",),
    kf(
      "acceleration",
      0.48,
      145,
      19.5,
      0,
      "Hips open first — shoulders and wrist stay lagged on the long lever",),
    kf(
      "contact",
      0.62,
      42,
      24.5,
      2100,
      "Contact well out in front — arm nearly straight, face stable and closed",),
    kf(
      "followThrough",
      0.82,
      270,
      11.0,
      2100,
      "Statue finish — tip high on the BH wing, arm extended over the shoulder",),
    kf(
      "recovery",
      1,
      200,
      2.6,
      0,
      "Recover to center",),
  ],
};

/**
 * Serena serve — trophy → racket drop → leg drive → high contact → pronation → across-body finish.
 */
export const serenaServe: StrokeProfile = {
  type: "serve",
  label: "First Serve",
  handedness: "right",
  oneHanded: true,
  metrics: {
    peakRacketSpeedMs: 42.5,
    contactHeightM: 2.72,
    contactDepthM: 0.1,
    avgSpinRpm: 2200,
    launchAngleDeg: -3.5,
    swingPathDeg: 5,
    impactDurationMs: 3.8,
    grip: "continental",
    kineticChain: {
      sequence: ["legs", "trunk", "shoulder", "elbow", "wrist", "racket"],
      proximalDistalLagMs: 28,
      xFactorDeg: 55,
      peakGrfN: 2100,
    },
    consistency: {
      contactHeightCv: 2.9,
      timingSdMs: 14,
      pathReproducibility: 92,
      signatureQuirk: "Massive leg drive into trophy with delayed racket drop (external rotation)",
    },
    researchNotes: [
      "Women's serve peak speeds historically among highest; racket speed often >40 m/s.",
      "Shoulder external rotation in cocking phase critical for internal-rotation velocity at impact.",
      "Leg drive contributes ~50–60% of serve power via ground reaction → trunk → arm.",
      "Pronation (IR) of the forearm/shoulder presents the face and decelerates safely after contact.",
    ],
    sources: [
      "Elliott, Marshall, Noffal — serve kinetic chain.",
      "Fleisig et al. — tennis serve kinematics.",
      "Bahamonde — angular momentum in the serve.",
    ],
  },
  keyframes: [
    kf(
      "ready",
      0,
      300,
      1.5,
      0,
      "Platform/pinpoint stance, ball in the non-hitting hand",),
    kf(
      "unitTurn",
      0.15,
      350,
      3.0,
      0,
      "Toss arm extends; hitting elbow rises toward trophy entry",),
    kf(
      "trophy",
      0.34,
      280,
      4.5,
      0,
      "Trophy — loaded legs (not a squat), tip up, toss arm tall, ER cocking",),
    kf(
      "backswing",
      0.48,
      120,
      12.0,
      0,
      "Racket drop (scratch the back) — max ER while legs start to drive",),
    kf(
      "acceleration",
      0.6,
      100,
      35.0,
      0,
      "Upward drive — legs extend, shoulder IR accelerates the racket up",),
    kf(
      "contact",
      0.7,
      35,
      42.5,
      2200,
      "Full extension contact — forearm pronation presents the face",),
    kf(
      "followThrough",
      0.88,
      250,
      18.0,
      2200,
      "Land on the lead leg; racket decelerates across the body after pronation",),
    kf("recovery", 1, 200, 4.0, 0, "Split step into court"),
  ],
};

/**
 * Federer 1HBH slice — high prep on BH wing → high-to-low carve, open face.
 */
export const federerSlice: StrokeProfile = {
  type: "slice",
  label: "One-Handed Slice",
  handedness: "right",
  oneHanded: true,
  metrics: {
    peakRacketSpeedMs: 18.5,
    contactHeightM: 1.0,
    contactDepthM: 0.4,
    avgSpinRpm: -1800,
    launchAngleDeg: 4.0,
    swingPathDeg: -25,
    impactDurationMs: 5.5,
    grip: "continental",
    kineticChain: {
      sequence: ["shoulders", "trunk", "arm", "racket"],
      proximalDistalLagMs: 45,
      xFactorDeg: 28,
      peakGrfN: 920,
    },
    consistency: {
      contactHeightCv: 4.5,
      timingSdMs: 11,
      pathReproducibility: 95,
      signatureQuirk: "High racket preparation with long, carving high-to-low arc and late face opening",
    },
    researchNotes: [
      "Negative spin (backspin) ~1500–2000 rpm keeps ball low after bounce.",
      "Continental grip presents an open face through contact for underspin.",
      "Swing path is high-to-low but contact stays near waist/chest — not a chop into the court.",
      "Follow-through continues forward/through the line of the shot with the face open.",
    ],
    sources: [
      "Elliott — slice BH mechanics.",
      "ITF Coaching — defensive/neutral slice patterns.",
    ],
  },
  keyframes: [
    kf(
      "ready",
      0,
      160,
      1.8,
      0,
      "Continental grip established early",),
    kf(
      "unitTurn",
      0.15,
      220,
      3.5,
      0,
      "High take-back on the BH side — racket head above the shoulder",),
    kf(
      "backswing",
      0.32,
      200,
      4.2,
      0,
      "Racket face opens; long lever prepared HIGH — not dropped",),
    kf(
      "acceleration",
      0.52,
      150,
      14.0,
      0,
      "Carve high-to-low — descending path with the face staying open",),
    kf(
      "contact",
      0.62,
      50,
      18.5,
      -1800,
      "Open-face contact at waist height — brush under and through the ball",),
    kf(
      "followThrough",
      0.85,
      280,
      8.0,
      -1800,
      "Long extension toward the target — hold the open face; tip does not dump",),
    kf(
      "recovery",
      1,
      180,
      2.5,
      0,
      "Stay low for the next ball",),
  ],
};

/**
 * Alcaraz FH volley — compact punch, firm wrist, tip up, contact out front.
 */
export const alcarazVolley: StrokeProfile = {
  type: "volley",
  label: "Forehand Volley",
  handedness: "right",
  oneHanded: true,
  metrics: {
    peakRacketSpeedMs: 14.2,
    contactHeightM: 1.35,
    contactDepthM: 0.55,
    avgSpinRpm: 400,
    launchAngleDeg: 2.0,
    swingPathDeg: 5,
    impactDurationMs: 3.5,
    grip: "continental",
    kineticChain: {
      sequence: ["legs", "trunk", "shoulder", "racket"],
      proximalDistalLagMs: 20,
      xFactorDeg: 22,
      peakGrfN: 1100,
    },
    consistency: {
      contactHeightCv: 6.2,
      timingSdMs: 8,
      pathReproducibility: 88,
      signatureQuirk: "Explosive split-step load with compact punch and active wrist firmness",
    },
    researchNotes: [
      "Volleys prioritize racket face stability over swing speed.",
      "Continental grip enables rapid FH/BH transitions at net.",
      "Ground force used for balance transfer rather than generating spin.",
      "Backswing is abbreviated — punch/block from in front of the body with a firm wrist.",
    ],
    sources: [
      "ITF — net play biomechanics.",
      "Elliott — volley impact characteristics.",
    ],
  },
  keyframes: [
    kf(
      "ready",
      0,
      100,
      1.5,
      0,
      "Split-step loaded — racket head up in front of the body",),
    kf(
      "unitTurn",
      0.22,
      80,
      3.0,
      0,
      "Short unit turn — soft knees, lead arm balances, no big backswing",),
    kf(
      "acceleration",
      0.42,
      70,
      11.0,
      0,
      "Punch forward from the shoulder — firm wrist, compact path",),
    kf(
      "contact",
      0.55,
      30,
      14.2,
      400,
      "Firm wrist, contact out in front — block/punch the face through the ball",),
    kf(
      "followThrough",
      0.78,
      120,
      6.0,
      400,
      "Short follow-through toward the target — tip stays up, no long wrap",),
    kf(
      "recovery",
      1,
      100,
      2.0,
      0,
      "Ready for the next volley",),
  ],
};

/** Generic profiles remapped per player — used as fillers for strokes not uniquely featured */
export function cloneStroke(
  base: StrokeProfile,
  overrides: Partial<StrokeProfile> & { metrics?: Partial<StrokeProfile["metrics"]> },
): StrokeProfile {
  return {
    ...base,
    ...overrides,
    metrics: {
      ...base.metrics,
      ...overrides.metrics,
      kineticChain: {
        ...base.metrics.kineticChain,
        ...overrides.metrics?.kineticChain,
      },
      consistency: {
        ...base.metrics.consistency,
        ...overrides.metrics?.consistency,
      },
    },
    keyframes: overrides.keyframes ?? base.keyframes,
  };
}

export type StrokeLibrary = Record<StrokeType, StrokeProfile>;
