"use client";

import { useId } from "react";
import type { PaddleProfile, PaddleTapePiece, PaddleTapeZone } from "@/types/pickleball";
import { PADDLE_TAPE_ZONES } from "@/lib/pickleball/paddleMold";

const ZONE_POS: Record<PaddleTapeZone, { x: number; y: number }> = {
  tip: { x: 100, y: 28 },
  "three-nine": { x: 100, y: 78 },
  throat: { x: 100, y: 148 },
  handle: { x: 100, y: 210 },
};

export function PaddleTapeDiagram({
  paddle,
  pieces,
  selectedZone,
  onZoneClick,
}: {
  paddle: PaddleProfile;
  pieces: PaddleTapePiece[];
  selectedZone: PaddleTapeZone | null;
  onZoneClick: (zone: PaddleTapeZone) => void;
}) {
  const uid = useId().replace(/:/g, "");
  const massByZone: Partial<Record<PaddleTapeZone, number>> = {};
  for (const p of pieces) {
    massByZone[p.zone] = (massByZone[p.zone] ?? 0) + p.massG;
  }
  const totalG = pieces.reduce((n, p) => n + p.massG, 0);
  const shape = paddle.shape;
  const w = shape === "elongated" ? 72 : shape === "widebody" ? 96 : shape === "hybrid" ? 84 : 88;
  const h = shape === "elongated" ? 118 : shape === "widebody" ? 100 : shape === "hybrid" ? 110 : 108;
  const rx = shape === "widebody" ? 28 : 22;
  const x = (200 - w) / 2;

  return (
    <div className="relative mx-auto max-w-[220px]">
      <svg viewBox="0 0 200 260" className="h-auto w-full" role="group" aria-label="Paddle tape zones">
        <defs>
          <linearGradient id={`pf-${uid}`} x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor="#2a2f34" />
            <stop offset="100%" stopColor="#1a2220" />
          </linearGradient>
        </defs>
        <rect x={x} y="22" width={w} height={h} rx={rx} fill={`url(#pf-${uid})`} stroke="var(--line-strong)" />
        <rect x="90" y={22 + h - 4} width="20" height="54" rx="4" fill="#2a1c14" />
        <rect x="86" y={22 + h + 42} width="28" height="18" rx="4" fill="#4a3224" />

        {(Object.keys(ZONE_POS) as PaddleTapeZone[]).map((zone) => {
          const pos = ZONE_POS[zone];
          const grams = massByZone[zone] ?? 0;
          const on = selectedZone === zone;
          return (
            <g key={zone}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={on ? 16 : 13}
                fill={grams > 0 ? "color-mix(in srgb, var(--amber) 55%, transparent)" : "color-mix(in srgb, var(--sky) 28%, transparent)"}
                stroke={on ? "var(--amber)" : "var(--line-strong)"}
                strokeWidth={on ? 2.5 : 1.25}
                className="cursor-pointer"
                onClick={() => onZoneClick(zone)}
              />
              <text
                x={pos.x}
                y={pos.y + 4}
                textAnchor="middle"
                className="fill-[var(--foreground)] pointer-events-none"
                style={{ fontSize: 8, fontWeight: 700 }}
              >
                {grams > 0 ? `${grams}g` : zone === "three-nine" ? "3/9" : zone[0]!.toUpperCase()}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="mt-1 text-center text-[10px] text-[var(--muted)]">
        {totalG > 0 ? `${totalG}g tape on ${paddle.brand} ${paddle.name}` : "Tap a zone to add 3g"}
      </p>
    </div>
  );
}
