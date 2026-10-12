"use client";

import { useMemo } from "react";
import type { StringProfile } from "@/types/equipment";
import { tensionOutcome } from "@/lib/equipment/strings";

const W = 340;
const H = 176;
const PAD = { l: 26, r: 58, t: 10, b: 26 };

const scaleX = (t: number, lo: number, span: number) => PAD.l + ((t - lo) / span) * (W - PAD.l - PAD.r);
const sy = (v: number) => H - PAD.b - (v / 100) * (H - PAD.t - PAD.b);

type SeriesKey = "power" | "control" | "spin" | "comfort";
const SERIES: { key: SeriesKey; label: string; stroke: string; dash?: string; width: number }[] = [
  { key: "power", label: "Power", stroke: "var(--foreground)", width: 1.75 },
  { key: "control", label: "Control", stroke: "var(--foreground)", dash: "5 3", width: 1.5 },
  { key: "spin", label: "Spin", stroke: "var(--muted)", width: 1.5 },
  { key: "comfort", label: "Comfort", stroke: "var(--muted)", dash: "2 3", width: 1.5 },
];

/**
 * How power, control, spin and comfort move across the string's tension
 * range at the chosen gauge. Lines are told apart by weight and dash,
 * labelled at their right ends; the accent line is the chosen tension.
 */
export function TensionChart({ string, tension, gaugeMm }: { string: StringProfile; tension: number; gaugeMm: number }) {
  const [lo, hi] = string.tensionRangeLbs;
  const span = Math.max(1, hi - lo);
  const sx = (t: number) => scaleX(t, lo, span);

  const lines = useMemo(() => {
    const steps = 20;
    const pts = Array.from({ length: steps + 1 }, (_, i) => {
      const t = lo + (span * i) / steps;
      return { t, o: tensionOutcome(string, t, gaugeMm) };
    });
    return SERIES.map((s) => ({
      ...s,
      d: pts.map((p, i) => `${i ? "L" : "M"}${scaleX(p.t, lo, span).toFixed(1)},${sy(p.o[s.key]).toFixed(1)}`).join(""),
      end: pts[pts.length - 1].o[s.key],
    }));
  }, [string, gaugeMm, lo, span]);

  // Right-edge labels, nudged apart so they never overlap
  const labels = [...lines]
    .map((l) => ({ key: l.key, label: l.label, y: sy(l.end) }))
    .sort((a, b) => a.y - b.y);
  for (let i = 1; i < labels.length; i++) {
    if (labels[i].y - labels[i - 1].y < 12) labels[i].y = labels[i - 1].y + 12;
  }

  const at = tensionOutcome(string, tension, gaugeMm);
  const rec = string.recommendedTensionLbs;
  const x = sx(tension);

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={`At ${tension} lbs: power ${at.power}, control ${at.control}, spin ${at.spin}, comfort ${at.comfort}`}
      >
        {[0, 50, 100].map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={sy(v)} y2={sy(v)} stroke="var(--line)" strokeWidth="1" />
            <text x={PAD.l - 6} y={sy(v) + 3.5} textAnchor="end" className="sf-chart-tick">
              {v}
            </text>
          </g>
        ))}
        {rec > lo && rec < hi ? (
          <line
            x1={sx(rec)}
            x2={sx(rec)}
            y1={PAD.t}
            y2={H - PAD.b}
            stroke="var(--line-strong)"
            strokeWidth="1"
            strokeDasharray="2 3"
          />
        ) : null}
        {lines.map((l) => (
          <path
            key={l.key}
            d={l.d}
            fill="none"
            stroke={l.stroke}
            strokeWidth={l.width}
            strokeDasharray={l.dash}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
        <line x1={x} x2={x} y1={PAD.t} y2={H - PAD.b} stroke="var(--accent)" strokeWidth="1.5" />
        {SERIES.map((s) => (
          <circle key={s.key} cx={x} cy={sy(at[s.key])} r="2.75" fill="var(--panel)" stroke="var(--accent)" strokeWidth="1.5" />
        ))}
        {labels.map((l) => (
          <text key={l.key} x={W - PAD.r + 6} y={l.y + 3.5} className="sf-chart-label">
            {l.label}
          </text>
        ))}
        <text x={sx(lo)} y={H - 8} className="sf-chart-tick">
          {lo}
        </text>
        {rec > lo + span * 0.12 && rec < hi - span * 0.12 ? (
          <text x={sx(rec)} y={H - 8} textAnchor="middle" className="sf-chart-tick">
            {rec} rec
          </text>
        ) : null}
        <text x={sx(hi)} y={H - 8} textAnchor="end" className="sf-chart-tick">
          {hi} lbs
        </text>
      </svg>
    </figure>
  );
}
