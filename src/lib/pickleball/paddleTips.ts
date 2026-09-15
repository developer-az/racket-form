import type { PaddleProfile } from "@/types/pickleball";

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
