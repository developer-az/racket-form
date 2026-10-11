"use client";

import { useMemo } from "react";
import {
  BASELINE_TO_NET_M,
  NET_HEIGHT_M,
  M_TO_FT,
  computeBallTrajectory,
} from "@/lib/equipment/ballFlight";

const PAD = { l: 30, r: 8, t: 14, b: 26 };
const COURT_HALF_M = 23.77 / 2;

export interface FlightInput {
  launchDeg: number;
  netClearIn: number;
  contactHeightM: number;
  contactLoM: number;
  contactHiM: number;
  outFrontM: number;
}

/**
 * Side view of a centre-hit drive from the baseline: contact window, launch,
 * net clearance and landing. Distances are court-true; height is exaggerated
 * so the arc is readable.
 */
export function FlightChart({
  flight,
  compare,
  wide = false,
}: {
  flight: FlightInput;
  /** Wider viewBox for full-width panels so labels stay at reading size */
  wide?: boolean;
  /** Optional second trajectory (e.g. the frame in your bag) drawn dashed */
  compare?: FlightInput | null;
}) {
  const W = wide ? 600 : 440;
  const H = wide ? 240 : 220;
  const traj = useMemo(
    () =>
      computeBallTrajectory({
        launchDeg: flight.launchDeg,
        netClearIn: flight.netClearIn,
        contactHeightM: flight.contactHeightM,
        outFrontM: flight.outFrontM,
      }),
    [flight],
  );
  const cmp = useMemo(
    () =>
      compare
        ? computeBallTrajectory({
            launchDeg: compare.launchDeg,
            netClearIn: compare.netClearIn,
            contactHeightM: compare.contactHeightM,
            outFrontM: compare.outFrontM,
          })
        : null,
    [compare],
  );

  // x: metres from contact; the baseline sits outFront behind contact
  const x0 = -flight.outFrontM - 0.6;
  const x1 = BASELINE_TO_NET_M - flight.outFrontM + COURT_HALF_M + 0.5;
  const yMax = Math.max(2.6, traj.apex.y * 1.15, cmp ? cmp.apex.y * 1.15 : 0);
  const sx = (x: number) => PAD.l + ((x - x0) / (x1 - x0)) * (W - PAD.l - PAD.r);
  const sy = (y: number) => H - PAD.b - (y / yMax) * (H - PAD.t - PAD.b);
  const path = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i ? "L" : "M"}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join("");

  const netX = traj.netX;
  const baselineX = -flight.outFrontM;
  const farBaselineX = netX + COURT_HALF_M;
  const serviceX = netX + 6.4;
  const ft = (m: number) => (m * M_TO_FT).toFixed(1);
  const yTicks = [0, 1, 2, 3].filter((v) => v <= yMax);
  const landInside = traj.landX <= farBaselineX;

  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Ball clears the net by ${traj.netClearIn.toFixed(0)} inches and lands ${ft(farBaselineX - traj.landX)} feet inside the baseline`}>
        {yTicks.map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={sy(v)} y2={sy(v)} stroke="var(--line)" />
            <text x={PAD.l - 6} y={sy(v) + 3.5} textAnchor="end" className="sf-chart-tick">
              {v} m
            </text>
          </g>
        ))}

        {/* Court surface and lines */}
        <line x1={sx(baselineX)} x2={sx(farBaselineX)} y1={sy(0)} y2={sy(0)} stroke="var(--foreground)" strokeOpacity={0.5} />
        {[baselineX, serviceX, farBaselineX].map((v) => (
          <line key={v} x1={sx(v)} x2={sx(v)} y1={sy(0)} y2={sy(0) + 5} stroke="var(--foreground)" strokeOpacity={0.5} />
        ))}
        <text x={sx(baselineX)} y={H - 6} textAnchor="middle" className="sf-chart-tick">baseline</text>
        <text x={sx(farBaselineX)} y={H - 6} textAnchor="end" className="sf-chart-tick">far baseline</text>

        {/* Net */}
        <line x1={sx(netX)} x2={sx(netX)} y1={sy(0)} y2={sy(NET_HEIGHT_M)} stroke="var(--foreground)" strokeWidth={1.5} />
        <line x1={sx(netX) - 3} x2={sx(netX) + 3} y1={sy(NET_HEIGHT_M)} y2={sy(NET_HEIGHT_M)} stroke="var(--foreground)" strokeWidth={1.5} />

        {/* Contact window */}
        <rect
          x={sx(0) - 3}
          width={6}
          y={sy(flight.contactHiM)}
          height={sy(flight.contactLoM) - sy(flight.contactHiM)}
          fill="var(--accent)"
          fillOpacity={0.14}
          stroke="var(--accent)"
          strokeOpacity={0.4}
        />

        {cmp ? (
          <path d={path(cmp.points)} fill="none" stroke="var(--muted)" strokeWidth={1.25} strokeDasharray="4 4" />
        ) : null}
        <path d={path(traj.points)} fill="none" stroke="var(--accent)" strokeWidth={2} />

        {/* Net clearance callout */}
        <line
          x1={sx(netX)}
          x2={sx(netX)}
          y1={sy(NET_HEIGHT_M)}
          y2={sy(traj.heightAtNet)}
          stroke="var(--accent)"
          strokeDasharray="2 2"
        />
        <text x={sx(netX) + 6} y={(sy(NET_HEIGHT_M) + sy(traj.heightAtNet)) / 2 + 3} className="sf-chart-label">
          +{traj.netClearIn.toFixed(0)}″ over net
        </text>

        <circle cx={sx(0)} cy={sy(flight.contactHeightM)} r={3.5} fill="var(--accent)" />
        <text x={sx(0) + 8} y={sy(flight.contactHeightM) - 6} className="sf-chart-label">
          {flight.launchDeg.toFixed(1)}° launch
        </text>

        <circle cx={sx(Math.min(traj.landX, x1))} cy={sy(0)} r={3} fill={landInside ? "var(--accent)" : "var(--danger)"} />
        <text x={sx(Math.min(traj.landX, x1))} y={sy(0) - 8} textAnchor="middle" className="sf-chart-label">
          {landInside ? `${ft(farBaselineX - traj.landX)} ft from baseline` : "long"}
        </text>
      </svg>
    </figure>
  );
}
