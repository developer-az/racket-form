"use client";

import type { Distribution } from "@/lib/equipment/catalogStats";

/**
 * Dual-thumb range over a catalog distribution. The histogram shows where
 * frames actually are, so a range is chosen against real supply, not guesses.
 */
export function RangeFilter({
  label,
  unit,
  dist,
  value,
  step = 1,
  onChange,
  format = (v) => String(Math.round(v)),
}: {
  label: string;
  unit?: string;
  dist: Distribution;
  value: [number, number];
  step?: number;
  onChange: (next: [number, number]) => void;
  format?: (v: number) => string;
}) {
  const [lo, hi] = value;
  const { min, max, bins, binWidth } = dist;
  const span = Math.max(1e-9, max - min);
  const peak = Math.max(1, ...bins);
  const active = lo > min || hi < max;
  const pct = (v: number) => ((v - min) / span) * 100;

  return (
    <div className="sf-range" data-active={active}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-medium text-[var(--foreground)]">{label}</span>
        <span className="font-[family-name:var(--font-mono)] text-[11px] tabular-nums text-[var(--muted)]">
          {format(lo)}–{format(hi)}
          {unit ? ` ${unit}` : ""}
        </span>
      </div>
      <div className="relative mt-2 h-7" aria-hidden>
        <div className="absolute inset-x-0 bottom-0 flex h-full items-end gap-px">
          {bins.map((n, i) => {
            const b0 = min + i * binWidth;
            const b1 = b0 + binWidth;
            const inside = b1 > lo && b0 < hi;
            return (
              <span
                key={i}
                className="flex-1"
                style={{
                  height: `${Math.max(n > 0 ? 8 : 0, (n / peak) * 100)}%`,
                  background: inside ? "var(--foreground)" : "var(--line-strong)",
                  opacity: inside ? (active ? 0.75 : 0.32) : 0.5,
                }}
              />
            );
          })}
        </div>
      </div>
      <div className="sf-range-track relative h-5">
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[var(--line-strong)]" />
        <div
          className="absolute top-1/2 h-[2px] -translate-y-1/2 bg-[var(--foreground)]"
          style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={lo}
          aria-label={`${label} minimum`}
          onChange={(e) => onChange([Math.min(Number(e.target.value), hi), hi])}
          className="sf-range-input"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={hi}
          aria-label={`${label} maximum`}
          onChange={(e) => onChange([lo, Math.max(Number(e.target.value), lo)])}
          className="sf-range-input"
        />
      </div>
    </div>
  );
}
