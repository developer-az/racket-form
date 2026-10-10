"use client";

import { useMemo, useState } from "react";
import type { GripProfile, RacketProfile, StringProfile } from "@/types/equipment";
import {
  recommendSetup,
  type FinderAnswers,
  type FinderPick,
} from "@/lib/equipment/setupFinder";
import { equipmentLabel } from "@/lib/equipment/labels";
import { racketImageUrl, stringImageUrl, gripImageUrl } from "@/lib/equipment/media/urls";
import { tensionOutcome } from "@/lib/equipment/strings";
import { useGearStore } from "@/store/gearStore";
import { usePlayerStore } from "@/store/playerStore";
import { EquipmentThumb } from "./EquipmentThumb";

type Question = {
  [K in keyof FinderAnswers]: {
    key: K;
    title: string;
    options: { value: FinderAnswers[K]; label: string; hint: string }[];
  };
}[keyof FinderAnswers];

const QUESTIONS: Question[] = [
  {
    key: "level",
    title: "How long have you been playing?",
    options: [
      { value: "new", label: "Just starting", hint: "Learning to rally" },
      { value: "developing", label: "A year or two", hint: "Rallies, some matches" },
      { value: "competitive", label: "Regular matches", hint: "League / club level" },
      { value: "advanced", label: "Advanced", hint: "Tournaments, high level" },
    ],
  },
  {
    key: "swing",
    title: "What does your forehand swing look like?",
    options: [
      { value: "compact", label: "Short & controlled", hint: "Mostly arm, steady pace" },
      { value: "moderate", label: "Medium", hint: "Some rotation, some pace" },
      { value: "full", label: "Long & fast", hint: "Big loop, heavy ball" },
    ],
  },
  {
    key: "want",
    title: "What would help your game most?",
    options: [
      { value: "power", label: "Easier power", hint: "More depth for less effort" },
      { value: "spin", label: "More spin", hint: "Net clearance that dips in" },
      { value: "control", label: "More control", hint: "Keep big swings in" },
      { value: "comfort", label: "Comfort", hint: "Softer, plusher feel" },
    ],
  },
  {
    key: "arm",
    title: "Any elbow, wrist or shoulder pain?",
    options: [
      { value: "fine", label: "No, I'm good", hint: "Optimize for performance" },
      { value: "sensitive", label: "Yes, sometimes", hint: "Prioritize arm-friendly gear" },
    ],
  },
];

const ANSWER_LABEL: Record<string, string> = Object.fromEntries(
  QUESTIONS.flatMap((q) => q.options.map((o) => [`${q.key}:${o.value}`, o.label])),
);

function withImage<T extends { imageUrl?: string | null }>(item: T, fallback: string): string {
  return item.imageUrl ?? fallback;
}

/**
 * Four taps → a complete starting bag (frame, string + tension, overgrip) with
 * plain-language reasons, saved in one tap. Replaces "go browse 675 frames".
 */
export function SetupFinder({
  rackets,
  strings,
  grips,
  onSaved,
  onBrowse,
  compact = false,
}: {
  rackets: RacketProfile[];
  strings: StringProfile[];
  grips: GripProfile[];
  onSaved?: () => void;
  onBrowse?: () => void;
  compact?: boolean;
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<FinderAnswers>>({});
  const [racketChoice, setRacketChoice] = useState<string | null>(null);
  const setRacket = useGearStore((s) => s.setRacket);
  const setString = useGearStore((s) => s.setString);
  const setGrip = useGearStore((s) => s.setGrip);
  const setPreferences = usePlayerStore((s) => s.setPreferences);

  const done = step >= QUESTIONS.length;
  const rec = useMemo(
    () =>
      done
        ? recommendSetup(answers as FinderAnswers, { rackets, strings, grips })
        : null,
    [done, answers, rackets, strings, grips],
  );

  const racketOptions: FinderPick<RacketProfile>[] = rec ? [rec.racket, ...rec.alternatives] : [];
  const chosen = racketOptions.find((r) => r.item.slug === racketChoice) ?? racketOptions[0];

  const answer = (key: keyof FinderAnswers, value: string) => {
    setAnswers((a) => ({ ...a, [key]: value }));
    setRacketChoice(null);
    setStep((s) => s + 1);
  };

  const save = () => {
    if (!rec || !chosen) return;
    const r = chosen.item;
    setRacket(r.slug, equipmentLabel(r.brand, r.model), {
      idealLaunchAngleDeg: r.idealLaunchAngleDeg,
      idealSwingPathDeg: r.idealSwingPathDeg,
      power: r.power,
      spin: r.spin,
      control: r.control,
      comfort: r.comfort,
      weightG: r.weightG,
      swingweight: r.swingweight,
      balanceMm: r.balanceMm,
    });
    const s = rec.string.item;
    const outcome = tensionOutcome(s, rec.tensionLbs, rec.gaugeMm);
    setString(s.id, equipmentLabel(s.brand, s.name), {
      tensionLbs: rec.tensionLbs,
      gaugeMm: rec.gaugeMm,
      power: outcome.power,
      spin: outcome.spin,
      control: outcome.control,
      comfort: outcome.comfort,
    });
    if (rec.grip) {
      const g = rec.grip.item;
      setGrip(g.id, equipmentLabel(g.brand, g.name), {
        tackiness: g.tackiness,
        cushion: g.cushion,
        absorbency: g.absorbency,
        durability: g.durability,
        kind: g.kind,
      });
    }
    setPreferences({ prefersArmFriendly: answers.arm === "sensitive" });
    onSaved?.();
  };

  if (!done) {
    const q = QUESTIONS[step];
    return (
      <section className="sf-panel px-5 py-6 md:px-8 md:py-8" aria-live="polite">
        <div className="flex items-center justify-between gap-3">
          <p className="sf-kicker">Find my setup · {step + 1} of {QUESTIONS.length}</p>
          {step > 0 ? (
            <button type="button" className="sf-text-link text-xs" onClick={() => setStep((s) => s - 1)}>
              ← Back
            </button>
          ) : onBrowse ? (
            <button type="button" className="sf-text-link text-xs" onClick={onBrowse}>
              Skip, I&apos;ll browse
            </button>
          ) : null}
        </div>
        <div className="mt-3 flex gap-1.5" aria-hidden>
          {QUESTIONS.map((x, i) => (
            <span
              key={x.key}
              className="h-1 flex-1 rounded-full transition-colors"
              style={{ background: i <= step ? "var(--accent)" : "var(--line)" }}
            />
          ))}
        </div>
        <h2
          key={q.key}
          className={`sf-rise mt-5 font-[family-name:var(--font-display)] tracking-tight ${
            compact ? "text-xl" : "text-2xl md:text-3xl"
          }`}
        >
          {q.title}
        </h2>
        <div
          className={`mt-5 grid gap-2.5 ${
            q.options.length === 4 ? "grid-cols-2 md:grid-cols-4" : q.options.length === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"
          }`}
        >
          {q.options.map((o) => (
            <button
              key={o.value}
              type="button"
              data-active={answers[q.key] === o.value}
              onClick={() => answer(q.key, o.value)}
              className="sf-choice group min-h-[76px] hover:shadow-[inset_0_0_0_2px_var(--accent)]"
            >
              <span className="block text-[15px] font-semibold">{o.label}</span>
              <span className="mt-1 block text-xs opacity-75">{o.hint}</span>
            </button>
          ))}
        </div>
        {step === 0 ? (
          <p className="mt-4 text-xs text-[var(--muted)]">
            Four taps. We match frame weight, head size, stiffness, string and tension to how you play.
          </p>
        ) : null}
      </section>
    );
  }

  if (!rec || !chosen) {
    return (
      <section className="sf-panel px-5 py-6">
        <p className="text-sm text-[var(--muted)]">The catalog is still loading. Try again in a moment.</p>
      </section>
    );
  }

  const r = chosen.item;
  const s = rec.string.item;
  const g = rec.grip?.item;
  const summary = QUESTIONS.map((q) => ANSWER_LABEL[`${q.key}:${answers[q.key]}`]).join(" · ");

  return (
    <section className="sf-panel sf-rise px-5 py-6 md:px-8 md:py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="sf-kicker">Your starting setup</p>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl tracking-tight md:text-3xl">
            Here&apos;s a bag that fits your game
          </h2>
          <p className="mt-1.5 text-sm text-[var(--muted)]">{summary}</p>
        </div>
        <button
          type="button"
          className="sf-text-link text-xs"
          onClick={() => {
            setStep(0);
            setRacketChoice(null);
          }}
        >
          Change answers
        </button>
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-[1.35fr_1fr_1fr]">
        <ResultCard
          kicker="Racket"
          title={equipmentLabel(r.brand, r.model)}
          specs={[
            r.weightG != null ? `${r.weightG} g` : null,
            r.headSizeSqIn != null ? `${r.headSizeSqIn} sq in` : null,
            r.stringPattern,
            r.stiffnessRa != null ? `RA ${r.stiffnessRa}` : null,
          ]}
          img={withImage(r, racketImageUrl(r))}
          reasons={chosen.reasons}
        >
          {racketOptions.length > 1 ? (
            <div className="mt-4 border-t border-[var(--line)] pt-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                Also fits you
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {racketOptions.map((o) => (
                  <button
                    key={o.item.slug}
                    type="button"
                    data-active={o.item.slug === r.slug}
                    onClick={() => setRacketChoice(o.item.slug)}
                    className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs font-medium transition hover:border-[var(--accent)] data-[active=true]:border-[var(--accent)] data-[active=true]:bg-[var(--accent)] data-[active=true]:text-[var(--accent-fg)]"
                  >
                    {equipmentLabel(o.item.brand, o.item.model)}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </ResultCard>
        <ResultCard
          kicker="String"
          title={equipmentLabel(s.brand, s.name)}
          specs={[`${rec.tensionLbs} lb`, `${rec.gaugeMm.toFixed(2)} mm`, s.material.replace("-", " ")]}
          img={withImage(s, stringImageUrl(s))}
          reasons={rec.string.reasons}
        />
        {g && rec.grip ? (
          <ResultCard
            kicker="Overgrip"
            title={equipmentLabel(g.brand, g.name)}
            specs={[`Tack ${g.tackiness}`, `Cushion ${g.cushion}`]}
            img={withImage(g, gripImageUrl(g))}
            reasons={rec.grip.reasons}
          />
        ) : null}
      </div>

      <div className="sticky bottom-[calc(var(--app-nav-h,0px)+0.5rem)] z-20 -mx-2 mt-6 flex flex-wrap items-center gap-3 rounded-[var(--radius)] bg-[color-mix(in_srgb,var(--panel)_92%,transparent)] px-2 py-2 backdrop-blur-md lg:static lg:mx-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
        <button type="button" onClick={save} className="sf-btn sf-btn-primary sf-btn-glow">
          Save to my bag
        </button>
        {onBrowse ? (
          <button type="button" onClick={onBrowse} className="sf-text-link text-sm">
            Browse everything instead
          </button>
        ) : null}
        <p className="hidden text-xs text-[var(--muted)] sm:block">You can swap any piece later.</p>
      </div>
    </section>
  );
}

function ResultCard({
  kicker,
  title,
  specs,
  img,
  reasons,
  children,
}: {
  kicker: string;
  title: string;
  specs: (string | null)[];
  img: string;
  reasons: string[];
  children?: React.ReactNode;
}) {
  return (
    <article className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel)] p-4">
      <div className="flex gap-3">
        <EquipmentThumb src={img} alt={title} size="md" />
        <div className="min-w-0">
          <p className="sf-kicker !text-[10px]">{kicker}</p>
          <h3 className="mt-1 font-[family-name:var(--font-display)] text-lg leading-tight tracking-tight">{title}</h3>
          <p className="mt-1 text-xs text-[var(--muted)]">{specs.filter(Boolean).join(" · ")}</p>
        </div>
      </div>
      <ul className="mt-3 space-y-1.5 text-sm leading-snug">
        {reasons.map((reason) => (
          <li key={reason} className="flex gap-2">
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" aria-hidden />
            <span>{reason}</span>
          </li>
        ))}
      </ul>
      {children}
    </article>
  );
}
