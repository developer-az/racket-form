"use client";

import { useEffect } from "react";
import type { RacketProfile } from "@/types/equipment";
import { RacketImg } from "./RacketImg";
import { computeFrameSpecPhysics, parseExpertScores } from "@/lib/equipment/playability";
import { formatBalance } from "@/lib/equipment/catalogStats";

type Row = {
  label: string;
  get: (r: RacketProfile) => number | null;
  fmt?: (v: number, r: RacketProfile) => string;
  /** Which end is notable; null = no "best" (trade-off spec) */
  best?: "high" | "low" | null;
  group: "Specs" | "Character";
};

const ROWS: Row[] = [
  { group: "Specs", label: "Weight", get: (r) => r.weightG, fmt: (v) => `${v} g` },
  { group: "Specs", label: "Swingweight", get: (r) => r.swingweight },
  { group: "Specs", label: "Stiffness", get: (r) => r.stiffnessRa, fmt: (v) => `${v} RA` },
  { group: "Specs", label: "Balance", get: (r) => r.balanceMm, fmt: (_v, r) => formatBalance(r.balanceMm) },
  { group: "Specs", label: "Head size", get: (r) => r.headSizeSqIn, fmt: (v) => `${v} in²` },
  { group: "Character", label: "Power", get: (r) => r.power, best: "high" },
  { group: "Character", label: "Spin", get: (r) => r.spin, best: "high" },
  { group: "Character", label: "Control", get: (r) => r.control, best: "high" },
  { group: "Character", label: "Comfort", get: (r) => r.comfort, best: "high" },
  { group: "Character", label: "Stability", get: (r) => computeFrameSpecPhysics(r, parseExpertScores(r.summary)).plow, best: "high" },
  { group: "Character", label: "Maneuverability", get: (r) => computeFrameSpecPhysics(r, parseExpertScores(r.summary)).whip, best: "high" },
  { group: "Character", label: "Arm shock", get: (r) => computeFrameSpecPhysics(r, parseExpertScores(r.summary)).armLoad, best: "low" },
];

export function CompareSheet({
  rackets,
  bagSlug,
  onClose,
  onRemove,
  onSave,
}: {
  rackets: RacketProfile[];
  bagSlug: string | null;
  onClose: () => void;
  onRemove: (slug: string) => void;
  onSave: (r: RacketProfile) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const groups = ["Specs", "Character"] as const;

  return (
    <div className="sf-sheet-root" role="dialog" aria-modal="true" aria-label="Compare frames">
      <button type="button" className="sf-sheet-scrim" aria-label="Close compare" onClick={onClose} />
      <div className="sf-sheet sf-sheet-wide !max-w-5xl">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-3">
          <p className="text-[15px] font-semibold tracking-[-0.01em]">Compare {rackets.length} frames</p>
          <button type="button" onClick={onClose} className="sf-btn sf-btn-ghost !min-h-9 text-[13px]">
            Close
          </button>
        </div>
        <div className="overflow-auto">
          <table className="w-full min-w-[36rem] border-collapse text-[13px]">
            <thead>
              <tr>
                <th className="sticky left-0 z-[1] w-36 bg-[var(--panel)]" />
                {rackets.map((r) => (
                  <th key={r.slug} className="border-l border-[var(--line)] px-4 pt-4 pb-3 text-left align-bottom font-normal">
                    <div className="sf-thumb-well mb-3 flex h-24 items-center justify-center rounded-[var(--radius)]">
                      <RacketImg racket={r} className="h-20 object-contain" />
                    </div>
                    <p className="sf-spec-label">{r.brand} · {r.year}</p>
                    <p className="mt-0.5 text-[14px] leading-snug font-semibold">{r.model}</p>
                    <div className="mt-2 flex gap-3 text-[12px]">
                      <button type="button" className="sf-text-link !text-[12px]" onClick={() => onSave(r)}>
                        {r.slug === bagSlug ? "In your bag" : "Add to bag"}
                      </button>
                      <button type="button" className="text-[var(--muted)] hover:text-[var(--foreground)]" onClick={() => onRemove(r.slug)}>
                        Remove
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            {groups.map((g) => (
              <tbody key={g}>
                <tr>
                  <td colSpan={rackets.length + 1} className="sf-spec-label border-t border-[var(--line)] bg-[var(--bg-sunken)] px-4 py-2">
                    {g}
                  </td>
                </tr>
                {ROWS.filter((row) => row.group === g).map((row) => {
                  const vals = rackets.map((r) => row.get(r));
                  const nums = vals.filter((v): v is number => v != null);
                  const spread = nums.length > 1 ? Math.max(...nums) - Math.min(...nums) : 0;
                  const target =
                    row.best === "high" ? Math.max(...nums) : row.best === "low" ? Math.min(...nums) : null;
                  return (
                    <tr key={row.label} className="border-t border-[var(--line)]">
                      <td className="sticky left-0 z-[1] bg-[var(--panel)] px-4 py-2.5 text-[var(--muted)]">{row.label}</td>
                      {rackets.map((r, i) => {
                        const v = vals[i];
                        const lead = target != null && v === target && spread > 0;
                        return (
                          <td key={r.slug} className="border-l border-[var(--line)] px-4 py-2.5">
                            {v == null ? (
                              <span className="text-[var(--muted)]">—</span>
                            ) : row.group === "Character" ? (
                              <div className="flex items-center gap-3">
                                <span className={`sf-readout w-7 ${lead ? "text-[var(--accent)]" : ""}`}>{Math.round(v)}</span>
                                <span className="h-[3px] flex-1 bg-[var(--line)]">
                                  <span
                                    className="block h-full"
                                    style={{ width: `${v}%`, background: lead ? "var(--accent)" : "var(--foreground)", opacity: lead ? 1 : 0.55 }}
                                  />
                                </span>
                              </div>
                            ) : (
                              <span className="sf-readout">{row.fmt ? row.fmt(v, r) : v}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            ))}
          </table>
        </div>
        <p className="border-t border-[var(--line)] px-5 py-3 text-[11.5px] text-[var(--muted)]">
          Blue marks the leader in each row. Specs carry no leader because more is not better; they are trade-offs.
        </p>
      </div>
    </div>
  );
}
