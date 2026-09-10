"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

/** Lightweight SVG diagrams for doubles teaching — one job each. */

function CourtShell({
  children,
  h = 200,
  label,
}: {
  children: ReactNode;
  h?: number;
  label: string;
}) {
  return (
    <svg viewBox={`0 0 320 ${h}`} className="h-auto w-full" role="img" aria-label={label}>
      <rect
        x="8"
        y="12"
        width="304"
        height={h - 24}
        rx="4"
        fill="var(--bg-scene)"
        stroke="var(--line-strong)"
      />
      <rect
        x="8"
        y={h / 2 - 22}
        width="304"
        height="44"
        fill="color-mix(in srgb, var(--sky) 16%, transparent)"
      />
      {children}
    </svg>
  );
}

export function CourtRolesDiagram() {
  const reduce = useReducedMotion();
  return (
    <CourtShell label="Doubles halves">
      <line
        x1="160"
        y1="12"
        x2="160"
        y2="188"
        stroke="var(--amber)"
        strokeWidth="2"
        strokeDasharray="4 4"
      />
      <text
        x="88"
        y="48"
        textAnchor="middle"
        className="fill-[var(--foreground)]"
        style={{ fontSize: 11, fontWeight: 600 }}
      >
        Your half
      </text>
      <text
        x="232"
        y="48"
        textAnchor="middle"
        className="fill-[var(--foreground)]"
        style={{ fontSize: 11, fontWeight: 600 }}
      >
        Partner half
      </text>
      <text
        x="160"
        y="104"
        textAnchor="middle"
        className="fill-[var(--sky)]"
        style={{ fontSize: 10, fontWeight: 700 }}
      >
        NVZ / kitchen
      </text>
      <motion.circle
        cx="100"
        cy="150"
        r="10"
        fill="var(--accent)"
        initial={reduce ? false : { opacity: 0.4, cy: 170 }}
        animate={{ opacity: 1, cy: 150 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.circle
        cx="220"
        cy="150"
        r="10"
        fill="var(--amber)"
        initial={reduce ? false : { opacity: 0.4, cy: 170 }}
        animate={{ opacity: 1, cy: 150 }}
        transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
      />
      <text x="100" y="174" textAnchor="middle" className="fill-[var(--muted)]" style={{ fontSize: 9 }}>
        You
      </text>
      <text x="220" y="174" textAnchor="middle" className="fill-[var(--muted)]" style={{ fontSize: 9 }}>
        Partner
      </text>
    </CourtShell>
  );
}

export function NvzDiagram() {
  return (
    <svg viewBox="0 0 320 180" className="h-auto w-full" role="img" aria-label="Non-volley zone">
      <rect x="24" y="20" width="272" height="140" rx="4" fill="var(--bg-scene)" stroke="var(--line-strong)" />
      <rect
        x="24"
        y="64"
        width="272"
        height="52"
        fill="color-mix(in srgb, var(--sky) 22%, transparent)"
        stroke="var(--sky)"
        strokeWidth="1.5"
      />
      <line x1="160" y1="64" x2="160" y2="116" stroke="var(--line-strong)" strokeWidth="2" />
      <text x="160" y="94" textAnchor="middle" className="fill-[var(--sky)]" style={{ fontSize: 11, fontWeight: 700 }}>
        Kitchen — no volleys on the line
      </text>
      <text x="90" y="48" textAnchor="middle" className="fill-[var(--muted)]" style={{ fontSize: 9 }}>
        Volley OK here
      </text>
      <text x="230" y="140" textAnchor="middle" className="fill-[var(--muted)]" style={{ fontSize: 9 }}>
        Bounce → step in OK
      </text>
      <text x="260" y="48" textAnchor="middle" className="fill-[var(--amber)]" style={{ fontSize: 8, fontWeight: 600 }}>
        Erne zone →
      </text>
    </svg>
  );
}

export function ServeReceiveDiagram() {
  const reduce = useReducedMotion();
  return (
    <CourtShell label="Serve and return flow">
      <circle cx="90" cy="160" r="9" fill="var(--amber)" />
      <circle cx="150" cy="160" r="9" fill="var(--amber)" />
      <text x="120" y="186" textAnchor="middle" className="fill-[var(--muted)]" style={{ fontSize: 9 }}>
        Servers stay back
      </text>
      <motion.circle
        cx="200"
        cy="48"
        r="9"
        fill="var(--accent)"
        animate={reduce ? undefined : { cy: [48, 78, 78] }}
        transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 0.8, ease: "easeInOut" }}
      />
      <motion.circle
        cx="260"
        cy="48"
        r="9"
        fill="var(--accent)"
        animate={reduce ? undefined : { cy: [48, 78, 78] }}
        transition={{ duration: 1.6, delay: 0.1, repeat: Infinity, repeatDelay: 0.8, ease: "easeInOut" }}
      />
      <text x="230" y="36" textAnchor="middle" className="fill-[var(--accent)]" style={{ fontSize: 9, fontWeight: 600 }}>
        Return → claim NVZ
      </text>
    </CourtShell>
  );
}

export function StackBasicDiagram() {
  const reduce = useReducedMotion();
  return (
    <CourtShell label="Basic stacking">
      <line x1="160" y1="12" x2="160" y2="188" stroke="var(--line)" strokeWidth="1" strokeDasharray="3 3" />
      <circle cx="100" cy="150" r="9" fill="var(--accent)" />
      <circle cx="130" cy="150" r="9" fill="var(--amber)" opacity="0.85" />
      <text x="115" y="174" textAnchor="middle" className="fill-[var(--muted)]" style={{ fontSize: 9 }}>
        Start same side
      </text>
      <circle cx="100" cy="48" r="9" fill="var(--accent)" />
      <motion.circle
        cx="230"
        cy="48"
        r="9"
        fill="var(--amber)"
        initial={reduce ? false : { cx: 130, cy: 150, opacity: 0.5 }}
        animate={{ cx: 230, cy: 48, opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
      <path
        d="M130 145 Q180 100 230 55"
        fill="none"
        stroke="var(--amber)"
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
      <text x="200" y="100" className="fill-[var(--amber)]" style={{ fontSize: 9, fontWeight: 600 }}>
        Slide after return
      </text>
    </CourtShell>
  );
}

export function TransitionUnitDiagram() {
  const reduce = useReducedMotion();
  return (
    <CourtShell label="Transition as a unit" h={210}>
      <text x="60" y="40" className="fill-[var(--muted)]" style={{ fontSize: 9 }}>
        Baseline
      </text>
      <text x="60" y="100" className="fill-[var(--sky)]" style={{ fontSize: 9, fontWeight: 600 }}>
        Mid
      </text>
      <text x="60" y="155" className="fill-[var(--accent)]" style={{ fontSize: 9, fontWeight: 600 }}>
        NVZ
      </text>
      <motion.circle
        cx="140"
        r="8"
        fill="var(--accent)"
        animate={reduce ? { cy: 150 } : { cy: [160, 110, 70] }}
        transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 0.6, ease: "easeInOut" }}
      />
      <motion.circle
        cx="220"
        r="8"
        fill="var(--amber)"
        animate={reduce ? { cy: 150 } : { cy: [160, 110, 70] }}
        transition={{ duration: 2.2, delay: 0.08, repeat: Infinity, repeatDelay: 0.6, ease: "easeInOut" }}
      />
      <text x="180" y="190" textAnchor="middle" className="fill-[var(--muted)]" style={{ fontSize: 9 }}>
        Both partners advance together
      </text>
    </CourtShell>
  );
}

export function KitchenBattleDiagram() {
  const reduce = useReducedMotion();
  return (
    <CourtShell label="Kitchen battle patterns" h={200}>
      <circle cx="100" cy="70" r="8" fill="var(--accent)" />
      <circle cx="220" cy="70" r="8" fill="var(--accent)" />
      <circle cx="100" cy="150" r="8" fill="var(--amber)" />
      <circle cx="220" cy="150" r="8" fill="var(--amber)" />
      <motion.path
        d="M110 140 Q160 100 210 80"
        fill="none"
        stroke="var(--amber)"
        strokeWidth="1.5"
        strokeDasharray="5 4"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, ease: "easeInOut" }}
      />
      <motion.path
        d="M210 145 Q160 120 110 85"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeDasharray="5 4"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, delay: 0.2, ease: "easeInOut" }}
      />
      <text x="160" y="108" textAnchor="middle" className="fill-[var(--foreground)]" style={{ fontSize: 9, fontWeight: 600 }}>
        Cross · feet · middle
      </text>
    </CourtShell>
  );
}

export function ThirdShotChoiceDiagram() {
  return (
    <CourtShell label="Third shot drop vs drive" h={200}>
      <circle cx="120" cy="160" r="8" fill="var(--amber)" />
      <circle cx="180" cy="160" r="8" fill="var(--amber)" />
      <circle cx="120" cy="48" r="8" fill="var(--accent)" />
      <circle cx="220" cy="48" r="8" fill="var(--accent)" />
      <path d="M150 150 Q160 110 160 90" fill="none" stroke="var(--sky)" strokeWidth="2" />
      <text x="188" y="118" className="fill-[var(--sky)]" style={{ fontSize: 9, fontWeight: 600 }}>
        Drop → kitchen
      </text>
      <path d="M150 150 L200 70" fill="none" stroke="var(--chart-power)" strokeWidth="2" />
      <text x="210" y="100" className="fill-[var(--chart-power)]" style={{ fontSize: 9, fontWeight: 600 }}>
        Drive → body
      </text>
      <text x="160" y="186" textAnchor="middle" className="fill-[var(--muted)]" style={{ fontSize: 9 }}>
        Read their position, then choose
      </text>
    </CourtShell>
  );
}

export function DinkPocketsDiagram() {
  return (
    <CourtShell label="Dink target pockets" h={180}>
      <circle cx="100" cy="55" r="7" fill="var(--accent)" />
      <circle cx="220" cy="55" r="7" fill="var(--accent)" />
      <circle cx="100" cy="140" r="7" fill="var(--amber)" />
      <circle cx="220" cy="140" r="7" fill="var(--amber)" />
      <rect x="200" y="48" width="28" height="18" rx="3" fill="color-mix(in srgb, var(--amber) 35%, transparent)" stroke="var(--amber)" />
      <rect x="148" y="48" width="24" height="18" rx="3" fill="color-mix(in srgb, var(--sky) 35%, transparent)" stroke="var(--sky)" />
      <rect x="88" y="62" width="24" height="14" rx="3" fill="color-mix(in srgb, var(--accent) 30%, transparent)" stroke="var(--accent)" />
      <text x="160" y="100" textAnchor="middle" className="fill-[var(--muted)]" style={{ fontSize: 9 }}>
        Pocket · middle · feet
      </text>
    </CourtShell>
  );
}

export function DropTargetsDiagram() {
  return (
    <CourtShell label="Drop landing zones" h={180}>
      <circle cx="130" cy="150" r="8" fill="var(--amber)" />
      <rect x="100" y="78" width="120" height="28" rx="4" fill="color-mix(in srgb, var(--sky) 28%, transparent)" stroke="var(--sky)" />
      <text x="160" y="96" textAnchor="middle" className="fill-[var(--sky)]" style={{ fontSize: 10, fontWeight: 700 }}>
        Preferred drop zone
      </text>
      <path d="M130 140 Q150 110 160 95" fill="none" stroke="var(--amber)" strokeWidth="1.5" strokeDasharray="4 3" />
    </CourtShell>
  );
}

export function SpeedUpLanesDiagram() {
  return (
    <CourtShell label="Speed-up lanes" h={180}>
      <circle cx="110" cy="55" r="7" fill="var(--accent)" />
      <circle cx="210" cy="55" r="7" fill="var(--accent)" />
      <circle cx="160" cy="140" r="7" fill="var(--amber)" />
      <path d="M160 130 L160 70" stroke="var(--chart-power)" strokeWidth="2" />
      <path d="M160 130 L120 70" stroke="var(--amber)" strokeWidth="1.5" strokeDasharray="4 3" />
      <path d="M160 130 L200 70" stroke="var(--amber)" strokeWidth="1.5" strokeDasharray="4 3" />
      <text x="160" y="100" textAnchor="middle" className="fill-[var(--chart-power)]" style={{ fontSize: 9, fontWeight: 600 }}>
        Body / hip lanes
      </text>
    </CourtShell>
  );
}

export function FeetHipsDiagram() {
  return (
    <svg viewBox="0 0 320 180" className="h-auto w-full" role="img" aria-label="Target feet and hips">
      <rect x="40" y="20" width="240" height="140" rx="4" fill="var(--bg-scene)" stroke="var(--line-strong)" />
      <ellipse cx="160" cy="70" rx="28" ry="36" fill="color-mix(in srgb, var(--accent) 25%, transparent)" stroke="var(--accent)" />
      <text x="160" y="74" textAnchor="middle" className="fill-[var(--accent)]" style={{ fontSize: 10, fontWeight: 700 }}>
        Hips
      </text>
      <ellipse cx="160" cy="130" rx="34" ry="16" fill="color-mix(in srgb, var(--amber) 30%, transparent)" stroke="var(--amber)" />
      <text x="160" y="134" textAnchor="middle" className="fill-[var(--amber)]" style={{ fontSize: 10, fontWeight: 700 }}>
        Feet
      </text>
      <text x="250" y="50" className="fill-[var(--danger)]" style={{ fontSize: 9 }}>
        Avoid chest
      </text>
    </svg>
  );
}

export function PickleDiagram({
  kind,
}: {
  kind:
    | "court-roles"
    | "nvz"
    | "serve-receive"
    | "stack-basic"
    | "transition-unit"
    | "kitchen-battle"
    | "third-shot-choice";
}) {
  switch (kind) {
    case "court-roles":
      return <CourtRolesDiagram />;
    case "nvz":
      return <NvzDiagram />;
    case "serve-receive":
      return <ServeReceiveDiagram />;
    case "stack-basic":
      return <StackBasicDiagram />;
    case "transition-unit":
      return <TransitionUnitDiagram />;
    case "kitchen-battle":
      return <KitchenBattleDiagram />;
    case "third-shot-choice":
      return <ThirdShotChoiceDiagram />;
  }
}

export function ShotDiagram({
  kind,
}: {
  kind: "dink-pockets" | "drop-targets" | "speed-up-lanes" | "feet-hips";
}) {
  switch (kind) {
    case "dink-pockets":
      return <DinkPocketsDiagram />;
    case "drop-targets":
      return <DropTargetsDiagram />;
    case "speed-up-lanes":
      return <SpeedUpLanesDiagram />;
    case "feet-hips":
      return <FeetHipsDiagram />;
  }
}
