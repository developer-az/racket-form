"use client";

import { useRef } from "react";
import { PLAYERS } from "@/data/players";
import { useCoachStore } from "@/store/coachStore";
import { useStudyStore } from "@/store/studyStore";

export function EmptyStudy() {
  const inputRef = useRef<HTMLInputElement>(null);
  const playerId = useCoachStore((s) => s.playerId);
  const strokeType = useCoachStore((s) => s.stroke);
  const player = PLAYERS.find((p) => p.id === playerId) ?? PLAYERS[0];
  const stroke = player.strokes[strokeType];
  const record = useStudyStore((s) => s.records[`${playerId}/${strokeType}`]);
  const status = useStudyStore((s) => s.status);
  const progress = useStudyStore((s) => s.progress);
  const detail = useStudyStore((s) => s.detail);
  const attachVideo = useStudyStore((s) => s.attachVideo);
  if (record && status !== "working") return null;

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center p-6">
      <div className="max-w-sm border border-[var(--line-strong)] bg-[color-mix(in_srgb,var(--background)_88%,transparent)] px-4 py-3 text-center backdrop-blur-sm">
        <p className="font-mono text-[10px] tracking-[0.14em] text-[var(--muted)] uppercase">
          {status === "working" ? "Reconstructing" : "No reconstructed swing"}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--foreground)]">
          {status === "working"
            ? detail || "Reading pose from the video…"
            : `Attach a study video for ${player.shortName} · ${strokeType}. Playback is the reconstructed skeleton — not a keyed mannequin.`}
        </p>
        {status === "working" ? (
          <div className="mx-auto mt-3 h-1 w-40 overflow-hidden bg-[var(--bg-sunken)]">
            <div className="h-full bg-[var(--accent)]" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
        ) : null}
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
        {status === "working" ? null : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="sf-btn sf-btn-primary mt-3"
          >
            Attach swing video
          </button>
        )}
      </div>
    </div>
  );
}
