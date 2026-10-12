"use client";

import type { SetupPlayability } from "@/lib/equipment/playability";
import { courtReadyLabel, courtReadyTone } from "@/lib/equipment/playability";

export function CourtReadyVerdict({
  playability,
  compact = false,
}: {
  playability: SetupPlayability;
  compact?: boolean;
}) {
  const tone = courtReadyTone(playability.band);
  const label = courtReadyLabel(playability.band);

  return (
    <section className="sf-panel p-5 md:p-6" aria-label="Court-ready verdict">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className={`font-semibold tracking-[-0.015em] ${compact ? "text-[15px]" : "text-[17px]"}`}>
            <span className="mr-2 inline-block h-2 w-2 rounded-full align-middle" style={{ background: tone }} aria-hidden />
            {label}
          </h3>
          <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-[var(--muted)]">{playability.headline}</p>
        </div>
        <p className="shrink-0">
          <span className="sf-readout text-[1.5rem]">{playability.score}</span>
          <span className="ml-1 text-[12px] text-[var(--muted)]">/100 court-ready</span>
        </p>
      </div>

      {playability.flags.length > 0 ? (
        <ul className={`mt-4 divide-y divide-[var(--line)] border-y border-[var(--line)] ${compact ? "" : ""}`}>
          {playability.flags.map((f) => {
            const flagTone =
              f.severity === "stop" ? "var(--danger)" : f.severity === "caution" ? "var(--amber)" : "var(--accent)";
            return (
              <li key={f.id} className="grid grid-cols-[5.5rem_1fr] gap-3 py-2.5">
                <span className="sf-spec-label pt-0.5" style={{ color: flagTone }}>
                  {f.severity === "ok" ? "In range" : f.severity === "stop" ? "Stop" : "Caution"}
                </span>
                <span>
                  <span className="block text-[13.5px] font-medium">{f.title}</span>
                  <span className="block text-[12.5px] leading-relaxed text-[var(--muted)]">{f.why}</span>
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}

      {playability.missing.length > 0 ? (
        <p className="mt-3 text-[12.5px] text-[var(--muted)]">
          Add a {playability.missing.join(" and ")} for the full calculation.
        </p>
      ) : null}

      {!compact ? (
        <details className="group mt-3">
          <summary className="cursor-pointer list-none text-[12.5px] text-[var(--muted)] hover:text-[var(--foreground)] [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">Show the reasoning</span>
            <span className="hidden group-open:inline">Hide the reasoning</span>
          </summary>
          <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-[var(--foreground)]/85">{playability.howItHits}</p>
          {playability.specLine ? (
            <p className="mt-2 font-[family-name:var(--font-mono)] text-[11px] text-[var(--muted)]">{playability.specLine}</p>
          ) : null}
        </details>
      ) : null}
    </section>
  );
}
