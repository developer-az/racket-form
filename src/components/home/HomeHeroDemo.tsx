"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect } from "react";
import { PLAYERS } from "@/data/players";
import { PHASE_LABELS, sampleStroke } from "@/lib/kinematics";
import { measureStroke } from "@/lib/motion/solver";
import { useCoachStore } from "@/store/coachStore";
import { HomeHeroCtas } from "@/components/home/HomeHeroCtas";

const FormCanvas = dynamic(
  () => import("@/components/scene/FormCanvas").then((m) => m.FormCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="sf-hero-canvas-skeleton absolute inset-0" aria-hidden>
        <div className="sf-hero-canvas-skeleton-pulse" />
      </div>
    ),
  },
);

function HeroDemoChrome() {
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
  const angles = measureStroke(stroke, player.anthropometrics, t);

  return (
    <div className="sf-hero-demo-chrome pointer-events-auto">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="font-[family-name:var(--font-display)] text-sm font-semibold tracking-tight md:text-base">
            {player.shortName} · {PHASE_LABELS[pose.phase]}
          </p>
          <p className="mt-0.5 max-w-md truncate text-xs text-[var(--muted)] md:text-[13px]">
            {pose.coachingCue}
          </p>
        </div>
        <div className="flex gap-4 tabular-nums">
          <JointReadout label="Elbow" value={Math.round(angles.elbowFlexion)} />
          <JointReadout label="Knee" value={Math.round(angles.frontKneeFlexion)} />
          <JointReadout label="Turn" value={Math.round(Math.abs(angles.trunkRotation))} />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlaying}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius)] bg-[var(--ink)] text-[var(--ink-fg)] transition hover:opacity-85"
          aria-label={playing ? "Pause stroke" : "Play stroke"}
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
        <label className="min-w-0 flex-1">
          <span className="sr-only">Scrub stroke phase</span>
          <div className="relative">
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
              className="sf-hero-scrub w-full"
              aria-valuetext={PHASE_LABELS[pose.phase]}
            />
            <div className="pointer-events-none absolute inset-x-0 top-1/2 h-0 -translate-y-1/2" aria-hidden>
              {stroke.keyframes.map((kf) => (
                <span
                  key={`${kf.phase}-${kf.t}`}
                  className="absolute h-2 w-px -translate-x-1/2 bg-[var(--line-strong)]"
                  style={{ left: `${kf.t * 100}%` }}
                />
              ))}
            </div>
          </div>
        </label>
        <Link
          href="/lab"
          className="hidden shrink-0 font-[family-name:var(--font-mono)] text-[11px] tracking-[0.1em] text-[var(--foreground)] uppercase transition hover:text-[var(--accent)] sm:inline"
        >
          Full lab →
        </Link>
      </div>
    </div>
  );
}

function JointReadout({
  label,
  value,
  unit = "°",
}: {
  label: string;
  value: number;
  unit?: string;
}) {
  return (
    <div className="text-right">
      <p className="sf-spec-label">{label}</p>
      <p className="sf-readout mt-1 text-lg leading-none md:text-xl">
        {value}
        <span className="ml-0.5 text-xs text-[var(--muted)]">{unit}</span>
      </p>
    </div>
  );
}

/** Full-bleed Form Lab demo — prowess first, personalization later. */
export function HomeHeroDemo() {
  useEffect(() => {
    const store = useCoachStore.getState();
    store.setPlaying(true);
    store.setShowAngles(true);
    store.setShowRacketPath(true);
    store.setCameraMode("orbit");
    if (store.speed < 0.25) store.setSpeed(0.35);
  }, []);

  return (
    <section className="sf-hero-stage relative isolate min-h-[calc(100dvh-var(--header-h))] overflow-hidden">
      <div className="absolute inset-0 bg-[var(--bg-scene)]">
        <div className="sf-hero-demo-canvas absolute inset-0">
          <FormCanvas variant="hero" />
        </div>
      </div>

      <div className="sf-hero-stage-wash pointer-events-none absolute inset-0" aria-hidden />
      <div className="sf-hero-stage-grain pointer-events-none absolute inset-0" aria-hidden />

      <div className="pointer-events-none relative z-10 mx-auto flex min-h-[calc(100dvh-var(--header-h))] w-full max-w-[var(--page-max-wide)] flex-col justify-between px-6 pb-[7.5rem] pt-10 md:px-10 md:pb-36 md:pt-14 lg:px-14">
        <div className="pointer-events-auto max-w-xl sf-rise">
          <p className="sf-kicker">Racket Form · Form lab and gear fitting</p>
          <h1 className="mt-6 text-[clamp(2.1rem,3.9vw,3.5rem)] leading-[1.04] font-semibold tracking-[-0.045em] text-[var(--foreground)]">
            See how the pros hit.
            <br />
            <span className="text-[var(--muted)]">Then find gear that fits how you do.</span>
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-[var(--muted)] md:text-base">
            Every stroke is solved from real biomechanics, measured on the figure you see, and
            scrubbable to the frame.
          </p>
          <form action="/gear" method="get" role="search" className="mt-7 flex max-w-md items-center gap-2">
            <input type="hidden" name="tab" value="rackets" />
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Search the racket database</span>
              <svg className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--muted)]" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                name="q"
                placeholder="Search 675 rackets"
                className="sf-input !min-h-11 !pl-9 !text-[14px]"
              />
            </label>
            <button type="submit" className="sf-btn sf-btn-secondary !min-h-11 !px-4">
              Search
            </button>
          </form>
          <HomeHeroCtas />
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20 px-4 pb-4 md:px-10 md:pb-6 lg:px-14">
        <div className="mx-auto max-w-[var(--page-max-wide)]">
          <HeroDemoChrome />
        </div>
      </div>
    </section>
  );
}
