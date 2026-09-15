"use client";

import { useMemo, useState } from "react";
import type { ShotStrategyCard } from "@/types/pickleball";
import { ScoreMeter } from "@/components/gear/ScoreMeter";
import { ShotDiagram } from "./PickleDiagrams";

export function ShotStrategyPanel({ strategies }: { strategies: ShotStrategyCard[] }) {
  const [selectedId, setSelectedId] = useState(strategies[0]?.id ?? "");
  const [compareId, setCompareId] = useState(strategies[1]?.id ?? strategies[0]?.id ?? "");

  const selected = strategies.find((s) => s.id === selectedId) ?? strategies[0];
  const compare = strategies.find((s) => s.id === compareId) ?? strategies[1] ?? strategies[0];

  const selectShot = (id: string) => {
    setSelectedId(id);
    if (id === compareId) {
      const other = strategies.find((s) => s.id !== id);
      if (other) setCompareId(other.id);
    }
  };

  const deltas = useMemo(() => {
    if (!selected || !compare) return null;
    return [
      {
        label: "Patience",
        a: selected.patience,
        b: compare.patience,
        accent: "var(--chart-control)",
      },
      { label: "Pace", a: selected.pace, b: compare.pace, accent: "var(--chart-power)" },
      {
        label: "Placement",
        a: selected.placement,
        b: compare.placement,
        accent: "var(--sky)",
      },
      { label: "Risk", a: selected.risk, b: compare.risk, accent: "var(--danger)" },
      {
        label: "Partner need",
        a: selected.partnerDependence,
        b: compare.partnerDependence,
        accent: "var(--amber)",
      },
    ];
  }, [selected, compare]);

  return (
    <div className="space-y-6">
      <header className="border-b border-[var(--line)] pb-5">
        <p className="sf-kicker sf-kicker-muted">Smart game</p>
        <h2 className="sf-section-title mt-1">Shot decisions that win</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
          Serve returns, dink patterns, drops, drives, resets, speed-ups, feet/hips targeting, and
          Erne / around-the-post awareness — when to hit smart, not just hard.
        </p>
      </header>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {strategies.map((shot) => {
          const on = shot.id === selected?.id;
          return (
            <button
              key={shot.id}
              type="button"
              onClick={() => selectShot(shot.id)}
              aria-pressed={on}
              data-active={on ? "true" : "false"}
              className={`sf-panel p-4 text-left transition hover:bg-[var(--overlay-hover)] ${
                on ? "ring-1 ring-[var(--line-strong)]" : ""
              }`}
            >
              <p className="font-[family-name:var(--font-display)] text-base tracking-tight">
                {shot.title}
              </p>
              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[var(--muted)]">
                {shot.when}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] tabular-nums text-[var(--muted)]">
                <span>
                  Pace <span className="text-[var(--foreground)]">{shot.pace}</span>
                </span>
                <span>
                  Place <span className="text-[var(--foreground)]">{shot.placement}</span>
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {selected ? (
        <section className="sf-panel grid gap-6 p-4 md:grid-cols-[1.2fr_0.8fr] md:p-6">
          <div className="space-y-4">
            <div>
              <p className="sf-kicker sf-kicker-muted">When</p>
              <h3 className="mt-1 font-[family-name:var(--font-display)] text-xl tracking-tight">
                {selected.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--foreground)]/90">
                {selected.when}
              </p>
            </div>
            <div>
              <p className="sf-kicker sf-kicker-muted">How</p>
              <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-[var(--muted)]">
                {selected.how.map((step) => (
                  <li key={step}>
                    <span className="text-[var(--foreground)]/90">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg-sunken)] p-3">
              <p className="text-[10px] font-bold tracking-[0.12em] text-[var(--danger)] uppercase">
                Avoid
              </p>
              <p className="mt-1 text-sm text-[var(--foreground)]/90">{selected.avoid}</p>
            </div>
            {selected.diagram ? (
              <div className="sf-viz-stage">
                <ShotDiagram kind={selected.diagram} />
              </div>
            ) : null}
          </div>

          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <ScoreMeter label="Pace" value={selected.pace} accent="var(--chart-power)" />
              <ScoreMeter label="Placement" value={selected.placement} accent="var(--sky)" />
              <ScoreMeter label="Patience" value={selected.patience} accent="var(--chart-control)" />
              <ScoreMeter label="Risk" value={selected.risk} accent="var(--danger)" />
            </div>
            <div>
              <p className="mb-2 text-[0.8125rem] font-medium text-[var(--label)]">Compare with</p>
              <select
                className="sf-input"
                value={compare?.id ?? ""}
                onChange={(e) => setCompareId(e.target.value)}
                aria-label="Compare shot"
              >
                {strategies.map((s) => (
                  <option key={s.id} value={s.id} disabled={s.id === selected.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
            {deltas && compare ? (
              <div className="space-y-4 rounded-[var(--radius)] bg-[var(--bg-sunken)] p-4">
                <p className="text-xs text-[var(--muted)]">
                  <span className="font-semibold text-[var(--foreground)]">{selected.title}</span>
                  {" vs "}
                  <span className="font-semibold text-[var(--foreground)]">{compare.title}</span>
                </p>
                {deltas.map((row) => (
                  <div key={row.label} className="space-y-2">
                    <ScoreMeter
                      label={`${row.label} · ${selected.title}`}
                      value={row.a}
                      accent={row.accent}
                    />
                    <ScoreMeter
                      label={`${row.label} · ${compare.title}`}
                      value={row.b}
                      accent={row.accent}
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
