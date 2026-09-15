import type { DoublesLesson } from "@/types/pickleball";

/**
 * High-level doubles progression — actionable decision cues, not beginner platitudes.
 * Kitchen = non-volley zone (spell out on first use in each lesson).
 */
export const DOUBLES_LESSONS: DoublesLesson[] = [
  {
    id: "roles",
    step: "01",
    title: "Own your lane",
    blurb:
      "Doubles is geometry before athleticism. Own a half until the ball forces a cross — freelancing opens alleys your partner cannot cover.",
    diagram: "court-roles",
    points: [
      "Default: each partner owns their half from baseline through the kitchen (non-volley zone). Drift only on a called switch.",
      "Move to the kitchen line as a pair. One up / one stuck back gifts easy angles and body targets.",
      "Call before the bounce: “mine,” “yours,” “switch,” “middle.” Late calls lose more points than weak technique.",
      "Middle balls usually belong to the player with the forehand into the middle — or the agreed permanent caller.",
      "When you poach, your partner slides into the hole immediately. Never steal and admire.",
    ],
  },
  {
    id: "nvz",
    step: "02",
    title: "Kitchen line discipline",
    blurb:
      "The kitchen (non-volley zone) is both fortress and foot-fault trap. Soft hands and legal feet win here; big swings from the line gift put-aways.",
    diagram: "nvz",
    points: [
      "No volleys while any part of you touches the kitchen — including the line. Momentum after contact still counts as a fault.",
      "You may step in to play a bounced ball, then clear the kitchen before the next volley.",
      "At the line: paddle up near chest height, elbows soft, weight on the balls of your feet — ready to block and reset, not to take a full swing.",
      "Force opponents into the kitchen with drops, then pressure with dinks. Endless baseline banging keeps you behind the geometry.",
      "Around-the-post (ATP) and Erne attacks are rare, high-risk tools — only when the ball is attackable and your partner covers the counter lane.",
    ],
  },
  {
    id: "serve-receive",
    step: "03",
    title: "Serve & return: win the first race",
    blurb:
      "The return team should reach the kitchen line first. Depth on the return buys that race; a short return hands the serving team the soft-game initiative.",
    diagram: "serve-receive",
    points: [
      "Serve deep and legal (underhand, contact below the waist, diagonal). Depth sets up your third shot more than raw pace.",
      "Return deep to the baseline — preferably to the weaker volleyer or the middle seam — then sprint forward with your partner.",
      "Servers stay back for the third shot. Crashing early into a deep return is how you eat a drive at your feet.",
      "Returner’s partner: cheat a half-step toward the kitchen on contact, then commit fully once the return clears deep.",
      "If your return sits short, freeze midcourt and prepare to reset — do not charge a ball that lets them speed up at your body.",
    ],
  },
  {
    id: "stay-back-vs-up",
    step: "04",
    title: "Stay back vs go up",
    blurb:
      "Transition timing is a read, not a personality trait. Go up on neutralizing balls; stay back (or freeze) when the ball is still attackable against you.",
    diagram: "stay-back-vs-up",
    points: [
      "Go up together after a drop that lands in the kitchen or a drive that jams them off the line — take space while they are recovering.",
      "Stay back or freeze midcourt when your third shot floats chest-high, when they are already set at the kitchen, or when you are off-balance.",
      "Split stacks (one partner charging while the other watches) create open angles — either both advance on the same ball or both hold.",
      "If they lob deep while you are mid-transition, recover depth first; do not keep walking into an overhead.",
      "Communicate the plan out loud: “up,” “hold,” “reset.” Silent transitions are where partners collide or leave gaps.",
    ],
  },
  {
    id: "third-shot",
    step: "05",
    title: "Third-shot selection",
    blurb:
      "Drop vs drive is a position-and-height read. Choose based on where they are and how high your ball is — not which shot you “prefer.”",
    diagram: "third-shot-choice",
    points: [
      "Drop default: opponents already set at the kitchen line and your contact is low — neutralize, then walk in as a pair.",
      "Drive window: they are stuck midcourt, late to the line, or the return sits shoulder-high.",
      "Aim drives at the body or middle seam to jam both players — sideline hero balls are low-percentage from the baseline.",
      "Have a plan after contact: soft block → ready to reset; miss → take space; clean winner → still close as a pair.",
      "Mix looks so they cannot cheat early. Predictable thirds get jumped.",
    ],
  },
  {
    id: "stacking",
    step: "06",
    title: "Stacking with intent",
    blurb:
      "Stack so preferred halves (and forehands) stay where you want them after the return — only if communication is cleaner than the stack itself.",
    diagram: "stack-basic",
    points: [
      "Stacking means starting on “wrong” sides so after the return you slide to preferred halves.",
      "Use it when one player should keep the right (or left) — especially to protect a strong forehand middle or hide a weaker backhand volley.",
      "Signal before every stacked point. Confusion on who covers middle loses more than playing standard formation.",
      "Skip stacking until you can hold the kitchen line without bumping paddles or leaving the middle orphaned.",
      "If the stack creates a scramble every return, scrap it for a game, rebuild roles, then reintroduce with clear switch cues.",
    ],
  },
  {
    id: "kitchen-battle",
    step: "07",
    title: "Kitchen battles: attack vs reset",
    blurb:
      "Once both teams own the line, points are won with patience, targeting, and clean speed-up decisions — not bang-bang ego rallies.",
    diagram: "kitchen-battle",
    points: [
      "Build pressure before you finish: crosscourt pocket → feet → middle. Move them, then attack the lift.",
      "Target feet and hips; balls at the chest get punched. Make them lift.",
      "Speed up only when the ball is above net height and attackable. Shoelace speed-ups gift counters.",
      "Expect the counter — paddle stays up. If they counter well, reset immediately to the middle kitchen.",
      "Reset quality matters: a soft ball that dies in the kitchen while you recover footing beats winning the highlight reel and losing the point.",
    ],
  },
  {
    id: "transition",
    step: "08",
    title: "Transition as a unit",
    blurb:
      "Winning doubles moves baseline → midcourt → kitchen together. Leave no partner stranded on an island.",
    diagram: "transition-unit",
    points: [
      "After a neutralizing ball, both partners take space. One-person charges create easy passing lanes.",
      "If your drop sits up, freeze or reset; charging into a pop-up feeds the put-away.",
      "Speed-ups in transition: only on high balls with your partner ready to cover the rebound lane.",
      "Reset beats hero ball when you are off-balance or jammed — soft block restarts the soft game.",
      "One idea per ball: “drop,” “drive,” “reset,” “attack” — so the pair moves with shared intent.",
    ],
  },
];
