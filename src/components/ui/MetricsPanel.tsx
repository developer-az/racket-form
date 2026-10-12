"use client";

import { useMemo } from "react";
import Link from "next/link";
import { PLAYERS } from "@/data/players";
import { useCoachStore } from "@/store/coachStore";
import { setupSummary, useGearStore } from "@/store/gearStore";
import { synthesizeCombinedSetup } from "@/lib/equipment/setupSynthesis";
import { sampleStroke } from "@/lib/kinematics";
import { measureStroke } from "@/lib/motion/solver";

function Readout({
  label,
  value,
  unit,
  hint,
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
}) {
  return (
    <div className="sf-readout-cell">
      <p className="sf-spec-label">{label}</p>
      <p className="mt-1 sf-readout text-[1.3rem] leading-none">
        {value}
        {unit ? (
          <span className={`${unit === "°" ? "ml-0.5" : "ml-1"} font-sans text-xs font-normal text-[var(--muted)]`}>
            {unit}
          </span>
        ) : null}
      </p>
      {hint ? <p className="mt-1 text-[11px] leading-snug text-[var(--muted)]">{hint}</p> : null}
    </div>
  );
}

const nf = new Intl.NumberFormat("en-US");

export function MetricsPanel() {
  const playerId = useCoachStore((s) => s.playerId);
  const strokeType = useCoachStore((s) => s.stroke);
  const t = useCoachStore((s) => s.t);

  const player = PLAYERS.find((p) => p.id === playerId) ?? PLAYERS[0];
  const stroke = player.strokes[strokeType];
  const m = stroke.metrics;
  const pose = sampleStroke(stroke, t);
  const angles = measureStroke(stroke, player.anthropometrics, t);
  // Spin exists only once the ball has been struck: show it in the same
  // phases the phase label calls contact and follow-through
  const ballInFlight = pose.phase === "contact" || pose.phase === "followThrough";
  const spinKind = m.avgSpinRpm < 0 ? "backspin" : strokeType === "serve" ? "spin" : "topspin";
  const spinSource = stroke.published?.find((p) => p.id === "fhSpin" || p.id === "bhSpin");

  return (
    <section aria-labelledby="live-h">
      <p className="sf-kicker sf-kicker-muted">Live readout</p>
      <h2 id="live-h" className="mt-1.5 text-lg font-semibold leading-snug tracking-tight">
        {player.shortName} · {stroke.label}
      </h2>

      <div className="sf-readout-grid mt-4">
        <Readout
          label="Racket speed"
          value={pose.racketSpeedMs.toFixed(1)}
          unit="m/s"
          hint={`Peak ${m.peakRacketSpeedMs.toFixed(1)} (modeled)`}
        />
        <Readout
          label="Ball spin"
          value={ballInFlight ? nf.format(Math.abs(m.avgSpinRpm)) : "–"}
          unit={ballInFlight ? "rpm" : undefined}
          hint={
            ballInFlight
              ? `${spinKind}${spinSource ? ", measured average" : ", modeled"}`
              : `Before contact. Typical ${nf.format(Math.abs(m.avgSpinRpm))} rpm ${spinKind}`
          }
        />
        <Readout label="Elbow bend" value={String(Math.round(angles.elbowFlexion))} unit="°" hint="0° is a straight arm" />
        <Readout label="Front knee bend" value={String(Math.round(angles.frontKneeFlexion))} unit="°" hint="0° is a straight leg" />
        <Readout
          label="Shoulder turn"
          value={String(Math.round(Math.abs(angles.trunkRotation)))}
          unit="°"
          hint="Shoulder line vs baseline"
        />
        <Readout
          label="Hip–shoulder gap"
          value={String(Math.round(Math.abs(angles.separation)))}
          unit="°"
          hint={`X-factor, peak ≈ ${m.kineticChain.xFactorDeg}°`}
        />
      </div>
      <p className="mt-2 text-[11px] leading-snug text-[var(--muted)]">
        Angles are measured live from the solved skeleton, so they match what you see.
      </p>
    </section>
  );
}

export function SetupBridge() {
  const playerId = useCoachStore((s) => s.playerId);
  const strokeType = useCoachStore((s) => s.stroke);
  const player = PLAYERS.find((p) => p.id === playerId) ?? PLAYERS[0];
  const athleteLaunch = player.strokes[strokeType].metrics.launchAngleDeg;
  const athleteSwingPath = player.strokes[strokeType].metrics.swingPathDeg;
  const athleteLabel = player.shortName;
  const setup = useGearStore((s) => s.setup);
  const insight = useMemo(
    () => synthesizeCombinedSetup(setup, null, null, null),
    [setup],
  );
  const hasGear = insight.hasAny;
  const launch = insight.launchAngleDeg ?? setup.racketLaunchDeg;
  const path = insight.swingPathDeg ?? setup.racketSwingPathDeg;

  return (
    <div className="sf-panel p-3">
      <p className="sf-kicker">Your combined setup</p>
      {hasGear ? (
        <>
          <p className="mt-1.5 text-sm font-medium text-[var(--foreground)]">
            {insight.playability.headline}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
            Court-ready {insight.playability.score}/100 · {insight.playstyle}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">{setupSummary(setup)}</p>
          {launch != null && path != null ? (
            <p className="mt-2 text-xs leading-relaxed text-[var(--foreground)]/80">
              Molded ~{launch.toFixed(1)}° / ~{path.toFixed(0)}° vs {athleteLabel}&apos;s{" "}
              {athleteLaunch.toFixed(1)}° / {athleteSwingPath.toFixed(0)}°
            </p>
          ) : null}
          <Link
            href="/you"
            className="mt-3 inline-block text-xs text-[var(--accent)] hover:underline"
          >
            Tweak bag
          </Link>
        </>
      ) : (
        <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
          <Link href="/you" className="text-[var(--accent)] hover:underline">
            Finish setup
          </Link>{" "}
          to see your bag vs this stroke.
        </p>
      )}
    </div>
  );
}

export function SciencePanel() {
  const playerId = useCoachStore((s) => s.playerId);
  const strokeType = useCoachStore((s) => s.stroke);
  const player = PLAYERS.find((p) => p.id === playerId) ?? PLAYERS[0];
  const stroke = player.strokes[strokeType];
  const m = stroke.metrics;
  const grip = m.grip.replace(/([A-Z])/g, " $1").toLowerCase();

  const inputs: [string, string][] = [
    ["Contact height", `${m.contactHeightM.toFixed(2)} m`],
    ["Contact in front", `${m.contactDepthM.toFixed(2)} m`],
    ["Launch angle", `${m.launchAngleDeg.toFixed(1)}°`],
    ["Swing path", `${m.swingPathDeg}°`],
    ["X-factor peak", `${m.kineticChain.xFactorDeg}°`],
    ["Hip to hand lag", `${m.kineticChain.proximalDistalLagMs} ms`],
    ["Peak ground force", `${nf.format(m.kineticChain.peakGrfN)} N`],
    ["Grip family", grip],
  ];

  return (
    <section aria-labelledby="model-h" className="space-y-4">
      <div>
        <p id="model-h" className="sf-spec-label">Kinetic chain</p>
        <ol className="mt-2 flex flex-wrap items-center gap-1" aria-label="Order of peak segment speed">
          {m.kineticChain.sequence.map((seg, i) => (
            <li key={seg} className="flex items-center gap-1">
              <span className="sf-chain-step">{seg.replace(/([A-Z])/g, " $1").toLowerCase()}</span>
              {i < m.kineticChain.sequence.length - 1 ? (
                <span aria-hidden className="text-[10px] text-[var(--muted)]">
                  ›
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </div>

      <details className="sf-disclosure">
        <summary>
          <span className="sf-spec-label">Model inputs</span>
          <span className="sf-prov" data-status="modeled">
            Modeled
          </span>
        </summary>
        <p className="mt-2 text-[11px] leading-snug text-[var(--muted)]">
          These numbers shape the animation. They are estimates from published lab ranges, not this athlete&apos;s
          own measurements.
        </p>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5">
          {inputs.map(([k, v]) => (
            <div key={k} className="min-w-0">
              <dt className="text-[11px] text-[var(--muted)]">{k}</dt>
              <dd className="sf-readout text-[13px]">{v}</dd>
            </div>
          ))}
        </dl>
      </details>

      <details className="sf-disclosure">
        <summary>
          <span className="sf-spec-label">Research notes and sources</span>
        </summary>
        <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-[var(--foreground)]/85">
          {m.researchNotes.map((n) => (
            <li key={n} className="border-l border-[var(--line-strong)] pl-3">
              {n}
            </li>
          ))}
        </ul>
        <ul className="mt-3 space-y-1 text-[11px] leading-snug text-[var(--muted)]">
          {m.sources.map((src) => (
            <li key={src}>{src}</li>
          ))}
        </ul>
        <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">{player.biography}</p>
      </details>
    </section>
  );
}
