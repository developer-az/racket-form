"use client";

import { PLAYERS } from "@/data/players";
import { PHASE_LABELS, sampleStroke } from "@/lib/kinematics";
import { useCoachStore } from "@/store/coachStore";
import { useStudyStore } from "@/store/studyStore";

/** Phase marks from the reconstructed clip — not authored stills. */
export function LabReferencePlate() {
  const playerId = useCoachStore((s) => s.playerId);
  const strokeType = useCoachStore((s) => s.stroke);
  const t = useCoachStore((s) => s.t);
  const player = PLAYERS.find((p) => p.id === playerId) ?? PLAYERS[0];
  const stroke = player.strokes[strokeType];
  const record = useStudyStore((s) => s.records[`${playerId}/${strokeType}`]);
  const live = sampleStroke(stroke, t);
  const marks = record?.clip.phases ?? stroke.keyframes.map((k) => ({ phase: k.phase, t: k.t }));

  return (
    <div className="sf-panel p-3">
      <p className="font-mono text-[10px] tracking-[0.14em] text-[var(--muted)] uppercase">
        Phase rail
      </p>
      <p className="mt-1 text-xs text-[var(--muted)]">
        {record
          ? `${record.sourceName} · ${player.shortName} ${stroke.type}`
          : "Phase marks from the reconstructed swing"}
      </p>
      <div className="mt-3 grid grid-cols-4 gap-1.5">
        {marks.slice(0, 4).map((p) => {
          const active = live.phase === p.phase;
          return (
            <div
              key={`${p.phase}-${p.t}`}
              className="border border-[var(--line)] p-2"
              style={{
                boxShadow: active ? "inset 0 0 0 1px var(--accent)" : undefined,
              }}
            >
              <p className="font-mono text-[9px] tracking-[0.08em] text-[var(--muted)] uppercase">
                {PHASE_LABELS[p.phase] ?? p.phase}
              </p>
              <p className="text-[10px] text-[var(--foreground)]">{(p.t * 100).toFixed(0)}%</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
