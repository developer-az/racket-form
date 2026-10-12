"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { PlayerProfile, PlayStyle } from "@/types/playerProfile";
import type { MySetup } from "@/store/gearStore";
import { fhGripLabel } from "@/lib/player/onboarding";
import { GearImg } from "@/components/gear/explorer/GearImg";

export type ProBuild = {
  id: string;
  name: string;
  shortName: string;
  heightM: number;
  dominantHand: "right" | "left";
  backhandStyle: "oneHanded" | "twoHanded";
};

export const PLAY_STYLE_LABEL: Record<PlayStyle, string> = {
  baseliner: "Baseliner",
  "aggressive-baseliner": "Aggressive baseliner",
  counterpuncher: "Counterpuncher",
  "all-court": "All-court",
  "serve-volley": "Serve and volley",
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

function cmToFtIn(cm: number): string {
  const inches = cm / 2.54;
  const ft = Math.floor(inches / 12);
  const rest = Math.round(inches - ft * 12);
  return rest === 12 ? `${ft + 1}′0″` : `${ft}′${rest}″`;
}

function backhandHands(profile: PlayerProfile): "oneHanded" | "twoHanded" | null {
  const bh = profile.grips.backhand;
  if (!bh) return null;
  return bh.startsWith("one") ? "oneHanded" : "twoHanded";
}

/**
 * Nearest pro by body and mechanics: height difference in cm, plus a fixed cost
 * for a different hitting hand (mirrors every stroke) or backhand type.
 */
export function closestPro(profile: PlayerProfile, pros: ProBuild[]): { pro: ProBuild; dCm: number } | null {
  const id = profile.identity;
  if (!id?.heightCm) return null;
  const hand = id.dominantHand;
  const bh = backhandHands(profile);
  let best: { pro: ProBuild; dCm: number; cost: number } | null = null;
  for (const p of pros) {
    const dCm = id.heightCm - p.heightM * 100;
    const cost = Math.abs(dCm) + (hand && hand !== p.dominantHand ? 12 : 0) + (bh && bh !== p.backhandStyle ? 8 : 0);
    if (!best || cost < best.cost) best = { pro: p, dCm, cost };
  }
  return best ? { pro: best.pro, dCm: Math.round(best.dCm) } : null;
}

function BagSlot({
  label,
  name,
  detail,
  img,
  href,
}: {
  label: string;
  name: string | null;
  detail?: string | null;
  img: string | null;
  href: string;
}) {
  return (
    <Link href={href} className="sf-you-slot group">
      <span className="sf-you-slot-img">
        {img && name ? (
          <GearImg src={img} className="h-full w-full object-contain" />
        ) : (
          <span className="sf-spec-label">Empty</span>
        )}
      </span>
      <span className="min-w-0">
        <span className="sf-spec-label block">{label}</span>
        <span className="mt-0.5 block truncate text-[13.5px] font-medium">{name ?? `Add a ${label.toLowerCase()}`}</span>
        {detail ? <span className="block truncate text-[12px] text-[var(--muted)]">{detail}</span> : null}
      </span>
    </Link>
  );
}

export function YouIdentity({
  profile,
  setup,
  pros,
  onEdit,
}: {
  profile: PlayerProfile;
  setup: MySetup;
  pros: ProBuild[];
  onEdit: () => void;
}) {
  const id = profile.identity;
  const name = profile.displayName.trim();
  const twin = useMemo(() => closestPro(profile, pros), [profile, pros]);
  const modelPro = id?.modelPlayerId ? pros.find((p) => p.id === id.modelPlayerId) ?? null : null;

  const facts: string[] = [];
  if (id?.dominantHand) facts.push(id.dominantHand === "left" ? "Left-handed" : "Right-handed");
  if (id?.heightCm) facts.push(`${id.heightCm} cm (${cmToFtIn(id.heightCm)})`);
  if (id?.ntrp) facts.push(`NTRP ${id.ntrp.toFixed(1)}`);
  if (id?.playStyle) facts.push(PLAY_STYLE_LABEL[id.playStyle]);
  if (id?.playingSince) facts.push(`Playing since ${id.playingSince}`);

  const strokes: [string, string][] = [];
  if (profile.grips.forehand) strokes.push(["Forehand", fhGripLabel(profile.grips.forehand)]);
  const bh = backhandHands(profile);
  if (bh) strokes.push(["Backhand", bh === "oneHanded" ? "One-handed" : "Two-handed"]);
  if (profile.grips.serve) {
    const sv = profile.grips.serve.replace("-", " ");
    strokes.push(["Serve", sv.charAt(0).toUpperCase() + sv.slice(1)]);
  }
  const body = profile.constraints.filter((c) => c.active).map((c) => c.label);

  const sessions = profile.sessions.length;
  const hours = profile.stringBeds.reduce((n, b) => n + b.hours, 0);
  const tested = profile.decisions.filter((d) => d.result !== "pending").length;
  const firstDate = [...profile.sessions.map((s) => s.createdAt), ...profile.decisions.map((d) => d.createdAt)].sort()[0];
  const outerGrip = setup.gripLayers?.[setup.gripLayers.length - 1]?.id ?? setup.gripId;
  const incomplete = !name || !id?.heightCm || !id?.dominantHand || !profile.grips.forehand;

  return (
    <section className="sf-you-card">
      <div className="sf-you-head">
        <div className="sf-you-avatar" aria-hidden>
          {initials(name) || (
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="8" r="3.6" />
              <path d="M4.8 20.2c1.2-3.6 4-5.4 7.2-5.4s6 1.8 7.2 5.4" />
            </svg>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="sf-spec-label">Player card</p>
          <h1 className="mt-1 truncate text-[1.75rem] font-semibold leading-tight tracking-[-0.025em] sm:text-[2rem]">
            {name || "Your player card"}
          </h1>
          {facts.length > 0 ? (
            <p className="mt-1.5 text-[13.5px] text-[var(--muted)]">{facts.join(" · ")}</p>
          ) : (
            <p className="mt-1.5 text-[13.5px] text-[var(--muted)]">
              Add your hand, height and grips. The Lab mirrors strokes for lefties and scales the model to your build.
            </p>
          )}
        </div>
        <button type="button" onClick={onEdit} className={`sf-btn ${incomplete ? "sf-btn-primary" : "sf-btn-secondary"} shrink-0 !min-h-10 !text-[13px]`}>
          {incomplete ? "Complete card" : "Edit"}
        </button>
      </div>

      {strokes.length > 0 || twin || modelPro || body.length > 0 ? (
        <div className="sf-you-strip">
          {strokes.map(([k, v]) => (
            <div key={k} className="sf-you-fact">
              <span className="sf-spec-label">{k}</span>
              <span className="sf-you-fact-v">{v}</span>
            </div>
          ))}
          {body.length > 0 ? (
            <div className="sf-you-fact">
              <span className="sf-spec-label">Body</span>
              <span className="sf-you-fact-v text-[var(--amber)]">{body.join(", ")}</span>
            </div>
          ) : null}
          {twin ? (
            <Link href={`/lab?player=${twin.pro.id}`} className="sf-you-fact sf-you-fact-link" title="Nearest by height, hitting hand and backhand type">
              <span className="sf-spec-label">Closest pro build</span>
              <span className="sf-you-fact-v">
                {twin.pro.shortName}{" "}
                <span className="text-[var(--muted)]">
                  {Math.round(twin.pro.heightM * 100)} cm
                  {twin.dCm === 0 ? ", same height" : `, you are ${Math.abs(twin.dCm)} cm ${twin.dCm > 0 ? "taller" : "shorter"}`}
                </span>
              </span>
            </Link>
          ) : null}
          {modelPro ? (
            <Link href={`/lab?player=${modelPro.id}`} className="sf-you-fact sf-you-fact-link">
              <span className="sf-spec-label">Models game on</span>
              <span className="sf-you-fact-v">{modelPro.name}</span>
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="sf-you-bag">
        <BagSlot
          label="Racket"
          name={setup.racketLabel ?? null}
          img={setup.racketSlug ? `/api/equipment/rackets/${encodeURIComponent(setup.racketSlug)}/image` : null}
          href={setup.racketSlug ? `/gear?tab=rackets&racket=${encodeURIComponent(setup.racketSlug)}` : "/gear?tab=rackets"}
        />
        <BagSlot
          label="String"
          name={setup.stringLabel ?? null}
          detail={
            setup.stringLabel
              ? [setup.tensionLbs != null ? `${setup.tensionLbs} lbs` : null, setup.gaugeMm != null ? `${setup.gaugeMm} mm` : null]
                  .filter(Boolean)
                  .join(" · ")
              : null
          }
          img={setup.stringId ? `/api/equipment/strings/${encodeURIComponent(setup.stringId)}/image` : null}
          href={setup.stringId ? `/gear?tab=strings&item=${encodeURIComponent(setup.stringId)}` : "/gear?tab=strings"}
        />
        <BagSlot
          label="Grip"
          name={setup.gripLabel ?? (outerGrip ? "Grip set" : null)}
          detail={setup.gripLayers && setup.gripLayers.length > 1 ? `${setup.gripLayers.length} layers` : null}
          img={outerGrip ? `/api/equipment/grips/${encodeURIComponent(outerGrip)}/image` : null}
          href={outerGrip ? `/gear?tab=grips&item=${encodeURIComponent(outerGrip)}` : "/gear?tab=grips"}
        />
      </div>

      <dl className="sf-you-stats">
        <div>
          <dt className="sf-spec-label">Sessions</dt>
          <dd className="sf-readout">{sessions}</dd>
        </div>
        <div>
          <dt className="sf-spec-label">Hours on beds</dt>
          <dd className="sf-readout">{Math.round(hours * 10) / 10}</dd>
        </div>
        <div>
          <dt className="sf-spec-label">Changes tested</dt>
          <dd className="sf-readout">{tested}</dd>
        </div>
        <div>
          <dt className="sf-spec-label">First log</dt>
          <dd className="sf-readout">
            {firstDate ? new Date(firstDate).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "—"}
          </dd>
        </div>
      </dl>
    </section>
  );
}
