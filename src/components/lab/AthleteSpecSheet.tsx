"use client";

import type { ReactNode } from "react";
import { PLAYERS } from "@/data/players";
import { PHASE_LABELS, phaseAt } from "@/lib/kinematics";
import { useCoachStore } from "@/store/coachStore";
import type { Provenance, Sourced } from "@/types/biomechanics";

const TAG_TEXT: Record<Provenance, string> = {
  measured: "Measured",
  reported: "Reported",
  modeled: "Modeled",
};

const TAG_HELP: Record<Provenance, string> = {
  measured: "From ball tracking, radar or high-speed video",
  reported: "From an official listing or a credible secondary source",
  modeled: "Our estimate; no published value",
};

/** Small provenance badge. The source is on hover and in the accessible name. */
export function ProvenanceTag({ status, source }: { status: Provenance; source?: string }) {
  const title = `${TAG_HELP[status]}${source ? `. Source: ${source}` : ""}`;
  return (
    <span className="sf-prov" data-status={status} title={title} aria-label={`${TAG_TEXT[status]}. ${title}`}>
      {TAG_TEXT[status]}
    </span>
  );
}

function SpecRow({
  label,
  children,
  item,
}: {
  label: string;
  children: ReactNode;
  item?: Pick<Sourced<unknown>, "status" | "source">;
}) {
  return (
    <div className="sf-spec-row">
      <dt className="sf-spec-label">{label}</dt>
      <dd className="min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className="min-w-0 text-[13px] leading-snug text-[var(--foreground)]">{children}</span>
          {item ? <ProvenanceTag status={item.status} source={item.source} /> : null}
        </div>
      </dd>
    </div>
  );
}

const nf = new Intl.NumberFormat("en-US");

/** Athlete instrument card: body, equipment, grips, published numbers, quirks. */
export function AthleteSpecSheet() {
  const playerId = useCoachStore((s) => s.playerId);
  const strokeType = useCoachStore((s) => s.stroke);
  const t = useCoachStore((s) => s.t);
  const setT = useCoachStore((s) => s.setT);
  const setPlaying = useCoachStore((s) => s.setPlaying);

  const player = PLAYERS.find((p) => p.id === playerId) ?? PLAYERS[0];
  const stroke = player.strokes[strokeType];
  const spec = player.spec;
  const a = player.anthropometrics;
  const H = a.heightM;
  const cm = (ratio: number) => Math.round(H * ratio * 100);
  const currentPhase = phaseAt(stroke, t).phase;
  const grip = spec.grips[strokeType];
  const published = stroke.published ?? [];
  const quirks = stroke.quirks ?? [];

  const jump = (phase: (typeof quirks)[number]["phase"]) => {
    const kf = stroke.keyframes.find((k) => k.phase === phase);
    if (!kf) return;
    setPlaying(false);
    setT(kf.t);
  };

  return (
    <section aria-labelledby="athlete-spec-h" className="space-y-5">
      <div>
        <p className="sf-kicker">Athlete</p>
        <h2 id="athlete-spec-h" className="mt-1.5 text-lg font-semibold tracking-tight">
          {player.name}
        </h2>
        <p className="mt-0.5 text-xs text-[var(--muted)]">
          {player.dominantHand === "left" ? "Left-handed" : "Right-handed"} ·{" "}
          {player.backhandStyle === "oneHanded" ? "one-handed backhand" : "two-handed backhand"} · {player.nationality}
        </p>
      </div>

      <dl className="sf-spec-grid">
        <SpecRow label="Height" item={spec.height}>
          <span className="sf-readout">{spec.height.value.toFixed(2)}</span> m
        </SpecRow>
        <SpecRow label="Mass" item={spec.mass}>
          <span className="sf-readout">{spec.mass.value}</span> kg
        </SpecRow>
        <SpecRow label="Arm span" item={spec.armSpan}>
          <span className="sf-readout">{spec.armSpan.value.toFixed(2)}</span> m
          <span className="text-[var(--muted)]"> (= height)</span>
        </SpecRow>
        <div className="sf-spec-row sf-spec-row-full">
          <dt className="flex items-center justify-between gap-2">
            <span className="sf-spec-label">Segment lengths, cm</span>
            <ProvenanceTag status="modeled" source="Winter (2009) ratios × listed height" />
          </dt>
          <dd className="mt-1.5 grid grid-cols-4 gap-2">
            {(
              [
                ["Upper arm", a.upperArmRatio],
                ["Forearm", a.forearmRatio],
                ["Thigh", a.thighRatio],
                ["Shin", a.shankRatio],
              ] as const
            ).map(([k, r]) => (
              <span key={k} className="min-w-0">
                <span className="sf-readout block text-[13px]">{cm(r)}</span>
                <span className="block text-[10.5px] leading-tight text-[var(--muted)]">{k}</span>
              </span>
            ))}
          </dd>
        </div>
        {grip ? (
          <SpecRow label="Grip" item={grip}>
            {grip.value}
          </SpecRow>
        ) : null}
        <SpecRow label="Racket" item={spec.racket}>
          {spec.racket.value}
        </SpecRow>
        {spec.strings ? (
          <SpecRow label="Strings" item={spec.strings}>
            {spec.strings.value}
          </SpecRow>
        ) : null}
        {spec.notes?.map((n) => (
          <SpecRow key={n.value} label="Note" item={n}>
            {n.value}
          </SpecRow>
        ))}
      </dl>

      <div>
        <p className="sf-spec-label">Published numbers · {stroke.label}</p>
        {published.length ? (
          <ul className="mt-2 divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {published.map((p) => (
              <li key={p.id} className="flex items-start justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="text-[13px] leading-snug">{p.label}</p>
                  {p.note ? <p className="text-[11px] leading-snug text-[var(--muted)]">{p.note}</p> : null}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-[13px]">
                    <span className="sf-readout text-base">
                      {p.value > 0 && p.unit === "cm" ? "+" : ""}
                      {nf.format(p.value)}
                    </span>
                    {p.unit ? <span className="ml-1 text-[var(--muted)]">{p.unit}</span> : null}
                  </span>
                  <ProvenanceTag status={p.status} source={p.source} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
            No published tracking data found for this stroke. Speeds and spin shown here are modeled.
          </p>
        )}
      </div>

      {quirks.length ? (
        <div>
          <p className="sf-spec-label">What to watch</p>
          <ul className="mt-2 space-y-1.5">
            {quirks.map((q) => {
              const live = q.phase === currentPhase;
              return (
                <li key={q.text}>
                  <button
                    type="button"
                    onClick={() => jump(q.phase)}
                    disabled={!q.phase}
                    data-live={live ? "true" : "false"}
                    className="sf-quirk"
                    title={q.source ? `Source: ${q.source}` : undefined}
                  >
                    {q.phase ? <span className="sf-quirk-phase">{PHASE_LABELS[q.phase]}</span> : null}
                    <span className="block text-[13px] leading-snug">{q.text}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
