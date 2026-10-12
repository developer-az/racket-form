"use client";

import { useMemo, useRef, useState } from "react";
import type { RacketProfile } from "@/types/equipment";

export type AxisKey =
  | "weightG"
  | "swingweight"
  | "stiffnessRa"
  | "balanceMm"
  | "headSizeSqIn"
  | "power"
  | "spin"
  | "control"
  | "comfort";

export const AXES: Record<AxisKey, { label: string; unit?: string }> = {
  weightG: { label: "Weight", unit: "g" },
  swingweight: { label: "Swingweight" },
  stiffnessRa: { label: "Stiffness", unit: "RA" },
  balanceMm: { label: "Balance", unit: "mm" },
  headSizeSqIn: { label: "Head size", unit: "in²" },
  power: { label: "Power" },
  spin: { label: "Spin" },
  control: { label: "Control" },
  comfort: { label: "Comfort" },
};

const W = 640;
const H = 400;
const PAD = { l: 44, r: 16, t: 14, b: 36 };

function niceTicks(lo: number, hi: number, count = 5): number[] {
  const span = hi - lo;
  const raw = span / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(Math.round(v * 100) / 100);
  return out;
}

/** Deterministic jitter: catalog specs are quantised, so identical points would stack. */
function jitter(slug: string, axis: number): number {
  let h = axis * 2654435761;
  for (let i = 0; i < slug.length; i++) h = Math.imul(h ^ slug.charCodeAt(i), 16777619);
  return (((h >>> 0) % 1000) / 1000 - 0.5) * 3;
}

/**
 * Every frame in the catalog on two spec axes. Frames outside the current
 * filters stay as faint context so the shortlist reads against the market.
 */
export function CatalogScatter({
  rackets,
  inFilter,
  x,
  y,
  selectedSlug,
  bagSlug,
  compareSlugs,
  onSelect,
}: {
  rackets: RacketProfile[];
  inFilter: Set<string>;
  x: AxisKey;
  y: AxisKey;
  selectedSlug: string | null;
  bagSlug: string | null;
  compareSlugs: string[];
  onSelect: (slug: string) => void;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  const pts = useMemo(
    () =>
      rackets
        .map((r) => ({ r, xv: r[x] as number | null, yv: r[y] as number | null }))
        .filter((p): p is { r: RacketProfile; xv: number; yv: number } => p.xv != null && p.yv != null),
    [rackets, x, y],
  );

  const scale = useMemo(() => {
    const xs = pts.map((p) => p.xv);
    const ys = pts.map((p) => p.yv);
    const pad = (lo: number, hi: number) => {
      const d = (hi - lo || 1) * 0.04;
      return [lo - d, hi + d] as const;
    };
    const [x0, x1] = pad(Math.min(...xs), Math.max(...xs));
    const [y0, y1] = pad(Math.min(...ys), Math.max(...ys));
    return {
      x0,
      x1,
      y0,
      y1,
      sx: (v: number) => PAD.l + ((v - x0) / (x1 - x0)) * (W - PAD.l - PAD.r),
      sy: (v: number) => H - PAD.b - ((v - y0) / (y1 - y0)) * (H - PAD.t - PAD.b),
    };
  }, [pts]);

  const placed = useMemo(
    () =>
      pts.map((p) => ({
        ...p,
        px: scale.sx(p.xv) + jitter(p.r.slug, 1),
        py: scale.sy(p.yv) + jitter(p.r.slug, 2),
      })),
    [pts, scale],
  );

  const nearest = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const mx = ((clientX - rect.left) / rect.width) * W;
    const my = ((clientY - rect.top) / rect.height) * H;
    let best: string | null = null;
    let bestD = 14 * 14;
    for (const p of placed) {
      if (!inFilter.has(p.r.slug)) continue;
      const d = (p.px - mx) ** 2 + (p.py - my) ** 2;
      if (d < bestD) {
        bestD = d;
        best = p.r.slug;
      }
    }
    return best;
  };

  const focus = hover ?? selectedSlug;
  const focusPt = placed.find((p) => p.r.slug === focus) ?? null;
  const compareSet = new Set(compareSlugs);
  const xt = niceTicks(scale.x0, scale.x1);
  const yt = niceTicks(scale.y0, scale.y1);
  const ordered = [...placed].sort(
    (a, b) => Number(inFilter.has(a.r.slug)) - Number(inFilter.has(b.r.slug)),
  );

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full touch-none select-none"
        role="img"
        aria-label={`${AXES[x].label} against ${AXES[y].label} for ${inFilter.size} frames`}
        onPointerMove={(e) => setHover(nearest(e.clientX, e.clientY))}
        onPointerLeave={() => setHover(null)}
        onClick={(e) => {
          const s = nearest(e.clientX, e.clientY);
          if (s) onSelect(s);
        }}
        style={{ cursor: hover ? "pointer" : "default" }}
      >
        {xt.map((v) => (
          <g key={`x${v}`}>
            <line x1={scale.sx(v)} x2={scale.sx(v)} y1={PAD.t} y2={H - PAD.b} stroke="var(--line)" />
            <text x={scale.sx(v)} y={H - PAD.b + 16} textAnchor="middle" className="sf-chart-tick">
              {v}
            </text>
          </g>
        ))}
        {yt.map((v) => (
          <g key={`y${v}`}>
            <line x1={PAD.l} x2={W - PAD.r} y1={scale.sy(v)} y2={scale.sy(v)} stroke="var(--line)" />
            <text x={PAD.l - 8} y={scale.sy(v) + 3.5} textAnchor="end" className="sf-chart-tick">
              {v}
            </text>
          </g>
        ))}
        <text x={W - PAD.r} y={H - 4} textAnchor="end" className="sf-chart-axis">
          {AXES[x].label}
          {AXES[x].unit ? ` (${AXES[x].unit})` : ""} →
        </text>
        <text x={PAD.l} y={PAD.t - 2} className="sf-chart-axis">
          ↑ {AXES[y].label}
          {AXES[y].unit ? ` (${AXES[y].unit})` : ""}
        </text>

        {ordered.map((p) => {
          const on = inFilter.has(p.r.slug);
          return (
            <circle
              key={p.r.slug}
              cx={p.px}
              cy={p.py}
              r={on ? 3.2 : 2.2}
              fill={on ? "var(--foreground)" : "var(--line-strong)"}
              fillOpacity={on ? 0.55 : 0.6}
            />
          );
        })}

        {placed
          .filter((p) => compareSet.has(p.r.slug) || p.r.slug === bagSlug)
          .map((p) => (
            <circle
              key={`ring-${p.r.slug}`}
              cx={p.px}
              cy={p.py}
              r={6}
              fill="none"
              stroke={p.r.slug === bagSlug ? "var(--foreground)" : "var(--accent)"}
              strokeWidth={1.25}
              strokeDasharray={p.r.slug === bagSlug ? "2 2" : undefined}
            />
          ))}

        {focusPt ? (
          <g pointerEvents="none">
            <line x1={focusPt.px} x2={focusPt.px} y1={PAD.t} y2={H - PAD.b} stroke="var(--accent)" strokeOpacity={0.35} />
            <line x1={PAD.l} x2={W - PAD.r} y1={focusPt.py} y2={focusPt.py} stroke="var(--accent)" strokeOpacity={0.35} />
            <circle cx={focusPt.px} cy={focusPt.py} r={5} fill="var(--accent)" stroke="var(--panel)" strokeWidth={2} />
          </g>
        ) : null}
      </svg>

      {pts.length < rackets.length ? (
        <p className="mt-1 text-right text-[11px] text-[var(--muted)]">
          {rackets.length - pts.length} frames are not plotted because their{" "}
          {[x, y].filter((k) => rackets.some((r) => r[k] == null)).map((k) => AXES[k].label.toLowerCase()).join(" or ")} is not published.
        </p>
      ) : null}

      {focusPt ? (
        <div
          className="pointer-events-none absolute z-10 max-w-[14rem] rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--panel)] px-2.5 py-1.5 shadow-[var(--shadow-soft)]"
          style={{
            left: `${(focusPt.px / W) * 100}%`,
            top: `${(focusPt.py / H) * 100}%`,
            transform: `translate(${focusPt.px > W * 0.7 ? "calc(-100% - 10px)" : "10px"}, -50%)`,
          }}
        >
          <p className="truncate text-xs font-medium">
            {focusPt.r.brand} {focusPt.r.model}
          </p>
          <p className="font-[family-name:var(--font-mono)] text-[10.5px] tabular-nums text-[var(--muted)]">
            {AXES[x].label} {focusPt.xv} · {AXES[y].label} {focusPt.yv}
          </p>
        </div>
      ) : null}
    </div>
  );
}
