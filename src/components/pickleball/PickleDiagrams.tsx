"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Lightweight SVG diagrams for doubles teaching.
 * Court is top-down: top = opponent baseline, middle = kitchens + net, bottom = your baseline.
 * Soft shots use arcs; pace shots use straighter paths.
 */

function CourtShell({
  children,
  h = 200,
  label,
}: {
  children: ReactNode;
  h?: number;
  label: string;
}) {
  const kitchenTop = h / 2 - 24;
  const kitchenH = 48;
  const netY = h / 2;

  return (
    <svg viewBox={`0 0 320 ${h}`} className="h-auto w-full" role="img" aria-label={label}>
      <defs>
        <linearGradient id="pickleCourtWash" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--bg-scene)" />
          <stop offset="50%" stopColor="color-mix(in srgb, var(--sky) 8%, var(--bg-scene))" />
          <stop offset="100%" stopColor="var(--bg-scene)" />
        </linearGradient>
      </defs>
      {/* Full court */}
      <rect
        x="8"
        y="12"
        width="304"
        height={h - 24}
        rx="4"
        fill="url(#pickleCourtWash)"
        stroke="var(--line-strong)"
      />
      {/* Combined NVZ band (7' each side of net) */}
      <rect
        x="8"
        y={kitchenTop}
        width="304"
        height={kitchenH}
        fill="color-mix(in srgb, var(--sky) 14%, transparent)"
      />
      {/* Net */}
      <line
        x1="8"
        y1={netY}
        x2="312"
        y2={netY}
        stroke="var(--foreground)"
        strokeWidth="2"
        opacity="0.55"
      />
      {/* Center line through kitchen only */}
      <line
        x1="160"
        y1={kitchenTop}
        x2="160"
        y2={kitchenTop + kitchenH}
        stroke="var(--line-strong)"
        strokeWidth="1.5"
      />
      <text
        x="28"
        y={netY - 6}
        className="fill-[var(--sky)]"
        style={{ fontSize: 8, fontWeight: 700 }}
      >
        Kitchen
      </text>
      <text
        x="28"
        y={netY + 12}
        className="fill-[var(--sky)]"
        style={{ fontSize: 8, fontWeight: 700 }}
      >
        Kitchen
      </text>
      {children}
    </svg>
  );
}

function Player({
  cx,
  cy,
  fill = "var(--accent)",
  label,
  opacity = 1,
}: {
  cx: number;
  cy: number;
  fill?: string;
  label?: string;
  opacity?: number;
}) {
  return (
    <g opacity={opacity}>
      <circle cx={cx} cy={cy} r="8" fill={fill} />
      {label ? (
        <text
          x={cx}
          y={cy + 18}
          textAnchor="middle"
          className="fill-[var(--muted)]"
          style={{ fontSize: 8 }}
        >
          {label}
        </text>
      ) : null}
    </g>
  );
}

export function CourtRolesDiagram() {
  const reduce = useReducedMotion();
  return (
    <CourtShell label="Doubles halves — own your lane">
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
        y="40"
        textAnchor="middle"
        className="fill-[var(--foreground)]"
        style={{ fontSize: 11, fontWeight: 600 }}
      >
        Your half
      </text>
      <text
        x="232"
        y="40"
        textAnchor="middle"
        className="fill-[var(--foreground)]"
        style={{ fontSize: 11, fontWeight: 600 }}
      >
        Partner half
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
      <text x="160" y="118" textAnchor="middle" className="fill-[var(--amber)]" style={{ fontSize: 8, fontWeight: 600 }}>
        Middle seam — call it
      </text>
    </CourtShell>
  );
}

export function NvzDiagram() {
  return (
    <svg viewBox="0 0 320 180" className="h-auto w-full" role="img" aria-label="Kitchen non-volley zone">
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
      <line x1="24" y1="90" x2="296" y2="90" stroke="var(--foreground)" strokeWidth="2" opacity="0.5" />
      <line x1="160" y1="64" x2="160" y2="116" stroke="var(--line-strong)" strokeWidth="2" />
      <text x="160" y="84" textAnchor="middle" className="fill-[var(--sky)]" style={{ fontSize: 11, fontWeight: 700 }}>
        Kitchen (NVZ)
      </text>
      <text x="160" y="102" textAnchor="middle" className="fill-[var(--sky)]" style={{ fontSize: 8, fontWeight: 600 }}>
        No volleys on the line
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
    <CourtShell label="Serve and return race to the kitchen" h={220}>
      <Player cx={100} cy={188} fill="var(--amber)" />
      <Player cx={160} cy={188} fill="var(--amber)" />
      <text x="130" y="210" textAnchor="middle" className="fill-[var(--muted)]" style={{ fontSize: 8 }}>
        Servers stay back for third
      </text>

      {/* Serve: firm depth, slightly arced */}
      <motion.circle
        r="5"
        fill="var(--foreground)"
        initial={reduce ? false : { cx: 120, cy: 180, opacity: 0.2 }}
        animate={
          reduce
            ? { cx: 230, cy: 42, opacity: 1 }
            : {
                cx: [120, 200, 230],
                cy: [180, 100, 42],
                opacity: [0.3, 1, 1],
              }
        }
        transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 0.9, ease: "easeInOut" }}
      />
      <text x="70" y="130" className="fill-[var(--amber)]" style={{ fontSize: 8, fontWeight: 600 }}>
        1 Serve deep
      </text>

      {/* Return: deep placement arc */}
      <motion.path
        d="M240 50 Q180 90 140 170"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeDasharray="5 4"
        initial={reduce ? false : { pathLength: 0, opacity: 0.3 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 2.1, ease: "easeInOut" }}
      />
      <text x="210" y="120" className="fill-[var(--accent)]" style={{ fontSize: 8, fontWeight: 600 }}>
        2 Return deep
      </text>

      <motion.circle
        cx="220"
        r="9"
        fill="var(--accent)"
        animate={reduce ? { cy: 70 } : { cy: [40, 40, 70, 70] }}
        transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 0.9, ease: "easeInOut" }}
      />
      <motion.circle
        cx="270"
        r="9"
        fill="var(--accent)"
        animate={reduce ? { cy: 70 } : { cy: [40, 40, 70, 70] }}
        transition={{ duration: 2.4, delay: 0.08, repeat: Infinity, repeatDelay: 0.9, ease: "easeInOut" }}
      />
      <text x="245" y="30" textAnchor="middle" className="fill-[var(--accent)]" style={{ fontSize: 8, fontWeight: 700 }}>
        3 Claim kitchen line
      </text>
    </CourtShell>
  );
}

export function StayBackVsUpDiagram() {
  const reduce = useReducedMotion();
  return (
    <CourtShell label="When to stay back versus go up" h={220}>
      <Player cx={110} cy={48} fill="var(--accent)" />
      <Player cx={210} cy={48} fill="var(--accent)" />
      <text x="160" y="34" textAnchor="middle" className="fill-[var(--muted)]" style={{ fontSize: 8 }}>
        Opponents set at kitchen → hold / drop
      </text>

      <motion.circle
        cx="120"
        r="8"
        fill="var(--amber)"
        animate={reduce ? { cy: 170 } : { cy: [170, 170, 110, 110, 170] }}
        transition={{ duration: 3.2, repeat: Infinity, repeatDelay: 0.6, ease: "easeInOut" }}
      />
      <motion.circle
        cx="200"
        r="8"
        fill="var(--amber)"
        animate={reduce ? { cy: 170 } : { cy: [170, 170, 110, 110, 170] }}
        transition={{ duration: 3.2, delay: 0.1, repeat: Infinity, repeatDelay: 0.6, ease: "easeInOut" }}
      />

      <motion.path
        d="M160 160 Q160 130 160 95"
        fill="none"
        stroke="var(--sky)"
        strokeWidth="2"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: [0, 1, 1, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, repeatDelay: 0.6 }}
      />
      <text x="188" y="130" className="fill-[var(--sky)]" style={{ fontSize: 8, fontWeight: 600 }}>
        Neutralizing drop → go up
      </text>
      <text x="160" y="200" textAnchor="middle" className="fill-[var(--muted)]" style={{ fontSize: 8 }}>
        Float / jam → freeze midcourt
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
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], repeat: Infinity, repeatDelay: 1.4 }}
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
      <text x="24" y="188" className="fill-[var(--muted)]" style={{ fontSize: 8, fontWeight: 600 }}>
        Your baseline
      </text>
      <text x="24" y="128" className="fill-[var(--sky)]" style={{ fontSize: 8, fontWeight: 600 }}>
        Midcourt
      </text>
      <text x="24" y="78" className="fill-[var(--accent)]" style={{ fontSize: 8, fontWeight: 600 }}>
        Kitchen line
      </text>
      <motion.circle
        cx="140"
        r="8"
        fill="var(--accent)"
        animate={reduce ? { cy: 78 } : { cy: [168, 128, 78] }}
        transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 0.6, ease: "easeInOut" }}
      />
      <motion.circle
        cx="220"
        r="8"
        fill="var(--amber)"
        animate={reduce ? { cy: 78 } : { cy: [168, 128, 78] }}
        transition={{ duration: 2.2, delay: 0.08, repeat: Infinity, repeatDelay: 0.6, ease: "easeInOut" }}
      />
      <text x="180" y="198" textAnchor="middle" className="fill-[var(--muted)]" style={{ fontSize: 9 }}>
        Both partners advance together
      </text>
    </CourtShell>
  );
}

export function KitchenBattleDiagram() {
  const reduce = useReducedMotion();
  return (
    <CourtShell label="Kitchen battle patterns" h={200}>
      <Player cx={100} cy={70} fill="var(--accent)" />
      <Player cx={220} cy={70} fill="var(--accent)" />
      <Player cx={100} cy={150} fill="var(--amber)" />
      <Player cx={220} cy={150} fill="var(--amber)" />
      <motion.path
        d="M110 140 Q160 100 210 80"
        fill="none"
        stroke="var(--amber)"
        strokeWidth="1.5"
        strokeDasharray="5 4"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, ease: "easeInOut", repeat: Infinity, repeatDelay: 1.2 }}
      />
      <motion.path
        d="M210 145 Q160 120 110 85"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeDasharray="5 4"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, delay: 0.2, ease: "easeInOut", repeat: Infinity, repeatDelay: 1.2 }}
      />
      <text x="160" y="108" textAnchor="middle" className="fill-[var(--foreground)]" style={{ fontSize: 9, fontWeight: 600 }}>
        Cross · feet · middle
      </text>
    </CourtShell>
  );
}

export function ThirdShotChoiceDiagram() {
  const reduce = useReducedMotion();
  return (
    <CourtShell label="Third shot drop vs drive" h={200}>
      <Player cx={120} cy={160} fill="var(--amber)" />
      <Player cx={180} cy={160} fill="var(--amber)" />
      <Player cx={120} cy={48} fill="var(--accent)" />
      <Player cx={220} cy={48} fill="var(--accent)" />
      {/* Soft drop arc into kitchen */}
      <motion.path
        d="M150 150 Q160 110 160 90"
        fill="none"
        stroke="var(--sky)"
        strokeWidth="2"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1.4 }}
      />
      <text x="188" y="118" className="fill-[var(--sky)]" style={{ fontSize: 9, fontWeight: 600 }}>
        Drop → kitchen
      </text>
      {/* Hard drive straight to body */}
      <motion.path
        d="M150 150 L200 70"
        fill="none"
        stroke="var(--chart-power)"
        strokeWidth="2.5"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.7, delay: 0.35, repeat: Infinity, repeatDelay: 1.9 }}
      />
      <text x="210" y="100" className="fill-[var(--chart-power)]" style={{ fontSize: 9, fontWeight: 600 }}>
        Drive → body
      </text>
      <text x="160" y="186" textAnchor="middle" className="fill-[var(--muted)]" style={{ fontSize: 9 }}>
        Soft arc vs hard line — read their position
      </text>
    </CourtShell>
  );
}

export function DinkPocketsDiagram() {
  const reduce = useReducedMotion();
  return (
    <CourtShell label="Dink target pockets" h={180}>
      <Player cx={100} cy={55} fill="var(--accent)" />
      <Player cx={220} cy={55} fill="var(--accent)" />
      <Player cx={100} cy={140} fill="var(--amber)" />
      <Player cx={220} cy={140} fill="var(--amber)" />
      <motion.rect
        x="200"
        y="48"
        width="28"
        height="18"
        rx="3"
        fill="color-mix(in srgb, var(--amber) 35%, transparent)"
        stroke="var(--amber)"
        animate={reduce ? undefined : { opacity: [0.45, 1, 0.45] }}
        transition={{ duration: 2.2, repeat: Infinity }}
      />
      <rect
        x="148"
        y="48"
        width="24"
        height="18"
        rx="3"
        fill="color-mix(in srgb, var(--sky) 35%, transparent)"
        stroke="var(--sky)"
      />
      <rect
        x="88"
        y="62"
        width="24"
        height="14"
        rx="3"
        fill="color-mix(in srgb, var(--accent) 30%, transparent)"
        stroke="var(--accent)"
      />
      <text x="214" y="42" textAnchor="middle" className="fill-[var(--amber)]" style={{ fontSize: 7, fontWeight: 600 }}>
        Pocket
      </text>
      <text x="160" y="42" textAnchor="middle" className="fill-[var(--sky)]" style={{ fontSize: 7, fontWeight: 600 }}>
        Middle
      </text>
      <text x="100" y="58" textAnchor="middle" className="fill-[var(--accent)]" style={{ fontSize: 7, fontWeight: 600 }}>
        Feet
      </text>
      <text x="160" y="108" textAnchor="middle" className="fill-[var(--muted)]" style={{ fontSize: 9 }}>
        Soft arc · high placement
      </text>
    </CourtShell>
  );
}

export function DropTargetsDiagram() {
  const reduce = useReducedMotion();
  return (
    <CourtShell label="Drop landing zones" h={180}>
      <Player cx={130} cy={150} fill="var(--amber)" />
      <Player cx={200} cy={150} fill="var(--amber)" opacity={0.7} />
      <Player cx={110} cy={48} fill="var(--accent)" />
      <Player cx={220} cy={48} fill="var(--accent)" />
      <motion.rect
        x="100"
        y="78"
        width="120"
        height="28"
        rx="4"
        fill="color-mix(in srgb, var(--sky) 28%, transparent)"
        stroke="var(--sky)"
        animate={reduce ? undefined : { opacity: [0.55, 1, 0.55] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <text x="160" y="96" textAnchor="middle" className="fill-[var(--sky)]" style={{ fontSize: 10, fontWeight: 700 }}>
        Preferred drop zone
      </text>
      {/* Soft lobbed arc — low pace */}
      <motion.path
        d="M130 140 Q155 105 160 95"
        fill="none"
        stroke="var(--amber)"
        strokeWidth="1.5"
        strokeDasharray="4 3"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.3, repeat: Infinity, repeatDelay: 1 }}
      />
      <text x="160" y="168" textAnchor="middle" className="fill-[var(--muted)]" style={{ fontSize: 8 }}>
        Soft pace · land in kitchen, not deep
      </text>
    </CourtShell>
  );
}

export function SpeedUpLanesDiagram() {
  const reduce = useReducedMotion();
  return (
    <CourtShell label="Speed-up lanes" h={180}>
      <Player cx={110} cy={55} fill="var(--accent)" />
      <Player cx={210} cy={55} fill="var(--accent)" />
      <Player cx={160} cy={140} fill="var(--amber)" />
      {/* Hard straight lines — high pace */}
      <motion.path
        d="M160 130 L160 70"
        stroke="var(--chart-power)"
        strokeWidth="2.5"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.45, repeat: Infinity, repeatDelay: 1.4 }}
      />
      <path d="M160 130 L120 70" stroke="var(--amber)" strokeWidth="1.5" strokeDasharray="4 3" />
      <path d="M160 130 L200 70" stroke="var(--amber)" strokeWidth="1.5" strokeDasharray="4 3" />
      <text x="160" y="100" textAnchor="middle" className="fill-[var(--chart-power)]" style={{ fontSize: 9, fontWeight: 600 }}>
        Body / hip lanes
      </text>
      <text x="160" y="168" textAnchor="middle" className="fill-[var(--muted)]" style={{ fontSize: 8 }}>
        High pace · only above net height
      </text>
    </CourtShell>
  );
}

export function FeetHipsDiagram() {
  return (
    <svg viewBox="0 0 320 180" className="h-auto w-full" role="img" aria-label="Target feet and hips">
      <rect x="40" y="20" width="240" height="140" rx="4" fill="var(--bg-scene)" stroke="var(--line-strong)" />
      <ellipse
        cx="160"
        cy="70"
        rx="28"
        ry="36"
        fill="color-mix(in srgb, var(--accent) 25%, transparent)"
        stroke="var(--accent)"
      />
      <text x="160" y="74" textAnchor="middle" className="fill-[var(--accent)]" style={{ fontSize: 10, fontWeight: 700 }}>
        Hips
      </text>
      <ellipse
        cx="160"
        cy="130"
        rx="34"
        ry="16"
        fill="color-mix(in srgb, var(--amber) 30%, transparent)"
        stroke="var(--amber)"
      />
      <text x="160" y="134" textAnchor="middle" className="fill-[var(--amber)]" style={{ fontSize: 10, fontWeight: 700 }}>
        Feet
      </text>
      <text x="250" y="50" className="fill-[var(--danger)]" style={{ fontSize: 9, fontWeight: 600 }}>
        Avoid chest
      </text>
      <text x="160" y="168" textAnchor="middle" className="fill-[var(--muted)]" style={{ fontSize: 8 }}>
        Placement first — force the lift
      </text>
    </svg>
  );
}

export function ServeReturnShotDiagram() {
  const reduce = useReducedMotion();
  return (
    <CourtShell label="Serve return depth and advance" h={200}>
      <Player cx={90} cy={170} fill="var(--amber)" />
      <circle cx="150" cy="170" r="8" fill="var(--amber)" opacity="0.7" />
      <text x="120" y="190" textAnchor="middle" className="fill-[var(--muted)]" style={{ fontSize: 8 }}>
        Serve team
      </text>

      {/* Deep return placement — firm but not drive pace */}
      <motion.circle
        r="5"
        fill="var(--foreground)"
        animate={
          reduce
            ? { cx: 200, cy: 150 }
            : { cx: [250, 200, 140], cy: [55, 100, 155], opacity: [1, 1, 0.85] }
        }
        transition={{ duration: 2.0, repeat: Infinity, repeatDelay: 0.8, ease: "easeInOut" }}
      />

      <motion.circle
        cx="240"
        r="9"
        fill="var(--accent)"
        animate={reduce ? { cy: 70 } : { cy: [48, 48, 72] }}
        transition={{ duration: 2.0, repeat: Infinity, repeatDelay: 0.8 }}
      />
      <motion.circle
        cx="280"
        r="9"
        fill="var(--accent)"
        animate={reduce ? { cy: 70 } : { cy: [48, 48, 72] }}
        transition={{ duration: 2.0, delay: 0.06, repeat: Infinity, repeatDelay: 0.8 }}
      />
      <text x="260" y="34" textAnchor="middle" className="fill-[var(--accent)]" style={{ fontSize: 8, fontWeight: 700 }}>
        Return deep → both go
      </text>
      <text x="160" y="118" textAnchor="middle" className="fill-[var(--sky)]" style={{ fontSize: 8, fontWeight: 600 }}>
        Depth placement buys the kitchen race
      </text>
    </CourtShell>
  );
}

/** Drive: hard straight lines to body / middle seam. */
export function DriveLanesDiagram() {
  const reduce = useReducedMotion();
  return (
    <CourtShell label="Drive lanes — body and middle" h={200}>
      <Player cx={120} cy={160} fill="var(--amber)" label="You" />
      <Player cx={190} cy={160} fill="var(--amber)" />
      {/* Opponents midcourt — drive window */}
      <Player cx={110} cy={70} fill="var(--accent)" />
      <Player cx={210} cy={70} fill="var(--accent)" />
      <text x="160" y="48" textAnchor="middle" className="fill-[var(--muted)]" style={{ fontSize: 8 }}>
        Stuck midcourt / late to line
      </text>

      <motion.path
        d="M150 150 L160 78"
        fill="none"
        stroke="var(--chart-power)"
        strokeWidth="2.5"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1.5 }}
      />
      <path d="M150 150 L120 78" fill="none" stroke="var(--amber)" strokeWidth="1.5" strokeDasharray="4 3" />
      <path d="M150 150 L200 78" fill="none" stroke="var(--amber)" strokeWidth="1.5" strokeDasharray="4 3" />

      <circle cx="160" cy="78" r="10" fill="color-mix(in srgb, var(--chart-power) 30%, transparent)" stroke="var(--chart-power)" />
      <text x="160" y="108" textAnchor="middle" className="fill-[var(--chart-power)]" style={{ fontSize: 9, fontWeight: 700 }}>
        Middle seam / body
      </text>
      <text x="160" y="188" textAnchor="middle" className="fill-[var(--muted)]" style={{ fontSize: 8 }}>
        High pace · straight path · not a sideline hero ball
      </text>
    </CourtShell>
  );
}

/** Reset: soft absorb into middle kitchen. */
export function ResetZoneDiagram() {
  const reduce = useReducedMotion();
  return (
    <CourtShell label="Reset into middle kitchen" h={190}>
      <Player cx={100} cy={55} fill="var(--accent)" />
      <Player cx={220} cy={55} fill="var(--accent)" />
      <Player cx={140} cy={150} fill="var(--amber)" />
      <Player cx={210} cy={150} fill="var(--amber)" opacity={0.65} />

      <motion.ellipse
        cx="160"
        cy="100"
        rx="42"
        ry="16"
        fill="color-mix(in srgb, var(--sky) 28%, transparent)"
        stroke="var(--sky)"
        animate={reduce ? undefined : { opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2.2, repeat: Infinity }}
      />
      <text x="160" y="104" textAnchor="middle" className="fill-[var(--sky)]" style={{ fontSize: 9, fontWeight: 700 }}>
        Middle kitchen die zone
      </text>

      {/* Soft floating absorb arc — lowest pace */}
      <motion.path
        d="M145 140 Q155 118 160 105"
        fill="none"
        stroke="var(--amber)"
        strokeWidth="1.5"
        strokeDasharray="3 3"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.9 }}
      />
      <text x="160" y="175" textAnchor="middle" className="fill-[var(--muted)]" style={{ fontSize: 8 }}>
        Softest pace · absorb, do not swing
      </text>
    </CourtShell>
  );
}

/** Lob deep over shoulder, then overhead smash to feet. */
export function LobOverheadDiagram() {
  const reduce = useReducedMotion();
  return (
    <CourtShell label="Lob deep then overhead to feet" h={210}>
      <Player cx={140} cy={150} fill="var(--amber)" />
      <Player cx={210} cy={150} fill="var(--amber)" opacity={0.7} />
      <Player cx={160} cy={78} fill="var(--accent)" />
      <text x="200" y="72" className="fill-[var(--muted)]" style={{ fontSize: 8 }}>
        Crowding line
      </text>

      {/* High soft lob arc to deep baseline */}
      <motion.path
        d="M150 140 Q160 40 165 28"
        fill="none"
        stroke="var(--sky)"
        strokeWidth="2"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 1.6 }}
      />
      <text x="210" y="40" className="fill-[var(--sky)]" style={{ fontSize: 8, fontWeight: 600 }}>
        Lob deep BH shoulder
      </text>
      <circle cx="165" cy="28" r="5" fill="var(--sky)" />

      {/* Overhead smash straight down to feet — high pace */}
      <motion.path
        d="M165 32 L150 145"
        fill="none"
        stroke="var(--chart-power)"
        strokeWidth="2.5"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.55, delay: 0.9, repeat: Infinity, repeatDelay: 2.45 }}
      />
      <text x="88" y="100" className="fill-[var(--chart-power)]" style={{ fontSize: 8, fontWeight: 600 }}>
        Overhead → feet
      </text>
      <text x="160" y="195" textAnchor="middle" className="fill-[var(--muted)]" style={{ fontSize: 8 }}>
        Soft high placement, then hard finish
      </text>
    </CourtShell>
  );
}

/** Erne outside kitchen + ATP around post. */
export function ErneAtpDiagram() {
  const reduce = useReducedMotion();
  return (
    <CourtShell label="Erne outside kitchen and around-the-post" h={200}>
      <Player cx={100} cy={150} fill="var(--amber)" />
      <Player cx={180} cy={150} fill="var(--amber)" opacity={0.75} />
      <Player cx={120} cy={55} fill="var(--accent)" />
      <Player cx={220} cy={55} fill="var(--accent)" />

      {/* Kitchen sideline illegal zone marker */}
      <rect
        x="8"
        y="76"
        width="24"
        height="48"
        fill="color-mix(in srgb, var(--danger) 18%, transparent)"
        stroke="var(--danger)"
        strokeDasharray="3 2"
      />
      <text x="20" y="70" textAnchor="middle" className="fill-[var(--danger)]" style={{ fontSize: 7, fontWeight: 700 }}>
        NVZ
      </text>

      {/* Erne attacker outside kitchen */}
      <motion.circle
        cx="28"
        cy="78"
        r="9"
        fill="var(--chart-power)"
        animate={reduce ? undefined : { cy: [100, 78, 78, 100] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <text x="52" y="74" className="fill-[var(--chart-power)]" style={{ fontSize: 8, fontWeight: 700 }}>
        Erne (outside)
      </text>
      <motion.path
        d="M36 78 L100 58"
        fill="none"
        stroke="var(--chart-power)"
        strokeWidth="2"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1.8 }}
      />

      {/* ATP path around post */}
      <circle cx="312" cy="100" r="4" fill="var(--foreground)" opacity="0.5" />
      <motion.path
        d="M240 140 Q310 100 250 70"
        fill="none"
        stroke="var(--amber)"
        strokeWidth="1.5"
        strokeDasharray="4 3"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, delay: 0.3, repeat: Infinity, repeatDelay: 1.5 }}
      />
      <text x="270" y="128" className="fill-[var(--amber)]" style={{ fontSize: 8, fontWeight: 600 }}>
        ATP
      </text>
      <text x="160" y="188" textAnchor="middle" className="fill-[var(--muted)]" style={{ fontSize: 8 }}>
        High risk · partner must cover the counter lane
      </text>
    </CourtShell>
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
    | "third-shot-choice"
    | "stay-back-vs-up";
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
    case "stay-back-vs-up":
      return <StayBackVsUpDiagram />;
  }
}

export function ShotDiagram({
  kind,
}: {
  kind:
    | "dink-pockets"
    | "drop-targets"
    | "speed-up-lanes"
    | "feet-hips"
    | "serve-return"
    | "drive-lanes"
    | "reset-zone"
    | "lob-overhead"
    | "erne-atp";
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
    case "serve-return":
      return <ServeReturnShotDiagram />;
    case "drive-lanes":
      return <DriveLanesDiagram />;
    case "reset-zone":
      return <ResetZoneDiagram />;
    case "lob-overhead":
      return <LobOverheadDiagram />;
    case "erne-atp":
      return <ErneAtpDiagram />;
  }
}
