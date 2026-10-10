"use client";

import { useRef } from "react";
import { PLAYERS } from "@/data/players";
import { useCoachStore } from "@/store/coachStore";
import { useStudyStore } from "@/store/studyStore";

export function VideoStudy() {
  const inputRef = useRef<HTMLInputElement>(null);
  const playerId = useCoachStore((s) => s.playerId);
  const strokeType = useCoachStore((s) => s.stroke);
  const player = PLAYERS.find((p) => p.id === playerId) ?? PLAYERS[0];
  const stroke = player.strokes[strokeType];
  const record = useStudyStore((s) => s.records[`${playerId}/${strokeType}`]);
  const lastKey = useStudyStore((s) => s.lastKey);
  const last = useStudyStore((s) => (s.lastKey ? s.records[s.lastKey] : undefined));
  const status = useStudyStore((s) => s.status);
  const progress = useStudyStore((s) => s.progress);
  const detail = useStudyStore((s) => s.detail);
  const error = useStudyStore((s) => s.error);
  const attachVideo = useStudyStore((s) => s.attachVideo);
  const applyLastTo = useStudyStore((s) => s.applyLastTo);
  const clearCurrent = useStudyStore((s) => s.clearCurrent);
  const busy = status === "working";
  const canApply =
    !!last && last.stroke === strokeType && last.key !== `${playerId}/${strokeType}`;

  return (
    <div className="sf-panel space-y-3 p-3">
      <p className="font-mono text-[10px] tracking-[0.14em] text-[var(--muted)] uppercase">
        Study video
      </p>
      <p className="text-xs leading-relaxed text-[var(--muted)]">
        {record?.kind === "seed"
          ? `CC study reconstruction on ${player.shortName}’s armature — ${stroke.label.toLowerCase()}. Replace it with your video.`
          : `Upload a swing. On-device BlazePose rebuilds it onto ${player.shortName}’s armature — ${stroke.label.toLowerCase()}.`}
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/*"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          void attachVideo({
            file,
            playerId,
            stroke: strokeType,
            handedness: stroke.handedness,
            oneHanded: stroke.oneHanded,
          });
        }}
      />

      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="sf-btn sf-btn-primary w-full disabled:opacity-50"
      >
        {busy ? "Reconstructing…" : record?.kind === "upload" ? "Replace video" : "Attach swing video"}
      </button>

      {canApply ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => applyLastTo(playerId)}
          className="sf-btn sf-btn-secondary w-full disabled:opacity-50"
        >
          Retarget last swing onto {player.shortName}
        </button>
      ) : null}

      {busy ? (
        <div>
          <div className="h-1 overflow-hidden bg-[var(--bg-sunken)]">
            <div
              className="h-full bg-[var(--accent)] transition-[width] duration-200"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <p className="mt-1 font-mono text-[10px] text-[var(--muted)]">{detail}</p>
        </div>
      ) : null}

      {error ? <p className="text-xs text-[var(--danger)]">{error}</p> : null}

      {record && !busy ? (
        <div className="space-y-1 border-t border-[var(--line)] pt-2">
          <p className="truncate text-xs text-[var(--foreground)]">{record.sourceName}</p>
          <p className="font-mono text-[10px] tracking-[0.08em] text-[var(--muted)] uppercase">
            {record.kind === "seed" ? "CC study · " : ""}
            {record.frameCount} frames · vis {(record.meanVisibility * 100).toFixed(0)}% ·{" "}
            {record.hittingSide} hit
          </p>
          {record.kind === "upload" ? (
            <button
              type="button"
              onClick={() => clearCurrent(playerId, strokeType)}
              className="text-[11px] text-[var(--muted)] underline-offset-2 hover:text-[var(--foreground)] hover:underline"
            >
              Detach to CC study clip
            </button>
          ) : null}
        </div>
      ) : null}

      {lastKey && !record && !busy ? (
        <p className="text-[11px] text-[var(--muted)]">
          Last reconstruction stays on its athlete until you retarget or upload here.
        </p>
      ) : null}
    </div>
  );
}
