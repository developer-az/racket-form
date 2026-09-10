import type { DoublesLesson } from "@/types/pickleball";

/** Progression: how to play doubles correctly — smart habits, not a rules dump. */
export const DOUBLES_LESSONS: DoublesLesson[] = [
  {
    id: "roles",
    step: "01",
    title: "Two jobs, one half",
    blurb:
      "Doubles is geometry first. Own your lane until the ball forces a cross — freelancing creates open alleys.",
    diagram: "court-roles",
    points: [
      "Default: each partner owns their half from baseline to NVZ. Drift only when you call the switch.",
      "Move to the kitchen as a pair. A split stack (one up, one stuck back) gifts easy angles.",
      "Call early: “mine,” “yours,” “switch,” “middle” — before the bounce, not after the miss.",
      "Middle balls usually belong to the player with the forehand into the middle (or the agreed caller).",
      "When you poach, your partner slides behind you — never leave a hole and admire the steal.",
    ],
  },
  {
    id: "nvz",
    step: "02",
    title: "Kitchen awareness",
    blurb:
      "The non-volley zone is a soft-game fortress — and a foot-fault trap. Soft hands win here; big swings lose.",
    diagram: "nvz",
    points: [
      "No volleys while touching the NVZ (including the line). Momentum after contact still counts.",
      "Enter to play bounced balls — then step out before the next volley.",
      "At the line: paddle up at chest height, elbows soft, weight on the balls of your feet — ready to block, not swing.",
      "Force opponents into the kitchen with drops, then pressure with dinks — don’t bang forever from the baseline.",
      "ATP / Erne awareness: an attack around or through the kitchen corner is rare and high-risk — only when the ball is attackable and your partner covers the counter.",
    ],
  },
  {
    id: "serve-receive",
    step: "03",
    title: "Serve & return: earn the line",
    blurb:
      "The return team should reach the NVZ first. That opening script decides who controls the soft game.",
    diagram: "serve-receive",
    points: [
      "Serve deep and legal (underhand, below waist, diagonal). Depth beats pace for setup.",
      "Return deep to the baseline — buy time to sprint forward with your partner.",
      "Servers stay back for the third shot. Don’t crash the net before you neutralize.",
      "Third-shot selection: drop when they’re set at the line; drive when they’re midcourt or the return sits up.",
      "After a good drop, both partners take space. After a float, freeze and reset — don’t charge a pop-up.",
    ],
  },
  {
    id: "third-shot",
    step: "04",
    title: "Third-shot selection",
    blurb:
      "Drop vs drive is a read, not a personality trait. Choose based on where they are and how high the ball is.",
    diagram: "third-shot-choice",
    points: [
      "Drop default: opponents already camped at the NVZ and your ball is low — neutralize, then walk in.",
      "Drive window: they’re stuck midcourt, late to the line, or the return sits shoulder-high.",
      "Aim drives at the body or middle seam to jam both players — not a sideline hero ball.",
      "Have a plan after: soft block → ready to reset; miss → take space; clean winner → still close as a pair.",
      "Mix looks so they can’t camp on one pattern. Predictable thirds get cheated early.",
    ],
  },
  {
    id: "stacking",
    step: "05",
    title: "Stacking when & why",
    blurb:
      "Stack so preferred sides (or forehands) stay where you want them after the return — only if communication is clean.",
    diagram: "stack-basic",
    points: [
      "Stacking = start on “wrong” sides so after the return you slide to preferred halves.",
      "Use it when one player wants the right (or left) consistently — especially with a strong forehand middle.",
      "Signal before the point. Confusion on who covers middle loses more than a weak stack.",
      "Skip stacking until you can hold the kitchen line without bumping paddles.",
      "If the stack creates a scramble every return, scrap it for a game and rebuild roles first.",
    ],
  },
  {
    id: "kitchen-battle",
    step: "06",
    title: "Kitchen battles",
    blurb:
      "Once both teams own the line, the point is won with patience, targeting, and clean speed-up decisions — not bang-bang.",
    diagram: "kitchen-battle",
    points: [
      "Dink patterns: crosscourt pocket → feet → middle — move them before you attack.",
      "Target feet and hips; balls at the chest get punched. Make them lift.",
      "Speed up only when the ball is above net height and attackable. Shoelace speed-ups gift counters.",
      "Expect the counter — paddle stays up. If they counter well, reset immediately.",
      "Reset quality matters: soft middle kitchen while you recover footing beats ego firefights.",
    ],
  },
  {
    id: "transition",
    step: "07",
    title: "Transition as a unit",
    blurb: "Winning doubles moves baseline → midcourt → NVZ together. No partner left on an island.",
    diagram: "transition-unit",
    points: [
      "After a neutralizing ball, both partners take a step in. Leave no one stranded at the baseline.",
      "If your drop sits up, freeze or reset; charging into a pop-up feeds the put-away.",
      "Speed-ups in transition: only on high balls with partner ready to cover the rebound lane.",
      "Reset > hero ball when you’re off-balance or jammed — soft block restarts the soft game.",
      "Communicate the plan: “drop,” “drive,” “reset,” “attack” — so the pair moves with one idea.",
    ],
  },
];
