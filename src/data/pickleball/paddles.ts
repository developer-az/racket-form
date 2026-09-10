import type { TechLever } from "@/types/pickleball";
import { loadPaddles } from "@/lib/pickleball/paddles";

/** @deprecated Prefer loadPaddles() — kept for static imports during transition. */
export const PADDLES = loadPaddles().paddles;

/** Interactive “how gear shifts play” levers for Paddle Tech. */
export const PADDLE_TECH_LEVERS: TechLever[] = [
  {
    id: "core",
    label: "Core",
    options: [
      {
        id: "polymer-thick",
        label: "Thick polymer (16mm+)",
        controlDelta: 12,
        powerDelta: -8,
        note: "More dwell — softer hands, easier resets and drops.",
      },
      {
        id: "polymer-thin",
        label: "Thin polymer (13–14mm)",
        controlDelta: -4,
        powerDelta: 10,
        note: "Faster rebound — drives and put-aways punch harder.",
      },
      {
        id: "nomex",
        label: "Nomex / honeycomb stiff",
        controlDelta: -10,
        powerDelta: 14,
        note: "Classic plow; less touch at the kitchen.",
      },
      {
        id: "foam",
        label: "Foam core",
        controlDelta: 8,
        powerDelta: 2,
        note: "Mutes vibration; stable blocks with usable pop.",
      },
    ],
  },
  {
    id: "face",
    label: "Face & texture",
    options: [
      {
        id: "raw",
        label: "Raw carbon grit",
        controlDelta: 4,
        powerDelta: 2,
        note: "Spin window opens — dip on drives and third shots.",
      },
      {
        id: "fiberglass",
        label: "Fiberglass pop",
        controlDelta: -6,
        powerDelta: 12,
        note: "Launchier surface; less bite for shaping.",
      },
      {
        id: "smooth",
        label: "Smooth graphite",
        controlDelta: 8,
        powerDelta: -4,
        note: "Quiet touch; spin comes from path, not grit.",
      },
      {
        id: "thermo",
        label: "Thermoformed edge",
        controlDelta: 2,
        powerDelta: 6,
        note: "Stiffer perimeter — bigger sweet zone, more plow.",
      },
    ],
  },
  {
    id: "weight",
    label: "Weight",
    options: [
      {
        id: "light",
        label: "Light (7.3–7.7 oz)",
        controlDelta: 6,
        powerDelta: -10,
        note: "Hand speed for dinks; less plow through pace.",
      },
      {
        id: "mid",
        label: "Mid (7.8–8.1 oz)",
        controlDelta: 2,
        powerDelta: 2,
        note: "Doubles default — balance of touch and put-away.",
      },
      {
        id: "heavy",
        label: "Heavy (8.2–8.6 oz)",
        controlDelta: -6,
        powerDelta: 12,
        note: "Blocks absorb drives; arm fatigue rises in long games.",
      },
    ],
  },
  {
    id: "grip-edge",
    label: "Grip & edge",
    options: [
      {
        id: "thin-edge",
        label: "Thin edge + standard grip",
        controlDelta: 4,
        powerDelta: 0,
        note: "More hitting surface; protect edges on scrambles.",
      },
      {
        id: "thick-edge",
        label: "Thick edge guard",
        controlDelta: -2,
        powerDelta: 2,
        note: "Durability and a bit of plow; slightly smaller face.",
      },
      {
        id: "foam-edge",
        label: "Foam-injected edge",
        controlDelta: 6,
        powerDelta: 4,
        note: "Softens mishits near the rim — modern all-court choice.",
      },
      {
        id: "large-grip",
        label: "Larger grip circumference",
        controlDelta: 4,
        powerDelta: -2,
        note: "Quiets wrist flick; helps soft game, less whip on rolls.",
      },
    ],
  },
];
