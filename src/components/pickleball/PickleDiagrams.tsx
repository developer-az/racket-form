"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { DoublesLesson, ShotStrategyCard } from "@/types/pickleball";
import {
  COURT_FT,
  COURT_VB_H,
  COURT_VB_W,
  MID_X,
  NET_Y,
  NVZ_OPP_Y,
  NVZ_YOU_Y,
  POS,
  xFt,
  yFt,
} from "@/lib/pickleball/courtGeom";
import {
  DEFEND_ZONES,
  SHOT_CONTACT,
  SHOT_HEAT,
  type DefendZoneId,
  type FaceContact,
} from "@/data/pickleball/shotGeometry";

/**
 * Top-down court in feet. Opponent baseline at the top, your baseline at the bottom.
 * Kitchen = 7' each side of the net.
 */

/** False on server + first client paint so framer-motion cannot hydrate-mismatch. */
function useQuietMotion() {
  const reduce = useReducedMotion();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  return !ready || Boolean(reduce);
}

function CourtShell({
  children,
  label,
  focus = "full",
}: {
  children: ReactNode;
  label: string;
  focus?: "full" | "kitchen";
}) {
  const vbY = focus === "kitchen" ? yFt(10) - 1 : 0;
  const vbH = focus === "kitchen" ? yFt(34) - yFt(10) + 2 : COURT_VB_H;

  return (
    <svg
      viewBox={`0 ${vbY} ${COURT_VB_W} ${vbH}`}
      className="h-auto w-full"
      role="img"
      aria-label={label}
    >
      <defs>
        <linearGradient id="pickleCourtWash" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--bg-scene)" />
          <stop offset="50%" stopColor="color-mix(in srgb, var(--sky) 8%, var(--bg-scene))" />
          <stop offset="100%" stopColor="var(--bg-scene)" />
        </linearGradient>
      </defs>
      <rect
        x={xFt(0)}
        y={yFt(0)}
        width={COURT_FT.width}
        height={COURT_FT.length}
        rx="0.15"
        fill="url(#pickleCourtWash)"
        stroke="var(--line-strong)"
        strokeWidth="0.12"
      />
      <rect
        x={xFt(0)}
        y={NVZ_OPP_Y}
        width={COURT_FT.width}
        height={COURT_FT.kitchen * 2}
        fill="color-mix(in srgb, var(--sky) 16%, transparent)"
      />
      <line
        x1={xFt(0)}
        y1={NET_Y}
        x2={xFt(COURT_FT.width)}
        y2={NET_Y}
        stroke="var(--foreground)"
        strokeWidth="0.16"
        opacity="0.55"
      />
      <line
        x1={MID_X}
        y1={NVZ_OPP_Y}
        x2={MID_X}
        y2={NVZ_YOU_Y}
        stroke="var(--line-strong)"
        strokeWidth="0.1"
      />
      <text
        x={xFt(0.35)}
        y={NET_Y - 0.35}
        className="fill-[var(--sky)]"
        style={{ fontSize: 0.85, fontWeight: 700 }}
      >
        7' kitchen
      </text>
      <text
        x={xFt(0.35)}
        y={NET_Y + 1.05}
        className="fill-[var(--sky)]"
        style={{ fontSize: 0.85, fontWeight: 700 }}
      >
        7' kitchen
      </text>
      <text
        x={MID_X}
        y={yFt(0) - 0.55}
        textAnchor="middle"
        className="fill-[var(--muted)]"
        style={{ fontSize: 0.75, fontWeight: 600 }}
      >
        20' × 44'
      </text>
      {children}
    </svg>
  );
}

function Player({
  x,
  y,
  fill = "var(--accent)",
  label,
  opacity = 1,
}: {
  x: number;
  y: number;
  fill?: string;
  label?: string;
  opacity?: number;
}) {
  return (
    <g opacity={opacity}>
      <circle cx={xFt(x)} cy={yFt(y)} r="0.72" fill={fill} />
      {label ? (
        <text
          x={xFt(x)}
          y={yFt(y) + 1.45}
          textAnchor="middle"
          className="fill-[var(--muted)]"
          style={{ fontSize: 0.8 }}
        >
          {label}
        </text>
      ) : null}
    </g>
  );
}

function HeatZones({ active }: { active?: DefendZoneId[] }) {
  const on = active && active.length > 0 ? new Set(active) : null;
  return (
    <g>
      {DEFEND_ZONES.flatMap((z) =>
        z.rects.map((r, i) => {
          const lit = !on || on.has(z.id);
          return (
            <g key={`${z.id}-${i}`} opacity={lit ? 1 : 0.22}>
              <rect
                x={xFt(r.x)}
                y={yFt(r.y)}
                width={r.w}
                height={r.h}
                rx="0.25"
                fill={`color-mix(in srgb, ${lit ? "var(--amber)" : "var(--muted)"} ${lit ? 32 : 12}%, transparent)`}
                stroke={lit ? "var(--amber)" : "var(--line-strong)"}
                strokeWidth="0.08"
              />
              {i === 0 ? (
                <text
                  x={xFt(r.x + r.w / 2)}
                  y={yFt(r.y) - 0.25}
                  textAnchor="middle"
                  className="fill-[var(--foreground)]"
                  style={{ fontSize: 0.72, fontWeight: 700 }}
                >
                  {z.rank} · {z.difficulty}
                </text>
              ) : null}
            </g>
          );
        }),
      )}
    </g>
  );
}

export function FaceAngleStrip({
  faceDeg,
  contactHeightIn,
  note,
}: FaceContact) {
  const reduce = useQuietMotion();
  const floor = 78;
  const inch = 1.15;
  const netH = COURT_FT.netCenterIn * inch;
  const netX = 118;
  const contactY = floor - contactHeightIn * inch;
  const paddleLen = 28;
  const rad = (faceDeg * Math.PI) / 180;
  const x2 = 52 + Math.cos(rad) * paddleLen;
  const y2 = contactY - Math.sin(rad) * paddleLen;
  const open = faceDeg > 0;
  const label = open ? `Open ${Math.abs(faceDeg)}°` : faceDeg < 0 ? `Closed ${Math.abs(faceDeg)}°` : "Square 0°";

  return (
    <div>
      <svg viewBox="0 0 220 96" className="h-auto w-full" role="img" aria-label={`Paddle face ${label}`}>
        <line x1="8" y1={floor} x2="212" y2={floor} stroke="var(--line-strong)" strokeWidth="1.5" />
        <line
          x1={netX}
          y1={floor}
          x2={netX}
          y2={floor - netH}
          stroke="var(--foreground)"
          strokeWidth="2"
        />
        <line
          x1={netX - 10}
          y1={floor - netH}
          x2={netX + 10}
          y2={floor - COURT_FT.netSidelineIn * inch}
          stroke="var(--foreground)"
          strokeWidth="1.5"
        />
        <text x={netX + 8} y={floor - netH - 4} className="fill-[var(--muted)]" style={{ fontSize: 8, fontWeight: 700 }}>
          Tape {COURT_FT.netCenterIn}"
        </text>
        <motion.path
          d={`M 52 ${contactY} L ${x2} ${y2}`}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="3.5"
          strokeLinecap="round"
          initial={reduce ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.45 }}
        />
        <circle cx="52" cy={contactY} r="4" fill="var(--foreground)" />
        <text x="12" y={contactY - 8} className="fill-[var(--accent)]" style={{ fontSize: 9, fontWeight: 700 }}>
          {label}
        </text>
        <text x="12" y={contactY + 12} className="fill-[var(--muted)]" style={{ fontSize: 8 }}>
          Contact {contactHeightIn}"
        </text>
        <motion.circle
          r="4"
          fill="var(--amber)"
          initial={reduce ? false : { cx: 56, cy: contactY, opacity: 0.4 }}
          animate={
            reduce
              ? { cx: netX + 36, cy: floor - 18, opacity: 1 }
              : {
                  cx: [56, netX, netX + 40],
                  cy: [contactY, floor - netH - 8, floor - 16],
                  opacity: [0.4, 1, 1],
                }
          }
          transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 0.7, ease: "easeInOut" }}
        />
      </svg>
      <p className="mt-1 text-[11px] leading-relaxed text-[var(--muted)]">{note}</p>
    </div>
  );
}

export function DefendLegend({ active }: { active?: DefendZoneId[] }) {
  const on = active && active.length > 0 ? new Set(active) : null;
  return (
    <ol className="space-y-1.5">
      {DEFEND_ZONES.map((z) => {
        const lit = !on || on.has(z.id);
        return (
          <li
            key={z.id}
            className={`border-l pl-2.5 text-[11px] leading-snug ${lit ? "border-[var(--amber)] text-[var(--foreground)]/90" : "border-[var(--line)] text-[var(--muted)]"}`}
          >
            <span className="font-semibold tabular-nums">
              {z.rank}. {z.label} · {z.difficulty}
            </span>
            {lit ? <span className="mt-0.5 block text-[var(--muted)]">{z.why}</span> : null}
          </li>
        );
      })}
      <li className="pt-1 text-[10px] text-[var(--muted)]">
        Teaching difficulty 0–100 — not PPA / MLP shot telemetry.
      </li>
    </ol>
  );
}

export function CourtRolesDiagram() {
  const reduce = useQuietMotion();
  return (
    <CourtShell label="Doubles halves — own your lane">
      <line
        x1={MID_X}
        y1={yFt(0)}
        x2={MID_X}
        y2={yFt(44)}
        stroke="var(--amber)"
        strokeWidth="0.12"
        strokeDasharray="0.35 0.28"
      />
      <text x={xFt(5)} y={yFt(6)} textAnchor="middle" className="fill-[var(--foreground)]" style={{ fontSize: 1.1, fontWeight: 600 }}>
        Your half
      </text>
      <text x={xFt(15)} y={yFt(6)} textAnchor="middle" className="fill-[var(--foreground)]" style={{ fontSize: 1.1, fontWeight: 600 }}>
        Partner half
      </text>
      <motion.circle
        cx={xFt(5)}
        r="0.85"
        fill="var(--accent)"
        initial={reduce ? false : { opacity: 0.4, cy: yFt(36) }}
        animate={{ opacity: 1, cy: yFt(29.6) }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.circle
        cx={xFt(15)}
        r="0.85"
        fill="var(--amber)"
        initial={reduce ? false : { opacity: 0.4, cy: yFt(36) }}
        animate={{ opacity: 1, cy: yFt(29.6) }}
        transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
      />
      <text x={MID_X} y={yFt(22) - 1.6} textAnchor="middle" className="fill-[var(--amber)]" style={{ fontSize: 0.85, fontWeight: 600 }}>
        Middle seam — call it
      </text>
    </CourtShell>
  );
}

export function NvzDiagram() {
  return (
    <CourtShell label="Kitchen non-volley zone — 7 feet" focus="kitchen">
      <text x={MID_X} y={yFt(12.2)} textAnchor="middle" className="fill-[var(--muted)]" style={{ fontSize: 0.9, fontWeight: 600 }}>
        Volley OK (behind the 7' line)
      </text>
      <text x={MID_X} y={yFt(22) - 1.2} textAnchor="middle" className="fill-[var(--sky)]" style={{ fontSize: 0.95, fontWeight: 700 }}>
        NVZ — no volleys on the line
      </text>
      <text x={MID_X} y={yFt(32)} textAnchor="middle" className="fill-[var(--muted)]" style={{ fontSize: 0.9 }}>
        Bounce → step in OK, then clear
      </text>
      <text x={xFt(19.2)} y={yFt(13)} textAnchor="end" className="fill-[var(--amber)]" style={{ fontSize: 0.8, fontWeight: 600 }}>
        Erne outside →
      </text>
    </CourtShell>
  );
}

export function ServeReceiveDiagram() {
  const reduce = useQuietMotion();
  return (
    <CourtShell label="Serve and return race to the kitchen">
      <Player x={POS.youBaseL.x} y={POS.youBaseL.y} fill="var(--amber)" />
      <Player x={POS.youBaseR.x} y={POS.youBaseR.y} fill="var(--amber)" />
      <text x={xFt(10)} y={yFt(43.4)} textAnchor="middle" className="fill-[var(--muted)]" style={{ fontSize: 0.8 }}>
        Servers stay back for third
      </text>
      <motion.circle
        r="0.38"
        fill="var(--foreground)"
        initial={reduce ? false : { cx: xFt(7), cy: yFt(40), opacity: 0.2 }}
        animate={
          reduce
            ? { cx: xFt(14), cy: yFt(4), opacity: 1 }
            : {
                cx: [xFt(7), xFt(12), xFt(14)],
                cy: [yFt(40), yFt(22), yFt(4)],
                opacity: [0.3, 1, 1],
              }
        }
        transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 0.9, ease: "easeInOut" }}
      />
      <text x={xFt(2.2)} y={yFt(24)} className="fill-[var(--amber)]" style={{ fontSize: 0.85, fontWeight: 600 }}>
        1 Serve deep (~3' inside baseline)
      </text>
      <motion.path
        d={`M${xFt(14)} ${yFt(5)} Q${xFt(11)} ${yFt(22)} ${xFt(8)} ${yFt(40)}`}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="0.12"
        strokeDasharray="0.4 0.3"
        initial={reduce ? false : { pathLength: 0, opacity: 0.3 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 2.1, ease: "easeInOut" }}
      />
      <text x={xFt(12.5)} y={yFt(18)} className="fill-[var(--accent)]" style={{ fontSize: 0.85, fontWeight: 600 }}>
        2 Return deep
      </text>
      <motion.circle
        cx={xFt(14)}
        r="0.72"
        fill="var(--accent)"
        animate={reduce ? { cy: yFt(15) } : { cy: [yFt(4), yFt(4), yFt(14.4), yFt(14.4)] }}
        transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 0.9, ease: "easeInOut" }}
      />
      <motion.circle
        cx={xFt(17)}
        r="0.72"
        fill="var(--accent)"
        animate={reduce ? { cy: yFt(15) } : { cy: [yFt(4), yFt(4), yFt(14.4), yFt(14.4)] }}
        transition={{ duration: 2.4, delay: 0.08, repeat: Infinity, repeatDelay: 0.9, ease: "easeInOut" }}
      />
      <text x={xFt(15.5)} y={yFt(2.4)} textAnchor="middle" className="fill-[var(--accent)]" style={{ fontSize: 0.85, fontWeight: 700 }}>
        3 Claim kitchen line
      </text>
    </CourtShell>
  );
}

export function StayBackVsUpDiagram() {
  const reduce = useQuietMotion();
  return (
    <CourtShell label="When to stay back versus go up">
      <Player x={5} y={14.4} fill="var(--accent)" />
      <Player x={15} y={14.4} fill="var(--accent)" />
      <text x={MID_X} y={yFt(12)} textAnchor="middle" className="fill-[var(--muted)]" style={{ fontSize: 0.85 }}>
        Opponents set at kitchen → hold / drop
      </text>
      <motion.circle
        cx={xFt(6)}
        r="0.72"
        fill="var(--amber)"
        animate={reduce ? { cy: yFt(40) } : { cy: [yFt(40), yFt(40), yFt(22), yFt(22), yFt(40)] }}
        transition={{ duration: 3.2, repeat: Infinity, repeatDelay: 0.6, ease: "easeInOut" }}
      />
      <motion.circle
        cx={xFt(14)}
        r="0.72"
        fill="var(--amber)"
        animate={reduce ? { cy: yFt(40) } : { cy: [yFt(40), yFt(40), yFt(22), yFt(22), yFt(40)] }}
        transition={{ duration: 3.2, delay: 0.1, repeat: Infinity, repeatDelay: 0.6, ease: "easeInOut" }}
      />
      <motion.path
        d={`M${xFt(10)} ${yFt(38)} Q${xFt(10)} ${yFt(26)} ${xFt(10)} ${yFt(18)}`}
        fill="none"
        stroke="var(--sky)"
        strokeWidth="0.14"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: [0, 1, 1, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, repeatDelay: 0.6 }}
      />
      <text x={xFt(11.2)} y={yFt(26)} className="fill-[var(--sky)]" style={{ fontSize: 0.85, fontWeight: 600 }}>
        Neutralizing drop → go up
      </text>
      <text x={MID_X} y={yFt(43)} textAnchor="middle" className="fill-[var(--muted)]" style={{ fontSize: 0.8 }}>
        Float / jam → freeze midcourt
      </text>
    </CourtShell>
  );
}

export function StackBasicDiagram() {
  const reduce = useQuietMotion();
  return (
    <CourtShell label="Basic stacking">
      <line
        x1={MID_X}
        y1={yFt(0)}
        x2={MID_X}
        y2={yFt(44)}
        stroke="var(--line)"
        strokeWidth="0.08"
        strokeDasharray="0.25 0.25"
      />
      <circle cx={xFt(5)} cy={yFt(40)} r="0.72" fill="var(--accent)" />
      <circle cx={xFt(7)} cy={yFt(40)} r="0.72" fill="var(--amber)" opacity="0.85" />
      <text x={xFt(6)} y={yFt(42.2)} textAnchor="middle" className="fill-[var(--muted)]" style={{ fontSize: 0.85 }}>
        Start same side
      </text>
      <circle cx={xFt(5)} cy={yFt(14.4)} r="0.72" fill="var(--accent)" />
      <motion.circle
        r="0.72"
        fill="var(--amber)"
        initial={reduce ? false : { cx: xFt(7), cy: yFt(40), opacity: 0.5 }}
        animate={{ cx: xFt(15), cy: yFt(14.4), opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], repeat: Infinity, repeatDelay: 1.4 }}
      />
      <path
        d={`M${xFt(7)} ${yFt(39)} Q${xFt(12)} ${yFt(24)} ${xFt(15)} ${yFt(15)}`}
        fill="none"
        stroke="var(--amber)"
        strokeWidth="0.12"
        strokeDasharray="0.3 0.22"
      />
      <text x={xFt(13)} y={yFt(24)} className="fill-[var(--amber)]" style={{ fontSize: 0.9, fontWeight: 600 }}>
        Slide after return
      </text>
    </CourtShell>
  );
}

export function TransitionUnitDiagram() {
  const reduce = useQuietMotion();
  return (
    <CourtShell label="Transition as a unit">
      <text x={xFt(0.4)} y={yFt(41)} className="fill-[var(--muted)]" style={{ fontSize: 0.8, fontWeight: 600 }}>
        Baseline
      </text>
      <text x={xFt(0.4)} y={yFt(22)} className="fill-[var(--sky)]" style={{ fontSize: 0.8, fontWeight: 600 }}>
        Midcourt
      </text>
      <text x={xFt(0.4)} y={yFt(14.2)} className="fill-[var(--accent)]" style={{ fontSize: 0.8, fontWeight: 600 }}>
        Kitchen line
      </text>
      <motion.circle
        cx={xFt(8)}
        r="0.72"
        fill="var(--accent)"
        animate={reduce ? { cy: yFt(14.4) } : { cy: [yFt(41), yFt(22), yFt(14.4)] }}
        transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 0.6, ease: "easeInOut" }}
      />
      <motion.circle
        cx={xFt(14)}
        r="0.72"
        fill="var(--amber)"
        animate={reduce ? { cy: yFt(14.4) } : { cy: [yFt(41), yFt(22), yFt(14.4)] }}
        transition={{ duration: 2.2, delay: 0.08, repeat: Infinity, repeatDelay: 0.6, ease: "easeInOut" }}
      />
      <text x={MID_X} y={yFt(43.2)} textAnchor="middle" className="fill-[var(--muted)]" style={{ fontSize: 0.85 }}>
        Both partners advance together
      </text>
    </CourtShell>
  );
}

export function KitchenBattleDiagram() {
  const reduce = useQuietMotion();
  return (
    <CourtShell label="Kitchen battle patterns — pocket, feet, middle" focus="kitchen">
      <HeatZones active={["pocket", "feet", "middle"]} />
      <Player x={POS.oppLeft.x} y={POS.oppLeft.y} fill="var(--accent)" />
      <Player x={POS.oppRight.x} y={POS.oppRight.y} fill="var(--accent)" />
      <Player x={POS.youLeft.x} y={POS.youLeft.y} fill="var(--amber)" />
      <Player x={POS.youRight.x} y={POS.youRight.y} fill="var(--amber)" />
      <motion.path
        d={`M${xFt(6)} ${yFt(28.5)} Q${xFt(12)} ${yFt(22)} ${xFt(17.5)} ${yFt(16.4)}`}
        fill="none"
        stroke="var(--amber)"
        strokeWidth="0.12"
        strokeDasharray="0.35 0.25"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, ease: "easeInOut", repeat: Infinity, repeatDelay: 1.2 }}
      />
      <text x={MID_X} y={yFt(21)} textAnchor="middle" className="fill-[var(--foreground)]" style={{ fontSize: 0.85, fontWeight: 600 }}>
        Cross · feet · middle
      </text>
    </CourtShell>
  );
}

export function ThirdShotChoiceDiagram() {
  const reduce = useQuietMotion();
  return (
    <CourtShell label="Third shot drop vs drive">
      <Player x={6} y={40} fill="var(--amber)" />
      <Player x={12} y={40} fill="var(--amber)" />
      <Player x={5} y={14.4} fill="var(--accent)" />
      <Player x={15} y={14.4} fill="var(--accent)" />
      <HeatZones active={["feet", "body"]} />
      <motion.path
        d={`M${xFt(8)} ${yFt(38)} Q${xFt(10)} ${yFt(26)} ${xFt(10)} ${yFt(18)}`}
        fill="none"
        stroke="var(--sky)"
        strokeWidth="0.16"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1.4 }}
      />
      <text x={xFt(12.2)} y={yFt(26)} className="fill-[var(--sky)]" style={{ fontSize: 0.9, fontWeight: 600 }}>
        Drop → 7' kitchen
      </text>
      <motion.path
        d={`M${xFt(8)} ${yFt(38)} L${xFt(10)} ${yFt(10)}`}
        fill="none"
        stroke="var(--chart-power)"
        strokeWidth="0.2"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.7, delay: 0.35, repeat: Infinity, repeatDelay: 1.9 }}
      />
      <text x={xFt(11.5)} y={yFt(12)} className="fill-[var(--chart-power)]" style={{ fontSize: 0.9, fontWeight: 600 }}>
        Drive → body
      </text>
    </CourtShell>
  );
}

export function DinkPocketsDiagram() {
  const reduce = useQuietMotion();
  return (
    <CourtShell label="Dink target pockets in feet" focus="kitchen">
      <HeatZones active={["pocket", "middle", "feet"]} />
      <Player x={POS.oppLeft.x} y={POS.oppLeft.y} fill="var(--accent)" />
      <Player x={POS.oppRight.x} y={POS.oppRight.y} fill="var(--accent)" />
      <Player x={POS.youLeft.x} y={POS.youLeft.y} fill="var(--amber)" />
      <Player x={POS.youRight.x} y={POS.youRight.y} fill="var(--amber)" />
      <motion.path
        d={`M${xFt(6)} ${yFt(28.2)} Q${xFt(11)} ${yFt(22)} ${xFt(17.6)} ${yFt(16.4)}`}
        fill="none"
        stroke="var(--amber)"
        strokeWidth="0.12"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.3, repeat: Infinity, repeatDelay: 1 }}
      />
      <text x={MID_X} y={yFt(21)} textAnchor="middle" className="fill-[var(--muted)]" style={{ fontSize: 0.85 }}>
        Soft arc · just over 34" tape
      </text>
    </CourtShell>
  );
}

export function DropTargetsDiagram() {
  const reduce = useQuietMotion();
  return (
    <CourtShell label="Drop landing zones — 7 foot kitchen" focus="kitchen">
      <HeatZones active={["feet", "middle"]} />
      <Player x={8} y={38} fill="var(--amber)" />
      <Player x={14} y={38} fill="var(--amber)" opacity={0.7} />
      <Player x={POS.oppLeft.x} y={POS.oppLeft.y} fill="var(--accent)" />
      <Player x={POS.oppRight.x} y={POS.oppRight.y} fill="var(--accent)" />
      <motion.path
        d={`M${xFt(8)} ${yFt(37)} Q${xFt(10)} ${yFt(26)} ${xFt(10)} ${yFt(18)}`}
        fill="none"
        stroke="var(--amber)"
        strokeWidth="0.12"
        strokeDasharray="0.3 0.22"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.3, repeat: Infinity, repeatDelay: 1 }}
      />
      <text x={MID_X} y={yFt(32.5)} textAnchor="middle" className="fill-[var(--muted)]" style={{ fontSize: 0.8 }}>
        Soft pace · land in kitchen, not deep
      </text>
    </CourtShell>
  );
}

export function SpeedUpLanesDiagram() {
  const reduce = useQuietMotion();
  return (
    <CourtShell label="Speed-up lanes at hip height" focus="kitchen">
      <HeatZones active={["hip", "middle"]} />
      <Player x={POS.oppLeft.x} y={POS.oppLeft.y} fill="var(--accent)" />
      <Player x={POS.oppRight.x} y={POS.oppRight.y} fill="var(--accent)" />
      <Player x={POS.youMid.x} y={POS.youMid.y} fill="var(--amber)" />
      <motion.path
        d={`M${xFt(10)} ${yFt(28.4)} L${xFt(10)} ${yFt(14.6)}`}
        stroke="var(--chart-power)"
        strokeWidth="0.18"
        fill="none"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.45, repeat: Infinity, repeatDelay: 1.4 }}
      />
      <path
        d={`M${xFt(10)} ${yFt(28.4)} L${xFt(5.2)} ${yFt(13.4)}`}
        stroke="var(--amber)"
        strokeWidth="0.1"
        fill="none"
        strokeDasharray="0.3 0.22"
      />
      <path
        d={`M${xFt(10)} ${yFt(28.4)} L${xFt(14.8)} ${yFt(13.4)}`}
        stroke="var(--amber)"
        strokeWidth="0.1"
        fill="none"
        strokeDasharray="0.3 0.22"
      />
      <text x={MID_X} y={yFt(21)} textAnchor="middle" className="fill-[var(--chart-power)]" style={{ fontSize: 0.85, fontWeight: 600 }}>
        Hip / torso · only above tape
      </text>
    </CourtShell>
  );
}

export function FeetHipsDiagram() {
  return (
    <CourtShell label="Target feet and hips — hardest volleys" focus="kitchen">
      <HeatZones active={["feet", "hip"]} />
      <Player x={POS.oppLeft.x} y={POS.oppLeft.y} fill="var(--accent)" />
      <Player x={POS.oppRight.x} y={POS.oppRight.y} fill="var(--accent)" />
      <Player x={POS.youMid.x} y={POS.youMid.y} fill="var(--amber)" />
      <text x={MID_X} y={yFt(21)} textAnchor="middle" className="fill-[var(--danger)]" style={{ fontSize: 0.85, fontWeight: 600 }}>
        Avoid chest — they punch it
      </text>
      <text x={MID_X} y={yFt(32.4)} textAnchor="middle" className="fill-[var(--muted)]" style={{ fontSize: 0.8 }}>
        Rank 1 feet · rank 3 hip — teaching model
      </text>
    </CourtShell>
  );
}

export function ServeReturnShotDiagram() {
  const reduce = useQuietMotion();
  return (
    <CourtShell label="Serve return depth and advance">
      <Player x={POS.youBaseL.x} y={POS.youBaseL.y} fill="var(--amber)" />
      <circle cx={xFt(POS.youBaseR.x)} cy={yFt(POS.youBaseR.y)} r="0.72" fill="var(--amber)" opacity="0.7" />
      <text x={xFt(10)} y={yFt(43.2)} textAnchor="middle" className="fill-[var(--muted)]" style={{ fontSize: 0.8 }}>
        Serve team
      </text>
      <HeatZones active={["body", "feet"]} />
      <motion.circle
        r="0.38"
        fill="var(--foreground)"
        animate={
          reduce
            ? { cx: xFt(10), cy: yFt(38) }
            : { cx: [xFt(16), xFt(12), xFt(8)], cy: [yFt(6), yFt(22), yFt(39)], opacity: [1, 1, 0.85] }
        }
        transition={{ duration: 2.0, repeat: Infinity, repeatDelay: 0.8, ease: "easeInOut" }}
      />
      <motion.circle
        cx={xFt(14)}
        r="0.72"
        fill="var(--accent)"
        animate={reduce ? { cy: yFt(14.4) } : { cy: [yFt(4), yFt(4), yFt(14.4)] }}
        transition={{ duration: 2.0, repeat: Infinity, repeatDelay: 0.8 }}
      />
      <motion.circle
        cx={xFt(17.5)}
        r="0.72"
        fill="var(--accent)"
        animate={reduce ? { cy: yFt(14.4) } : { cy: [yFt(4), yFt(4), yFt(14.4)] }}
        transition={{ duration: 2.0, delay: 0.06, repeat: Infinity, repeatDelay: 0.8 }}
      />
      <text x={xFt(15.5)} y={yFt(2.3)} textAnchor="middle" className="fill-[var(--accent)]" style={{ fontSize: 0.85, fontWeight: 700 }}>
        Return deep → both go
      </text>
    </CourtShell>
  );
}

export function DriveLanesDiagram() {
  const reduce = useQuietMotion();
  return (
    <CourtShell label="Drive lanes — body and middle">
      <HeatZones active={["body", "middle"]} />
      <Player x={7} y={40} fill="var(--amber)" label="You" />
      <Player x={13} y={40} fill="var(--amber)" />
      <Player x={6} y={10} fill="var(--accent)" />
      <Player x={14} y={10} fill="var(--accent)" />
      <text x={MID_X} y={yFt(6.5)} textAnchor="middle" className="fill-[var(--muted)]" style={{ fontSize: 0.8 }}>
        Stuck midcourt / late to line
      </text>
      <motion.path
        d={`M${xFt(8)} ${yFt(38)} L${xFt(10)} ${yFt(10)}`}
        fill="none"
        stroke="var(--chart-power)"
        strokeWidth="0.18"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1.5 }}
      />
      <path
        d={`M${xFt(8)} ${yFt(38)} L${xFt(6)} ${yFt(10)}`}
        fill="none"
        stroke="var(--amber)"
        strokeWidth="0.1"
        strokeDasharray="0.3 0.22"
      />
      <text x={MID_X} y={yFt(16)} textAnchor="middle" className="fill-[var(--chart-power)]" style={{ fontSize: 0.85, fontWeight: 700 }}>
        Middle seam / body
      </text>
    </CourtShell>
  );
}

export function ResetZoneDiagram() {
  const reduce = useQuietMotion();
  return (
    <CourtShell label="Reset into middle kitchen" focus="kitchen">
      <HeatZones active={["middle"]} />
      <Player x={POS.oppLeft.x} y={POS.oppLeft.y} fill="var(--accent)" />
      <Player x={POS.oppRight.x} y={POS.oppRight.y} fill="var(--accent)" />
      <Player x={8} y={30} fill="var(--amber)" />
      <Player x={14} y={30} fill="var(--amber)" opacity={0.65} />
      <motion.path
        d={`M${xFt(8.5)} ${yFt(29)} Q${xFt(10)} ${yFt(24)} ${xFt(10)} ${yFt(16.5)}`}
        fill="none"
        stroke="var(--amber)"
        strokeWidth="0.12"
        strokeDasharray="0.22 0.22"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.9 }}
      />
      <text x={MID_X} y={yFt(21)} textAnchor="middle" className="fill-[var(--sky)]" style={{ fontSize: 0.85, fontWeight: 700 }}>
        Middle kitchen die zone
      </text>
    </CourtShell>
  );
}

export function LobOverheadDiagram() {
  const reduce = useQuietMotion();
  return (
    <CourtShell label="Lob deep then overhead to feet">
      <HeatZones active={["feet"]} />
      <Player x={8} y={30} fill="var(--amber)" />
      <Player x={14} y={30} fill="var(--amber)" opacity={0.7} />
      <Player x={10} y={14.4} fill="var(--accent)" />
      <text x={xFt(12.5)} y={yFt(13.2)} className="fill-[var(--muted)]" style={{ fontSize: 0.8 }}>
        Crowding line
      </text>
      <motion.path
        d={`M${xFt(8)} ${yFt(29)} Q${xFt(10)} ${yFt(8)} ${xFt(11)} ${yFt(3)}`}
        fill="none"
        stroke="var(--sky)"
        strokeWidth="0.16"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 1.6 }}
      />
      <text x={xFt(13)} y={yFt(5)} className="fill-[var(--sky)]" style={{ fontSize: 0.8, fontWeight: 600 }}>
        Lob deep BH shoulder
      </text>
      <motion.path
        d={`M${xFt(11)} ${yFt(3.2)} L${xFt(10)} ${yFt(14.2)}`}
        fill="none"
        stroke="var(--chart-power)"
        strokeWidth="0.18"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.55, delay: 0.9, repeat: Infinity, repeatDelay: 2.45 }}
      />
      <text x={xFt(2.2)} y={yFt(9)} className="fill-[var(--chart-power)]" style={{ fontSize: 0.8, fontWeight: 600 }}>
        Overhead → feet
      </text>
    </CourtShell>
  );
}

export function ErneAtpDiagram() {
  const reduce = useQuietMotion();
  return (
    <CourtShell label="Erne outside kitchen and around-the-post" focus="kitchen">
      <HeatZones active={["pocket"]} />
      <Player x={POS.youLeft.x} y={POS.youLeft.y} fill="var(--amber)" />
      <Player x={POS.youRight.x} y={POS.youRight.y} fill="var(--amber)" opacity={0.75} />
      <Player x={POS.oppLeft.x} y={POS.oppLeft.y} fill="var(--accent)" />
      <Player x={POS.oppRight.x} y={POS.oppRight.y} fill="var(--accent)" />
      <rect
        x={xFt(-0.15)}
        y={NVZ_OPP_Y}
        width={0.9}
        height={COURT_FT.kitchen * 2}
        fill="color-mix(in srgb, var(--danger) 18%, transparent)"
        stroke="var(--danger)"
        strokeWidth="0.08"
        strokeDasharray="0.2 0.15"
      />
      <text x={xFt(0.3)} y={NVZ_OPP_Y - 0.4} textAnchor="middle" className="fill-[var(--danger)]" style={{ fontSize: 0.7, fontWeight: 700 }}>
        NVZ
      </text>
      <motion.circle
        cx={xFt(-0.6)}
        r="0.72"
        fill="var(--chart-power)"
        animate={reduce ? undefined : { cy: [yFt(18), yFt(14.5), yFt(14.5), yFt(18)] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <text x={xFt(1.4)} y={yFt(13.6)} className="fill-[var(--chart-power)]" style={{ fontSize: 0.8, fontWeight: 700 }}>
        Erne (outside 7')
      </text>
      <motion.path
        d={`M${xFt(-0.2)} ${yFt(14.6)} L${xFt(5)} ${yFt(13.5)}`}
        fill="none"
        stroke="var(--chart-power)"
        strokeWidth="0.14"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1.8 }}
      />
      <circle cx={xFt(20)} cy={NET_Y} r="0.28" fill="var(--foreground)" opacity="0.5" />
      <motion.path
        d={`M${xFt(16)} ${yFt(28)} Q${xFt(21.2)} ${yFt(22)} ${xFt(16.5)} ${yFt(16)}`}
        fill="none"
        stroke="var(--amber)"
        strokeWidth="0.12"
        strokeDasharray="0.3 0.22"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, delay: 0.3, repeat: Infinity, repeatDelay: 1.5 }}
      />
      <text x={xFt(17.6)} y={yFt(25)} className="fill-[var(--amber)]" style={{ fontSize: 0.8, fontWeight: 600 }}>
        ATP
      </text>
    </CourtShell>
  );
}

export function HandBattleDiagram() {
  const reduce = useQuietMotion();
  return (
    <CourtShell label="Hand battle — compact punch at chest height" focus="kitchen">
      <HeatZones active={["hip", "middle"]} />
      <Player x={POS.oppLeft.x} y={POS.oppLeft.y} fill="var(--accent)" />
      <Player x={POS.oppRight.x} y={POS.oppRight.y} fill="var(--accent)" />
      <Player x={POS.youMid.x} y={POS.youMid.y} fill="var(--amber)" />
      {/* Paddle at chest — short punch */}
      <motion.rect
        x={xFt(9.35)}
        width="1.3"
        height="0.28"
        rx="0.08"
        fill="var(--accent)"
        animate={reduce ? { y: yFt(27.6) } : { y: [yFt(28.4), yFt(27.2), yFt(27.2), yFt(28.4)] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.path
        d={`M${xFt(10)} ${yFt(27.4)} L${xFt(10)} ${yFt(13.4)}`}
        fill="none"
        stroke="var(--chart-power)"
        strokeWidth="0.14"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, repeat: Infinity, repeatDelay: 1 }}
      />
      <text x={MID_X} y={yFt(21)} textAnchor="middle" className="fill-[var(--foreground)]" style={{ fontSize: 0.85, fontWeight: 600 }}>
        6–8" punch · recover to chest
      </text>
      <text x={MID_X} y={yFt(32.2)} textAnchor="middle" className="fill-[var(--muted)]" style={{ fontSize: 0.8 }}>
        No full swing at the line
      </text>
    </CourtShell>
  );
}

export function PickleDiagram({
  kind,
}: {
  kind: NonNullable<DoublesLesson["diagram"]>;
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
    case "hand-battle":
      return <HandBattleDiagram />;
  }
}

export function ShotDiagram({
  kind,
}: {
  kind: NonNullable<ShotStrategyCard["diagram"]>;
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
    case "hand-battle":
      return <HandBattleDiagram />;
  }
}

export function ShotGeometryPanel({ kind }: { kind: NonNullable<ShotStrategyCard["diagram"]> }) {
  const contact = SHOT_CONTACT[kind];
  const heat = SHOT_HEAT[kind];
  return (
    <div className="space-y-3">
      <div className="sf-viz-stage">
        <ShotDiagram kind={kind} />
      </div>
      {contact ? (
        <div className="sf-viz-stage">
          <p className="sf-kicker sf-kicker-muted mb-1">Face angle · contact height</p>
          <FaceAngleStrip {...contact} />
        </div>
      ) : null}
      <DefendLegend active={heat} />
    </div>
  );
}
