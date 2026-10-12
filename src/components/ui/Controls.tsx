"use client";

import { PLAYERS, STROKE_LABELS } from "@/data/players";
import { useCoachStore } from "@/store/coachStore";
import type { StrokeType } from "@/types/biomechanics";
import { PHASE_LABELS, phaseAt, sampleStroke, totalStrokeDurationMs } from "@/lib/kinematics";

const STROKES = Object.keys(STROKE_LABELS) as StrokeType[];

const CAMERA_LABELS: Record<
  "orbit" | "side" | "behind" | "front" | "firstPerson",
  string
> = {
  orbit: "Orbit",
  side: "Side",
  behind: "Behind",
  front: "Front (net)",
  firstPerson: "First-person",
};

export function PlayerStrokePicker() {
  const playerId = useCoachStore((s) => s.playerId);
  const stroke = useCoachStore((s) => s.stroke);
  const setPlayer = useCoachStore((s) => s.setPlayer);
  const setStroke = useCoachStore((s) => s.setStroke);
  const player = PLAYERS.find((p) => p.id === playerId) ?? PLAYERS[0];

  return (
    <div className="space-y-5">
      <div role="group" aria-labelledby="lab-athlete-label">
        <p id="lab-athlete-label" className="sf-spec-label mb-2">
          Athlete
        </p>
        <div className="sf-lab-athletes">
          {PLAYERS.map((p) => {
            const active = p.id === playerId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlayer(p.id)}
                aria-pressed={active}
                data-active={active}
                className="sf-lab-athlete"
              >
                <span className="block truncate text-[13px] font-medium leading-tight">{p.shortName}</span>
                <span className="sf-lab-athlete-meta">
                  {p.dominantHand === "left" ? "L" : "R"} · {p.backhandStyle === "oneHanded" ? "1H" : "2H"} ·{" "}
                  {p.spec.height.value.toFixed(2)} m
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div role="group" aria-labelledby="lab-stroke-label">
        <p id="lab-stroke-label" className="sf-spec-label mb-2">
          Stroke
        </p>
        <div className="sf-lab-seg" data-count={STROKES.length}>
          {STROKES.map((s) => {
            const active = s === stroke;
            const label = player.strokes[s]?.label ?? STROKE_LABELS[s];
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStroke(s)}
                aria-pressed={active}
                title={label}
                data-active={active ? "true" : "false"}
              >
                {STROKE_LABELS[s]}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-[var(--muted)]">
          <span className="text-[var(--foreground)]">{player.strokes[stroke]?.label ?? STROKE_LABELS[stroke]}</span>
          {" · "}
          {player.playingStyle}
        </p>
      </div>
    </div>
  );
}

export function PlaybackDock() {
  const t = useCoachStore((s) => s.t);
  const playing = useCoachStore((s) => s.playing);
  const setT = useCoachStore((s) => s.setT);
  const togglePlaying = useCoachStore((s) => s.togglePlaying);
  const setPlaying = useCoachStore((s) => s.setPlaying);
  const playerId = useCoachStore((s) => s.playerId);
  const strokeType = useCoachStore((s) => s.stroke);
  const player = PLAYERS.find((p) => p.id === playerId) ?? PLAYERS[0];
  const stroke = player.strokes[strokeType];
  const pose = sampleStroke(stroke, t);

  return (
    <div className="pointer-events-auto border-t border-[var(--line)] bg-[color-mix(in_srgb,var(--background)_88%,transparent)] px-3 py-2.5 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlaying}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius)] bg-[var(--ink)] text-[var(--ink-fg)]"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <rect x="2" y="2" width="3.5" height="10" rx="0.5" />
              <rect x="8.5" y="2" width="3.5" height="10" rx="0.5" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <path d="M3 2.5v9l9-4.5-9-4.5z" />
            </svg>
          )}
        </button>
        <label className="min-w-0 flex-1">
          <span className="sr-only">Scrub stroke phase</span>
          <div className="flex justify-between text-[11px] text-[var(--muted)]">
            <span>{PHASE_LABELS[pose.phase]}</span>
            <span>{Math.round(t * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={t}
            onChange={(e) => {
              setPlaying(false);
              setT(Number(e.target.value));
            }}
            className="mt-1 w-full accent-[var(--accent)]"
          />
        </label>
      </div>
    </div>
  );
}

const SPEEDS = [0.15, 0.35, 0.6, 1] as const;

export function PlaybackControls() {
  const t = useCoachStore((s) => s.t);
  const playing = useCoachStore((s) => s.playing);
  const speed = useCoachStore((s) => s.speed);
  const setT = useCoachStore((s) => s.setT);
  const togglePlaying = useCoachStore((s) => s.togglePlaying);
  const setSpeed = useCoachStore((s) => s.setSpeed);
  const setPlaying = useCoachStore((s) => s.setPlaying);
  const playerId = useCoachStore((s) => s.playerId);
  const strokeType = useCoachStore((s) => s.stroke);

  const player = PLAYERS.find((p) => p.id === playerId) ?? PLAYERS[0];
  const stroke = player.strokes[strokeType];
  const pose = sampleStroke(stroke, t);
  const current = phaseAt(stroke, t);
  const totalMs = totalStrokeDurationMs(stroke);

  const seek = (v: number) => {
    setPlaying(false);
    setT(v);
  };

  return (
    <div className="space-y-4" role="group" aria-labelledby="lab-playback-label">
      <div className="flex items-baseline justify-between gap-2">
        <p id="lab-playback-label" className="sf-spec-label">
          Playback
        </p>
        <p className="sf-readout text-[11px] text-[var(--muted)]">
          {Math.round(t * totalMs)} / {totalMs} ms
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlaying}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius)] bg-[var(--ink)] text-[var(--ink-fg)]"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden>
              <rect x="2" y="2" width="3.5" height="10" rx="0.5" />
              <rect x="8.5" y="2" width="3.5" height="10" rx="0.5" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden>
              <path d="M3 2.5v9l9-4.5-9-4.5z" />
            </svg>
          )}
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-tight">{PHASE_LABELS[pose.phase]}</p>
          <p className="sf-readout text-[11px] text-[var(--muted)]">{Math.round(t * 100)}% of the stroke</p>
        </div>
      </div>

      <div className="sf-scrubber">
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={t}
          onChange={(e) => seek(Number(e.target.value))}
          className="sf-scrubber-input"
          aria-label="Scrub stroke phase"
          aria-valuetext={`${PHASE_LABELS[pose.phase]}, ${Math.round(t * 100)}%`}
        />
        <div className="sf-scrubber-track" aria-hidden>
          <span className="sf-scrubber-fill" style={{ width: `${t * 100}%` }} />
          {stroke.keyframes.map((kf) => (
            <span key={`${kf.phase}-${kf.t}`} className="sf-scrubber-tick" style={{ left: `${kf.t * 100}%` }} />
          ))}
        </div>
      </div>

      <div className="sf-phase-list" role="group" aria-label="Jump to phase">
        {stroke.keyframes
          .filter((kf) => kf.phase !== "recovery")
          .map((kf) => {
            const active = kf.phase === current.phase;
            return (
              <button
                key={`${kf.phase}-${kf.t}`}
                type="button"
                onClick={() => seek(kf.t)}
                data-active={active ? "true" : "false"}
                className="sf-phase-btn"
              >
                {PHASE_LABELS[kf.phase]}
              </button>
            );
          })}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="sf-spec-label">Speed</p>
        <div className="sf-lab-seg sf-lab-seg-sm" data-count={SPEEDS.length}>
          {SPEEDS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setSpeed(v)}
              aria-pressed={speed === v}
              data-active={speed === v ? "true" : "false"}
            >
              {v === 1 ? "1×" : `${v}×`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ViewToggles() {
  const showAngles = useCoachStore((s) => s.showAngles);
  const showRacketPath = useCoachStore((s) => s.showRacketPath);
  const showGroundForce = useCoachStore((s) => s.showGroundForce);
  const cameraMode = useCoachStore((s) => s.cameraMode);
  const setShowAngles = useCoachStore((s) => s.setShowAngles);
  const setShowRacketPath = useCoachStore((s) => s.setShowRacketPath);
  const setShowGroundForce = useCoachStore((s) => s.setShowGroundForce);
  const setCameraMode = useCoachStore((s) => s.setCameraMode);

  const toggle = (
    label: string,
    on: boolean,
    set: (v: boolean) => void,
  ) => (
    <button
      type="button"
      onClick={() => set(!on)}
      aria-pressed={on}
      className="sf-chip"
      data-active={on ? "true" : "false"}
    >
      {label}
    </button>
  );

  return (
    <details className="space-y-3">
      <summary className="sf-spec-label cursor-pointer">
        View options
      </summary>
      <div className="mt-3 space-y-3">
      <p className="sf-label">Overlays</p>
      <div className="flex flex-wrap gap-2">
        {toggle("Joint angles", showAngles, setShowAngles)}
        {toggle("Racket path", showRacketPath, setShowRacketPath)}
        {toggle("Ground force", showGroundForce, setShowGroundForce)}
      </div>
      <p className="sf-label">Camera</p>
      <div className="flex flex-wrap gap-2">
        {(["orbit", "side", "behind", "front", "firstPerson"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setCameraMode(m)}
            aria-pressed={cameraMode === m}
            title={
              m === "orbit"
                ? "Free orbit, drag to rotate"
                : m === "side"
                  ? "Side-on coaching angle"
                  : m === "behind"
                    ? "Behind the athlete looking to the net"
                    : m === "front"
                      ? "From the net looking back at the athlete"
                      : "Over the hitting shoulder: map hand and face angle"
            }
            className="sf-chip"
            data-active={cameraMode === m ? "true" : "false"}
          >
            {CAMERA_LABELS[m]}
          </button>
        ))}
      </div>
      </div>
    </details>
  );
}
