"use client";

import Link from "next/link";
import type { InBandPlan, LeverFamily, ScoreHeadroom, ScoreKey } from "@/lib/equipment/inBandImprove";

const KEYS: ScoreKey[] = ["power", "spin", "control", "comfort"];

const SCORE_LABEL: Record<ScoreKey, string> = {
  power: "Power",
  spin: "Spin",
  control: "Control",
  comfort: "Comfort",
};

const FAMILY_LABEL: Record<LeverFamily, string> = {
  tension: "Tension",
  gauge: "Gauge",
  "tape-12": "Tape 12",
  "tape-39": "Tape 3 & 9",
  "tape-handle": "Tape handle",
  "tape-throat": "Tape throat",
};

function fmtDelta(n: number): string {
  const r = Math.round(n * 10) / 10;
  if (Math.abs(r) < 0.05) return "0";
  return `${r > 0 ? "+" : ""}${r}`;
}

function status(s: ScoreHeadroom): string {
  if (s.verdict === "unknown") return "not modelled";
  if (s.verdict === "low") return `below ${s.band.low}–${s.band.high}`;
  if (s.verdict === "high") return `above ${s.band.low}–${s.band.high}`;
  return `in range ${s.band.low}–${s.band.high}`;
}

function leverHref(family: LeverFamily): string {
  if (family === "tension" || family === "gauge") return "/gear?tab=strings";
  return "/gear?tab=lead-tape";
}

/**
 * Single-change tuning options per score. Each row is one change, modelled on the
 * whole setup; it is only listed if no score that is already in range leaves it.
 */
export function InBandImproveSection({
  plan,
  compact = false,
}: {
  plan: InBandPlan;
  compact?: boolean;
}) {
  const modeled = plan.scores.filter((s) => s.current != null);
  const perScore = compact ? 1 : 2;

  return (
    <section className="sf-panel overflow-hidden">
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 pt-5 pb-3">
        <div>
          <h2 className="text-[15px] font-semibold tracking-[-0.01em]">Tuning options</h2>
          <p className="mt-0.5 text-[12.5px] text-[var(--muted)]">
            One change at a time, modelled on your whole setup. Nothing listed pushes another score out of range.
          </p>
        </div>
      </div>

      {modeled.length === 0 ? (
        <p className="px-5 pb-5 text-[13px] text-[var(--muted)]">Add a frame and a string to see tuning options.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-[13px]">
            <thead>
              <tr className="sf-spec-label border-y border-[var(--line)] bg-[var(--bg-sunken)] text-left">
                <th className="px-5 py-2 font-normal">Change</th>
                {KEYS.map((k) => (
                  <th key={k} className="w-[4.5rem] px-2 py-2 text-right font-normal">
                    {SCORE_LABEL[k]}
                  </th>
                ))}
                <th className="w-16 px-2 py-2 text-right font-normal">SW</th>
                <th className="w-20 py-2 pr-5" />
              </tr>
            </thead>
            {plan.scores.map((s) => (
              <tbody key={s.key}>
                <tr className="border-b border-[var(--line)]">
                  <td colSpan={7} className="px-5 pt-3 pb-1.5">
                    <span className="font-medium">Raise {SCORE_LABEL[s.key].toLowerCase()}</span>
                    <span className="ml-2 text-[12px] text-[var(--muted)]">
                      now <span className="sf-readout text-[var(--foreground)]">{s.current ?? "—"}</span>, {status(s)}
                    </span>
                  </td>
                </tr>
                {s.levers.length === 0 ? (
                  <tr className="border-b border-[var(--line)]">
                    <td colSpan={7} className="px-5 py-2 text-[12.5px] text-[var(--muted)]">
                      {s.holdNote ?? "No single change raises this without pushing another score out of range."}
                    </td>
                  </tr>
                ) : (
                  s.levers.slice(0, perScore).map((lev) => (
                    <tr key={lev.id} className="border-b border-[var(--line)] hover:bg-[var(--overlay-hover)]" title={lev.science}>
                      <td className="px-5 py-2">
                        <span className="block">{lev.action}</span>
                        <span className="text-[11.5px] text-[var(--muted)]">{FAMILY_LABEL[lev.family]}</span>
                      </td>
                      {KEYS.map((k) => {
                        const d = lev.deltas[k];
                        const target = k === s.key;
                        const muted = Math.abs(d) < 0.15;
                        return (
                          <td
                            key={k}
                            className={`sf-readout px-2 py-2 text-right ${target ? "font-semibold text-[var(--accent)]" : muted ? "text-[var(--muted)]" : ""}`}
                          >
                            {fmtDelta(d)}
                          </td>
                        );
                      })}
                      <td className="sf-readout px-2 py-2 text-right text-[var(--muted)]">{fmtDelta(lev.dSw)}</td>
                      <td className="py-2 pr-5 text-right">
                        <Link href={leverHref(lev.family)} className="sf-text-link text-[12px]">
                          {lev.family.startsWith("tape") ? "Tape lab" : "Strings"}
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            ))}
          </table>
        </div>
      )}
    </section>
  );
}
