import type { PaddleProUse, PaddleProfile } from "@/types/pickleball";

/**
 * Actionable coaching tips for how to *play* a paddle — not just mold/spec copy.
 * Uses catalog traits so every paddle gets specific guidance; optional profile.tips override.
 */
export function paddleCoachingTips(p: PaddleProfile): string[] {
  if (p.tips && p.tips.length > 0) return p.tips.slice(0, 5);

  const tips: string[] = [];
  const sw = p.swingweight;
  const thick = p.thicknessMm;
  const grip = p.gripLengthIn;

  // Bias-first play pattern
  if (p.bias === "power") {
    tips.push(
      "Lead with depth, not raw pace — take the ball out in front and finish through the target so pop does not sail long.",
    );
    tips.push(
      "On soft balls, shorten the swing: compact take-back, soft hands through contact, then recover paddle-high for the counter.",
    );
  } else if (p.bias === "control") {
    tips.push(
      "Trust the dwell — hold the dink and drop a beat longer, then roll with shape instead of punching.",
    );
    tips.push(
      "When you get a sit-up, accelerate through the ball early; this face will not bail you out if you wait and poke.",
    );
  } else if (p.bias === "spin") {
    tips.push(
      "Brush low-to-high on every third-ball roll and kitchen dip — this face wants RPM more than flat pace.",
    );
    tips.push(
      "On counters, keep the face slightly closed and meet the ball out front so spin does not dump into the net.",
    );
  } else {
    tips.push(
      "Play two gears: soft shape from the transition, then commit when you step into the kitchen — do not live in between.",
    );
  }

  // Shape / geometry
  if (p.shape === "elongated") {
    tips.push(
      "Use the extra reach for deep returns and stretched blocks, but keep the sweet spot centered — miss-hits live near the tip.",
    );
  } else if (p.shape === "widebody") {
    tips.push(
      "Set a wide ready position and block with the face square — the big sweet spot rewards early contact, not late wrist flicks.",
    );
  } else if (p.shape === "standard") {
    tips.push(
      "Win hand battles: paddle up at chest height, elbows soft, and take space with short punches rather than full swings.",
    );
  } else if (p.shape === "hybrid") {
    tips.push(
      "Treat it like a hybrid tennis frame — cover the middle seam first, then use the slight length for angled rolls.",
    );
  }

  // Swingweight / thickness / core
  if (sw != null && sw >= 118) {
    tips.push(
      `Swingweight ~${sw} wants earlier preparation — start the paddle back sooner on drives so you are not late at contact.`,
    );
  } else if (sw != null && sw <= 108) {
    tips.push(
      `Light swing (~${sw}) lets you hold the line longer — use that hand speed for resets and speed-ups, not wild full cuts.`,
    );
  }

  if (thick != null && thick <= 14) {
    tips.push(
      `${thick}mm plays lively — soften your grip on kitchen blocks so the thin core does not spray long.`,
    );
  } else if (thick != null && thick >= 16 && p.power >= 80) {
    tips.push(
      "Thick power cores still need a quiet face on drops: drop the tip under the ball and lift, do not slap.",
    );
  }

  if (p.core === "foam") {
    tips.push(
      "Foam stays firm as it heats up — do not wait for a “break-in pop”; dial depth with swing length from day one.",
    );
  }

  if (grip != null && grip >= 5.5) {
    tips.push(
      "Long handle: keep a continental base and slide the bottom hand for two-hand backhands without choking up into the throat.",
    );
  }

  if (p.spin >= 84 && p.bias !== "spin") {
    tips.push(
      "You have free spin — aim a window above the net and let RPM bring the ball down instead of aiming the tape.",
    );
  }

  if (p.control >= 84 && p.power <= 70) {
    tips.push(
      "Partner can pressure; you own the soft game — call “mine” on every middle dink and reset that sits up to them.",
    );
  }

  // De-dupe and cap
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tip of tips) {
    if (seen.has(tip)) continue;
    seen.add(tip);
    out.push(tip);
    if (out.length >= 4) break;
  }
  return out;
}

/**
 * How this paddle is actually used at a high level — kitchen geometry, hand speed, finishing.
 * Optional profile.proUse override for flagship / ambassador models.
 */
export function paddleProUse(p: PaddleProfile): PaddleProUse {
  if (p.proUse) return p.proUse;

  const thick = p.thicknessMm;
  const howTheyWin: string[] = [];

  if (p.bias === "power") {
    howTheyWin.push(
      "Take time away: deep return, then a penetrating third when they are late to the line.",
    );
    howTheyWin.push("Finish at the hip or feet — chest-high sitters get blocked by fast hands.");
  } else if (p.bias === "control") {
    howTheyWin.push("Build the dink: crosscourt pocket → feet → middle until they lift.");
    howTheyWin.push("Reset quality wins the point — die in the 7' kitchen, paddle stays up.");
  } else if (p.bias === "spin") {
    howTheyWin.push("Dip every third-ball roll and kitchen dink so they volley off their shoe tops.");
    howTheyWin.push("Closed face on counters (~−4°) so RPM does not dump into the net.");
  } else {
    howTheyWin.push("Two gears: neutralize with a drop, then commit when you own the kitchen line.");
    howTheyWin.push("Drive the middle seam when they are midcourt; drop when they are set.");
  }

  if (p.shape === "elongated") {
    howTheyWin.push(
      "Use reach for stretched blocks and deep returns; miss-hits live near the tip — center the ball.",
    );
  } else if (p.shape === "standard" || p.shape === "widebody") {
    howTheyWin.push(
      "Win the hand battle: wide ready, square face, short punch — this shape is a kitchen weapon.",
    );
  } else {
    howTheyWin.push("Cover the middle first, then use the slight length for angled rolls.");
  }

  const thin = thick != null && thick <= 14;
  const fastHands = thin
    ? `${thick}mm plays lively — 6–8" punch, soft grip on blocks, recover to chest before they can counter.`
    : p.shape === "elongated"
      ? "Elongated mass wants earlier prep. At the line, shorten the lever: choke a finger up if you have to, punch, recover high."
      : "Paddle at chest height, elbows soft. The player who is ready first owns the speed-up / counter exchange.";

  const dominate =
    p.power >= 82
      ? "Dominate by attacking the first ball above the 34\" tape at the hip or feet, then covering the middle rebound. Power paddles lose when you bang from below the net."
      : "Dominate by never feeding chest-high balls and by calling the middle early. Placement at the feet is statistically the hardest volley for a set opponent — teaching model, not tour telemetry.";

  const headline =
    p.tourPresence && p.tourPresence.length < 120
      ? p.tourPresence
      : `${p.brand} ${p.name} — play the bias (${p.bias}), not the marketing.`;

  return {
    headline,
    howTheyWin: howTheyWin.slice(0, 4),
    fastHands,
    dominate,
  };
}
