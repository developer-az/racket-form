import type {
  Anthropometrics,
  AthleteSpec,
  MotionStyle,
  PublishedStat,
  Quirk,
  StrokeType,
} from "@/types/biomechanics";

/**
 * Athlete facts for the Form Lab, each tagged with where it comes from.
 *
 * Rules used here:
 *  - `measured`: ball tracking (ATP Tennis Data Innovations / Hawk-Eye), radar
 *    gun or high-speed video analysis, with a citation.
 *  - `reported`: an official profile listing or a credible equipment / coaching
 *    source. Profile heights and weights are self-reported by players.
 *  - `modeled`: no published value exists; the number is our estimate and the
 *    note says how it was derived.
 *
 * No athlete in this set has a published, verifiable arm span or limb-segment
 * measurement, so arm span and segment lengths are modeled from height with
 * Winter (2009) population ratios. They therefore differ between athletes only
 * through height. Inventing per-athlete limb ratios would look precise and be
 * wrong.
 */

export const SRC = {
  atpSinner2024:
    "ATP Tour, \"Sinner 2024 insights\" (Tennis Data Innovations / Hawk-Eye, 2024 season)",
  atpAlcaraz2024:
    "ATP Tour, \"Alcaraz 2024 insights\" (Tennis Data Innovations / Hawk-Eye, 2024 season)",
  yandell:
    "J. Yandell high-speed video spin analysis, reported in Inside Tennis (\"Nadal ~3,200 rpm, Federer ~2,700 rpm\")",
  yandellHead: "J. Yandell, \"Head Position in Pro Tennis: Forehands\", Tennisplayer.net",
  tcHeights: "TennisCompanion, ATP height & weight table (from ATP profiles, 2025)",
  tcServes: "TennisCompanion, \"Fastest tennis serves\" (tournament radar records)",
  tcNadalGear: "TennisCompanion, Rafael Nadal gear page",
  tcFedererGear: "TennisCompanion, Roger Federer racquet and strings (stringer Ron Yu; tension estimated from a 2018 photo)",
  tcDjokovicGear: "TennisCompanion, Novak Djokovic gear page",
  tcAlcarazGear: "TennisCompanion, Carlos Alcaraz gear page",
  pfnRackets2025: "Pro Football Network, Wimbledon 2025 racket report (Sinner HEAD, Alcaraz Babolat)",
  tnSerena: "Tennisnerd, Serena Williams Autograph racquet",
  tennisComNadal2010: "Tennis.com, \"Nadal serving faster than ever at U.S. Open\" (2010)",
  wikiSerena: "Wikipedia, Serena Williams (infobox; 102 aces at Wimbledon 2012)",
  wikiSinner: "Wikipedia, Jannik Sinner (infobox, from ATP profile)",
  wikiDjokovic: "Wikipedia, Novak Djokovic (infobox)",
  wtaSerena: "WTA player profile (historic listing)",
  atpRio: "ATP profile as published by the Rio Open (2025)",
  puntoAlcarazServe: "Punto de Break, Jan 2025: new serve motion, AO average +7 km/h year on year",
  nadalRight:
    "Dr T. Bennett (Leeds Beckett) via beIN Sports; Toni Nadal via Tennis Majors: Rafa writes right-handed, plays left",
  winter: "Winter (2009) Biomechanics and Motor Control of Human Movement, segment length ratios",
  coaching: "Consensus coaching analysis of match video (Tennisplayer.net, ITF Coaching)",
} as const;

/**
 * Segment lengths from stature. Winter (2009): upper arm 0.186 H, forearm
 * 0.146 H, thigh 0.245 H, shank 0.246 H, shoulder to hip 0.288 H. Hand 0.108 H
 * and biacromial 0.259 H give arm span ≈ 1.00 H.
 */
export function anthropometricsFromHeight(heightM: number, massKg: number): Anthropometrics {
  return {
    heightM,
    wingspanM: Math.round(heightM * 100) / 100,
    massKg,
    torsoRatio: 0.288,
    upperArmRatio: 0.186,
    forearmRatio: 0.146,
    thighRatio: 0.245,
    shankRatio: 0.246,
  };
}

const armSpanModeled = (h: number) => ({
  value: h,
  status: "modeled" as const,
  source: SRC.winter,
  note: "No published measurement. Arm span ≈ height (ape index 1.00).",
});

export interface AthleteData {
  spec: AthleteSpec;
  /** Per-stroke extras merged into the stroke profiles. */
  strokes: Partial<
    Record<
      StrokeType,
      {
        style?: MotionStyle;
        published?: PublishedStat[];
        quirks?: Quirk[];
      }
    >
  >;
}

const mph = (v: number) => Math.round(v * 1.609344);

export const ATHLETES: Record<string, AthleteData> = {
  federer: {
    spec: {
      height: { value: 1.85, status: "reported", source: SRC.tcHeights },
      mass: { value: 85, status: "reported", source: SRC.tcHeights },
      armSpan: armSpanModeled(1.85),
      racket: { value: "Wilson Pro Staff RF97 Autograph (97 in²)", status: "reported", source: SRC.tcFedererGear },
      strings: {
        value: "Wilson natural gut mains, Luxilon ALU Power Rough crosses, about 27 / 25.5 kg",
        status: "reported",
        source: SRC.tcFedererGear,
      },
      grips: {
        forehand: { value: "Eastern", status: "reported", source: SRC.coaching },
        backhand: { value: "Eastern backhand, one hand", status: "reported", source: SRC.coaching },
        serve: { value: "Continental", status: "reported", source: SRC.coaching },
        slice: { value: "Continental", status: "reported", source: SRC.coaching },
        volley: { value: "Continental", status: "reported", source: SRC.coaching },
      },
    },
    strokes: {
      forehand: {
        style: { stance: "semiOpen", takeback: 1, finish: "wrap", legLoad: 0.3 },
        published: [
          { id: "fhSpin", label: "Forehand spin, average", value: 2700, unit: "rpm", status: "measured", source: SRC.yandell },
        ],
        quirks: [
          {
            text: "Head stays still and turned sideways toward the contact point well after the ball leaves.",
            phase: "contact",
            source: SRC.yandellHead,
          },
          {
            text: "Eastern grip gives a flatter, more direct path than the semi-western players here.",
            phase: "acceleration",
            source: SRC.coaching,
          },
          { text: "Classic wrap finish over the left shoulder.", phase: "followThrough", source: SRC.coaching },
        ],
      },
      backhand: {
        style: { stance: "neutral", takeback: 1.1, finish: "high", legLoad: 0.2 },
        quirks: [
          { text: "Off arm pulls back as the racket goes forward, keeping the chest sideways.", phase: "contact", source: SRC.coaching },
          { text: "Long, straight hitting arm at contact, well in front of the lead hip.", phase: "contact", source: SRC.coaching },
          { text: "Arms spread at the finish, racket high toward the target.", phase: "followThrough", source: SRC.coaching },
        ],
      },
      serve: {
        style: { trophyLoad: 0.45 },
        published: [
          { id: "serveMax", label: "Fastest serve", value: mph(143), unit: "km/h", status: "measured", source: SRC.tcServes, note: "143 mph, Halle 2010" },
        ],
        quirks: [
          { text: "Same toss for flat, slice and kick, so the serve is hard to read.", phase: "trophy", source: SRC.coaching },
        ],
      },
      slice: {
        quirks: [{ text: "High preparation above the shoulder, long carve with the face open.", phase: "backswing", source: SRC.coaching }],
      },
    },
  },

  nadal: {
    spec: {
      height: { value: 1.85, status: "reported", source: SRC.tcHeights },
      mass: { value: 85, status: "reported", source: SRC.tcHeights },
      armSpan: armSpanModeled(1.85),
      racket: {
        value: "Babolat AeroPro Drive (painted as the current Pure Aero)",
        status: "reported",
        source: SRC.tcNadalGear,
      },
      strings: { value: "Babolat RPM Blast 1.35 mm at 25 kg (55 lb)", status: "reported", source: SRC.tcNadalGear },
      grips: {
        forehand: { value: "Strong semi-western, hand at the butt cap", status: "reported", source: SRC.tcNadalGear },
        backhand: { value: "Two hands, right (natural) hand on top", status: "reported", source: SRC.coaching },
        serve: { value: "Continental", status: "reported", source: SRC.coaching },
        slice: { value: "Continental", status: "reported", source: SRC.coaching },
        volley: { value: "Continental", status: "reported", source: SRC.coaching },
      },
      notes: [{ value: "Plays left-handed but writes with his right hand.", status: "reported", source: SRC.nadalRight }],
    },
    strokes: {
      forehand: {
        style: { stance: "open", takeback: 1.1, finish: "reverse", legLoad: 0.6 },
        published: [
          { id: "fhSpin", label: "Forehand spin, average", value: 3200, unit: "rpm", status: "measured", source: SRC.yandell, note: "About 20% more than Federer" },
        ],
        quirks: [
          {
            text: "Reverse (buggy-whip) finish: the racket ends above the hitting shoulder, not across the body.",
            phase: "followThrough",
            source: SRC.coaching,
          },
          { text: "Holds the very end of the handle for a longer lever and more wrist.", phase: "backswing", source: SRC.tcNadalGear },
          { text: "Open stance with a deep leg load, then a steep low-to-high brush.", phase: "acceleration", source: SRC.coaching },
        ],
      },
      backhand: {
        style: { stance: "open", takeback: 1.05, finish: "wrap", legLoad: 0.5 },
        quirks: [
          {
            text: "Top hand is his natural right hand, so the stroke works like a right-handed forehand.",
            phase: "acceleration",
            source: SRC.nadalRight,
          },
          { text: "Hands wrap low around the neck instead of finishing tall.", phase: "followThrough", source: SRC.coaching },
          { text: "Often hit from an open stance when stretched wide.", phase: "contact", source: SRC.coaching },
        ],
      },
      serve: {
        style: { trophyLoad: 0.5 },
        published: [
          { id: "serveMax", label: "Fastest serve", value: mph(135), unit: "km/h", status: "measured", source: SRC.tennisComNadal2010, note: "135 mph, US Open 2010" },
        ],
        quirks: [{ text: "Left-handed slice swings wide to the ad court.", phase: "contact", source: SRC.coaching }],
      },
    },
  },

  djokovic: {
    spec: {
      height: { value: 1.88, status: "reported", source: SRC.wikiDjokovic },
      mass: { value: 77, status: "reported", source: SRC.tcHeights },
      armSpan: armSpanModeled(1.88),
      racket: { value: "HEAD PT 346.1 pro stock (painted as Speed Pro)", status: "reported", source: SRC.tcDjokovicGear },
      strings: {
        value: "Babolat Touch VS gut mains, Luxilon ALU Power crosses, 59 / 56 lb",
        status: "reported",
        source: SRC.tcDjokovicGear,
      },
      grips: {
        forehand: { value: "Strong semi-western", status: "reported", source: SRC.tcDjokovicGear },
        backhand: { value: "Two hands", status: "reported", source: SRC.wikiDjokovic },
        serve: { value: "Continental", status: "reported", source: SRC.coaching },
        slice: { value: "Continental", status: "reported", source: SRC.coaching },
        volley: { value: "Continental", status: "reported", source: SRC.coaching },
      },
    },
    strokes: {
      forehand: {
        style: { stance: "open", takeback: 1.05, finish: "wrap", legLoad: 0.4 },
        quirks: [
          { text: "Racket tip stands up above the hands in the takeback, then drops into the slot.", phase: "backswing", source: SRC.coaching },
          { text: "Open stance, balance kept even when stretched wide.", phase: "contact", source: SRC.coaching },
        ],
      },
      backhand: {
        style: { stance: "neutral", takeback: 1, finish: "extend", legLoad: 0.35 },
        quirks: [
          { text: "Long extension through the ball before the hands rise.", phase: "followThrough", source: SRC.coaching },
          { text: "Very early shoulder turn; the head stays level through contact.", phase: "unitTurn", source: SRC.coaching },
        ],
      },
      serve: {
        style: { trophyLoad: 0.5 },
        published: [
          { id: "serveMax", label: "Fastest serve", value: mph(136), unit: "km/h", status: "measured", source: SRC.tcServes, note: "136 mph, Madrid 2009" },
        ],
      },
    },
  },

  serena: {
    spec: {
      height: { value: 1.75, status: "reported", source: SRC.wikiSerena },
      mass: { value: 70, status: "reported", source: SRC.wtaSerena },
      armSpan: armSpanModeled(1.75),
      racket: { value: "Wilson Blade SW104 Autograph (104 in², 18×19)", status: "reported", source: SRC.tnSerena },
      grips: {
        forehand: { value: "Semi-western", status: "reported", source: SRC.coaching },
        backhand: { value: "Two hands", status: "reported", source: SRC.wikiSerena },
        serve: { value: "Continental", status: "reported", source: SRC.coaching },
        slice: { value: "Continental", status: "reported", source: SRC.coaching },
        volley: { value: "Continental", status: "reported", source: SRC.coaching },
      },
    },
    strokes: {
      forehand: {
        style: { stance: "open", takeback: 0.9, finish: "wrap", legLoad: 0.45 },
        quirks: [{ text: "Open stance and a compact backswing, built to take the ball early.", phase: "backswing", source: SRC.coaching }],
      },
      backhand: {
        style: { stance: "neutral", takeback: 0.85, finish: "extend", legLoad: 0.35 },
        quirks: [{ text: "Flat, compact two-hander driven through the line of the ball.", phase: "contact", source: SRC.coaching }],
      },
      serve: {
        style: { trophyLoad: 0.7 },
        published: [
          { id: "serveMax", label: "Fastest serve", value: 207, unit: "km/h", status: "measured", source: SRC.tcServes, note: "128.6 mph, Australian Open 2013" },
          { id: "aces", label: "Aces, Wimbledon 2012", value: 102, unit: "", status: "measured", source: SRC.wikiSerena, note: "Tournament record, men or women" },
        ],
        quirks: [
          { text: "Deep knee bend in the trophy position, then a strong leg drive up to the ball.", phase: "trophy", source: SRC.coaching },
          { text: "Repeatable toss that disguises direction.", phase: "unitTurn", source: SRC.coaching },
        ],
      },
    },
  },

  alcaraz: {
    spec: {
      height: { value: 1.83, status: "reported", source: SRC.atpRio },
      mass: { value: 74, status: "reported", source: SRC.atpRio },
      armSpan: armSpanModeled(1.83),
      racket: { value: "Babolat Pure Aero 98 (16×20)", status: "reported", source: SRC.tcAlcarazGear },
      strings: { value: "Babolat RPM Blast 1.30 mm, 55 / 53 lb", status: "reported", source: SRC.tcAlcarazGear },
      grips: {
        forehand: { value: "Semi-western", status: "reported", source: SRC.tcAlcarazGear },
        backhand: { value: "Two hands", status: "reported", source: SRC.tcAlcarazGear },
        serve: { value: "Continental", status: "reported", source: SRC.coaching },
        slice: { value: "Continental", status: "reported", source: SRC.coaching },
        volley: { value: "Continental", status: "reported", source: SRC.coaching },
      },
    },
    strokes: {
      forehand: {
        style: { stance: "semiOpen", takeback: 0.85, finish: "wiper", legLoad: 0.8 },
        published: [
          { id: "fhSpin", label: "Forehand spin, average", value: 3208, unit: "rpm", status: "measured", source: SRC.atpAlcaraz2024, note: "Tour average 2,708 rpm" },
          { id: "fhSpeed", label: "Forehand ball speed", value: mph(78), unit: "km/h", status: "measured", source: SRC.atpAlcaraz2024, note: "78 mph, tour 75 mph" },
        ],
        quirks: [
          { text: "Compact takeback for how hard he hits; the same preparation hides the drop shot.", phase: "backswing", source: SRC.coaching },
          { text: "Explosive leg drive: deep load, then the body lifts through contact.", phase: "acceleration", source: SRC.coaching },
        ],
      },
      backhand: {
        style: { stance: "neutral", takeback: 0.95, finish: "high", legLoad: 0.6 },
        published: [
          { id: "bhSpin", label: "Backhand spin, average", value: 2005, unit: "rpm", status: "measured", source: SRC.atpAlcaraz2024, note: "Tour average 1,775 rpm" },
          { id: "bhSpeed", label: "Backhand ball speed", value: mph(73), unit: "km/h", status: "measured", source: SRC.atpAlcaraz2024, note: "73 mph, tour 68 mph" },
        ],
      },
      serve: {
        style: { trophyLoad: 0.6 },
        published: [
          { id: "serveDelta", label: "Average serve, AO 2025 vs 2024", value: 7, unit: "km/h faster", status: "measured", source: SRC.puntoAlcarazServe },
        ],
        quirks: [{ text: "Reworked, simpler service motion from the 2025 season.", phase: "trophy", source: SRC.puntoAlcarazServe }],
      },
    },
  },

  sinner: {
    spec: {
      height: { value: 1.91, status: "reported", source: SRC.wikiSinner },
      mass: { value: 76, status: "reported", source: SRC.tcHeights },
      armSpan: armSpanModeled(1.91),
      racket: { value: "HEAD TGT 301.4 pro stock (painted as Speed MP)", status: "reported", source: SRC.pfnRackets2025 },
      strings: { value: "HEAD Hawk Touch, full bed", status: "reported", source: SRC.pfnRackets2025 },
      grips: {
        forehand: { value: "Semi-western", status: "reported", source: SRC.coaching },
        backhand: { value: "Two hands", status: "reported", source: SRC.wikiSinner },
        serve: { value: "Continental", status: "reported", source: SRC.coaching },
        slice: { value: "Continental", status: "reported", source: SRC.coaching },
        volley: { value: "Continental", status: "reported", source: SRC.coaching },
      },
    },
    strokes: {
      forehand: {
        style: { stance: "neutral", takeback: 0.8, finish: "extend", legLoad: 0.35 },
        published: [
          { id: "fhSpin", label: "Forehand spin, average", value: 3049, unit: "rpm", status: "measured", source: SRC.atpSinner2024, note: "Tour average 2,708 rpm" },
          { id: "fhSpeed", label: "Forehand ball speed", value: mph(78), unit: "km/h", status: "measured", source: SRC.atpSinner2024, note: "78 mph, tour 73 mph" },
          { id: "fhClear", label: "Net clearance vs field", value: -2, unit: "cm", status: "measured", source: SRC.atpSinner2024, note: "Lower, flatter trajectory" },
        ],
        quirks: [
          { text: "Short, low takeback and early contact out in front.", phase: "backswing", source: SRC.coaching },
          { text: "Drives through the line of the ball; less wiper than Alcaraz.", phase: "followThrough", source: SRC.coaching },
        ],
      },
      backhand: {
        style: { stance: "neutral", takeback: 0.85, finish: "extend", legLoad: 0.35 },
        published: [
          { id: "bhSpin", label: "Backhand spin, average", value: 2235, unit: "rpm", status: "measured", source: SRC.atpSinner2024, note: "Tour average 1,977 rpm" },
          { id: "bhSpeed", label: "Backhand ball speed", value: mph(73), unit: "km/h", status: "measured", source: SRC.atpSinner2024, note: "73 mph, tour 66 mph" },
          { id: "bhClear", label: "Net clearance vs field", value: -5, unit: "cm", status: "measured", source: SRC.atpSinner2024, note: "Lower, flatter trajectory" },
        ],
        quirks: [{ text: "Takes the ball early and flat; long levers through contact.", phase: "contact", source: SRC.coaching }],
      },
      serve: {
        style: { trophyLoad: 0.5 },
      },
    },
  },
};
