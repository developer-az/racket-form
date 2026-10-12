"use client";

import { useMemo } from "react";
import { PLAYERS } from "@/data/players";
import { PHASE_LABELS, phaseAt } from "@/lib/kinematics";
import { useCoachStore } from "@/store/coachStore";

/** Coach-voice overlay for the Form Lab viewport: phase, cue and the quirk visible right now. */
export function LabPhaseOverlay() {
  const playerId = useCoachStore((s) => s.playerId);
  const strokeType = useCoachStore((s) => s.stroke);
  const t = useCoachStore((s) => s.t);

  const { phase, quirk, athlete, live } = useMemo(() => {
    const player = PLAYERS.find((p) => p.id === playerId) ?? PLAYERS[0];
    const stroke = player.strokes[strokeType];
    const kf = phaseAt(stroke, t);
    // Prefer the quirk you can see in this phase; fall back to the stroke's first
    const quirks = stroke.quirks ?? [];
    const now = quirks.find((q) => q.phase === kf.phase);
    return {
      athlete: player.shortName,
      phase: kf,
      quirk: (now ?? quirks[0])?.text ?? stroke.metrics.consistency.signatureQuirk,
      live: Boolean(now),
    };
  }, [playerId, strokeType, t]);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 p-3 md:p-5">
      <div className="sf-lab-overlay max-w-md !p-3 md:!p-4">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="sf-kicker !text-[10px]">{athlete}</p>
          <p className="font-[family-name:var(--font-display)] text-sm font-semibold tracking-tight">
            {PHASE_LABELS[phase.phase]}
          </p>
        </div>
        <p className="mt-1.5 text-sm leading-snug text-[var(--foreground)]/90">{phase.coachingCue}</p>
        <p className="mt-2 hidden border-t border-[var(--line)] pt-2.5 text-[11px] leading-relaxed text-[var(--muted)] sm:block">
          <span className="font-semibold text-[var(--accent)]">{live ? "Watch now · " : "Signature · "}</span>
          {quirk}
        </p>
      </div>
    </div>
  );
}
